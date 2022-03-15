import { ethers, BigNumber } from "ethers";
import { OrderBookSwapLogic__factory, SettlementLogic__factory } from "./contracts";
import Order from "./types/Order";
import config from "./config";
import { Currency, Pair, Token } from "@sushiswap/sdk";
import { Utils } from "./Utils";
import Log from "./Log";
import { formatEther, parseEther } from "ethers/lib/utils";
import swapAbi from "./config/abi_sovrynSwap.json";
import Db from "./Db";

export type OnCreateOrder = (hash: string) => Promise<void> | void;
export type OnCancelOrder = (hash: string) => Promise<void> | void;

const LIMIT = 20;
const BLOCKS_PER_DAY = 20000;

const equalsCurrency = (currency1: Currency, currency2: Currency) => {
    return currency1.name === currency2.name;
}

class Orders {
    private static async fetchCanceledHashes(provider: ethers.providers.BaseProvider) {
        const fromBlock = (await provider.getBlockNumber()) - BLOCKS_PER_DAY;
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const filter = settlement.filters.OrderCanceled(null);
        return (await settlement.queryFilter(filter, fromBlock)).map(event => event.args![0]);
    }

    private static async fetchHashes(kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookSwapLogic__factory.connect(config.contracts.orderBook, kovanProvider);
        const length = (await orderBook.numberOfAllHashes()).toNumber();
        const pages: number[] = [];
        for (let i = 0; i * LIMIT < length; i++) pages.push(i);
        return (await Promise.all(pages.map(async page => await orderBook.allHashes(page, LIMIT))))
            .flat()
            .filter(hash => hash !== ethers.constants.HashZero);
    }

    static async fetch(provider: ethers.providers.BaseProvider, kovanProvider: ethers.providers.BaseProvider) {
        try {
            const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
            const canceledHashes = await Orders.fetchCanceledHashes(provider);
            const hashes = await Orders.fetchHashes(kovanProvider);
            const now = Math.floor(Date.now() / 1000);
            return (
                await Promise.all(
                    hashes
                        .filter(hash => !canceledHashes.includes(hash))
                        .map(async hash => {
                            const order = await this.fetchOrder(hash, kovanProvider);
                            if (order.deadline.toNumber() < now) return null;
                            const filledAmountIn = await settlement.filledAmountInOfHash(hash);
                            if (order.amountIn.eq(filledAmountIn)) return null;
                            if (!this.validOrderParams(order)) return null;
                            return order;
                        })
                )
            ).filter(order => !!order);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async fetchOrder(hash: string, kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookSwapLogic__factory.connect(config.contracts.orderBook, kovanProvider);
        const {
            maker,
            fromToken,
            toToken,
            amountIn,
            amountOutMin,
            recipient,
            deadline,
            created,
            v,
            r,
            s
        } = await orderBook.orderOfHash(hash);
        return {
            hash,
            maker,
            fromToken,
            toToken,
            amountIn,
            amountOutMin,
            recipient,
            deadline,
            created,
            v,
            r,
            s
        } as Order;
    }

    static watch(
        onCreateOrder: OnCreateOrder,
        onCancelOrder: OnCancelOrder,
        provider: ethers.providers.BaseProvider,
        kovanProvider: ethers.providers.BaseProvider
    ) {
        const orderBook = OrderBookSwapLogic__factory.connect(config.contracts.orderBook, kovanProvider);
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        orderBook.on("OrderCreated", onCreateOrder);
        settlement.on("OrderCanceled", onCancelOrder);
    }

    static parseOrder(orderJSON): Order {
        return {
            ...orderJSON,
            amountIn: BigNumber.from(orderJSON.amountIn),
            amountOutMin: BigNumber.from(orderJSON.amountOutMin),
            deadline: BigNumber.from(orderJSON.deadline),
            created: BigNumber.from(orderJSON.created),
        };
    }

    static validOrderParams(order: Order) {
        const fromToken = order.fromToken.toLowerCase();
        const toToken = order.toToken.toLowerCase();
        const validFromToken = config.tokens.find(token => token.address.toLowerCase() == fromToken);
        const validToToken = config.tokens.find(token => token.address.toLowerCase() == toToken);
        return validFromToken != null && validToToken != null;
    }

    static async estimateOrderFee(provider: ethers.providers.BaseProvider, tokenIn: Token, amountIn: BigNumber): Promise<BigNumber> {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const swap = new ethers.Contract(config.contracts.sovrynSwap, swapAbi, provider);
        const relayerFeePercent = await settlement.relayerFeePercent();
        let txFee = await settlement.minSwapOrderTxFee();
        let orderFee = amountIn.mul(relayerFeePercent).div(parseEther('100')); //div 10^20
        const wrbtcAdr = Utils.getTokenAddress('wrbtc').toLowerCase();

        if (tokenIn.address.toLowerCase() != wrbtcAdr) {
            const path = await swap.conversionPath(wrbtcAdr, tokenIn.address);
            txFee = await swap.rateByPath(path, txFee);
        }

        if (orderFee.lt(txFee)) return txFee;
        return orderFee;
    }

    static async checkTradable(provider: ethers.providers.BaseProvider, pairs: Pair[], tokenIn: Token, tokenOut: Token, order: Order)
    : Promise<boolean> 
    {
        let amountIn = order.amountIn;
        let amountOutMin = order.amountOutMin;
        let bestPair, bestAmountOut;
        for (let i = 0; i < pairs.length; i++) {
            const { token0, token1 } = pairs[i];
            if (equalsCurrency(token0, tokenIn) && equalsCurrency(token1, tokenOut) ||
                equalsCurrency(token0, tokenOut) && equalsCurrency(token1, tokenIn)
            ) {
                try {
                    const estFee = await this.estimateOrderFee(provider, tokenIn, amountIn);
                    if (amountIn.lt(estFee)) {
                        Log.e("Order size's too small for relayer fee, hash", order.hash, ", amountIn:", formatEther(amountIn), tokenIn.name, 
                            "est fee:", formatEther(estFee));
                        await Db.addOrder(order, { status: 'failed_smallOrder' })
                        continue;
                    }

                    const actualAmountIn = amountIn.sub(estFee);
                    const amountOut = await Utils.convertTokenAmount(tokenIn.address, tokenOut.address, actualAmountIn);
                    Log.d(
                        'Orders.checkTradable: hash', order.hash,
                        '\n\tamountIn', formatEther(amountIn),
                        '\n\tamountOut', formatEther(amountOut),
                        '\n\tamountOutMin', formatEther(amountOutMin),
                        '\n\testFee', formatEther(estFee), tokenIn.name,
                        '\n\tprice', Number(amountOut) / Number(actualAmountIn), tokenIn.name + '/' + tokenOut.name
                    );
                    if (amountOut.gte(amountOutMin) && (bestPair == null || amountOut.gt(bestAmountOut))) {
                        bestPair = pairs[i];
                        bestAmountOut = amountOut;
                    }
                } catch (error) {
                    Log.e(error);
                }
            }
        }

        return bestPair != null;
    };

    static async argsForOrder (order: Order, signer: ethers.Signer) {
        const contract = SettlementLogic__factory.connect(config.contracts.settlement, signer);
        const swapContract = new ethers.Contract(config.contracts.sovrynSwap, swapAbi, signer);
        const fromToken = order.fromToken;
        const toToken = order.toToken;
        const path = await swapContract.conversionPath(fromToken, toToken);
        const arg = {
            order,
            amountToFillIn: order.amountIn,
            amountToFillOut: order.amountOutMin,
            path: path
        };

        try {
            const gasLimit = await contract.estimateGas.fillOrder(arg);
            Log.d('gasLimit', Number(gasLimit));
            return arg;
        } catch (e) {
            Log.w("  " + order.hash + " will revert");
            Log.e(e);
            await Db.updateFilledOrder(await signer.getAddress(), order.hash, '', 'failed', '');
            return null;
        }
    }
}

export default Orders;
