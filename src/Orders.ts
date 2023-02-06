/**
 * Spot Order controller
 * Provide all helper functions for spot order
 */
import _ from 'lodash';
import { ethers, BigNumber, Contract } from "ethers";
import { OrderBookSwapLogic__factory, SettlementLogic, SettlementLogic__factory } from "./contracts";
import Order from "./types/Order";
import config from "./config";
import { Currency, Pair, Token } from "@sushiswap/sdk";
import { Utils } from "./Utils";
import Log from "./Log";
import { formatEther, parseEther } from "ethers/lib/utils";
import swapAbi from "./config/abi_sovrynSwap.json";
import Db from "./Db";
import RSK from "./RSK";
import TokenEntry from "./types/TokenEntry";
import PriceFeeds from "./PriceFeeds";
import OrderStatus from "./types/OrderStatus";
import erc20Abi from "./config/abi_erc20.json";

export type OnCreateOrder = (hash: string) => Promise<void> | void;
export type OnCancelOrder = (hash: string) => Promise<void> | void;

const LIMIT = 20;
const BLOCKS_PER_DAY = 20000;
let _relayerFeePercent, _minSwapOrderTxFee;

const equalsCurrency = (currency1: Currency, currency2: Currency) => {
    return currency1.name === currency2.name;
}

/**
 * Load relayerFeePercent from Settlement contract
 */
const getRelayerFeePercent = async (settlement: SettlementLogic) => {
    if (!_relayerFeePercent) {
        _relayerFeePercent = await settlement.relayerFeePercent();
    }
    return _relayerFeePercent;
}

/**
 * Load minSwapOrderTxFee from Settlement contract
 */
const getMinSwapOrderTxFee = async (settlement: SettlementLogic) => {
    if (!_minSwapOrderTxFee) {
        _minSwapOrderTxFee = await settlement.minSwapOrderTxFee();
    }
    return _minSwapOrderTxFee;
}

class Orders {
    /**
     * Load all canceled hashes of sport orders
     */
    private static async fetchCanceledHashes(provider: ethers.providers.BaseProvider) {
        const fromBlock = (await provider.getBlockNumber()) - BLOCKS_PER_DAY;
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const filter = settlement.filters.OrderCanceled(null);
        return (await settlement.queryFilter(filter, fromBlock)).map(event => event.args![0]);
    }

    /**
     * Load all spot orders hash from OrderBook contract
     */
    private static async fetchHashes(kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookSwapLogic__factory.connect(config.contracts.orderBook, kovanProvider);
        const length = (await orderBook.numberOfAllHashes()).toNumber();
        const pages: number[] = [];
        for (let i = 0; i * LIMIT < length; i++) pages.push(i);
        return (await Promise.all(pages.map(async page => await orderBook.allHashes(page, LIMIT))))
            .flat()
            .filter(hash => hash !== ethers.constants.HashZero);
    }

    /**
     * Load detail of all spot orders, not include canceled, filled, expired orders
     */
    static async fetch(provider: ethers.providers.BaseProvider, kovanProvider: ethers.providers.BaseProvider) {
        try {
            const canceledHashes = await Orders.fetchCanceledHashes(provider);
            const hashes = await Orders.fetchHashes(kovanProvider);
            const now = Math.floor(Date.now() / 1000);

            const batchSize = 10;
            const orders = [];

            for (let i = 0; i < hashes.length; i += batchSize) {
                const batchedHashes = hashes.slice(i, i+batchSize);

                const _orders = (
                    await Promise.all(
                        batchedHashes
                            .filter(hash => !canceledHashes.includes(hash))
                            .map(async hash => {
                                const added = await Db.checkOrderHash(hash);
                                if (added) return null;
    
                                const order = await this.fetchOrder(hash, kovanProvider);
                                if (order.deadline.toNumber() < now) return null;
                                if (await this.checkFilledOrder(order, provider)) return null;
                                if (!this.validOrderParams(order)) return null;
    
                                await Db.addOrder(order, { status: OrderStatus.open });

                                return order;
                            })
                    )
                ).filter(order => !!order);

                if (_orders.length > 0) {
                    orders.push(..._orders);
                }
            }

            return orders;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    /**
     * Load detail of order hash
     */
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

    /**
    * Parse spot order from JSON object
    * This will be used when load order detail from db
    */
    static parseOrder(orderJSON): Order {
        return {
            ...orderJSON,
            amountIn: BigNumber.from(orderJSON.amountIn),
            amountOutMin: BigNumber.from(orderJSON.amountOutMin),
            deadline: BigNumber.from(orderJSON.deadline),
            created: BigNumber.from(orderJSON.created),
            matchPercent: orderJSON.matchPercent
        };
    }

    /**
     * Check margin order valid
     * order.fromToken, order.toToken need to be in config.tokens list
     */
    static validOrderParams(order: Order) {
        const fromToken = order.fromToken.toLowerCase();
        const toToken = order.toToken.toLowerCase();
        const validFromToken = config.tokens.find(token => token.address.toLowerCase() == fromToken);
        const validToToken = config.tokens.find(token => token.address.toLowerCase() == toToken);
        return validFromToken != null && validToToken != null;
    }

    /**
     * Calculate fee for relayer
     */
    static async estimateOrderFee(provider: ethers.providers.BaseProvider, tokenIn: Token, amountIn: BigNumber): Promise<BigNumber> {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const relayerFeePercent = await getRelayerFeePercent(settlement);
        let txFee = await getMinSwapOrderTxFee(settlement);
        let orderFee = amountIn.mul(relayerFeePercent).div(parseEther('100')); //div 10^20
        const wrbtcAdr = Utils.getTokenAddress('wrbtc').toLowerCase();

        if (tokenIn.address.toLowerCase() != wrbtcAdr) {
            const rbtcPrice = PriceFeeds.getPrice(wrbtcAdr, tokenIn.address);
            txFee = BigNumber.from(txFee).mul(parseEther(rbtcPrice)).div(ethers.constants.WeiPerEther);
        }

        if (orderFee.lt(txFee)) return txFee;
        return orderFee;
    }

    /**
     * Check if a spot order could be trade or not.
     * Order could be trade when current amount out (subtracted relayer fee) >= order.amountOutMin
     */
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
                        await Db.addOrder(order, { status: OrderStatus.failed_smallOrder });
                        continue;
                    }

                    const actualAmountIn = amountIn.sub(estFee);
                    const amountOut = await Utils.convertTokenAmount(tokenIn.address, tokenOut.address, actualAmountIn);
                    const matchPercent = amountOut.mul(100).div(amountOutMin).toNumber();

                    Db.updateOrderDetail(order.hash, { ...order, matchPercent: matchPercent });

                    if (matchPercent > 90) {
                        Log.d(
                            'Orders.checkTradable: hash', order.hash, matchPercent.toFixed(1) + '% matched',
                            '\n\tamountIn', formatEther(amountIn),
                            '\n\tamountOut', formatEther(amountOut),
                            '\n\tamountOutMin', formatEther(amountOutMin),
                            '\n\testFee', formatEther(estFee), tokenIn.name,
                            '\n\tprice', Number(amountOut) / Number(actualAmountIn), tokenIn.name + '/' + tokenOut.name
                        );
                    }

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

    /**
     * Get arguments of a spot order for calling settlement.fillOrder methods
     */
    static async argsForOrder (order: Order, signerOrProvider: ethers.Signer | ethers.providers.BaseProvider) {
        // const contract = SettlementLogic__factory.connect(config.contracts.settlement, signerOrProvider);
        const swapContract = new ethers.Contract(config.contracts.sovrynSwap, swapAbi, signerOrProvider);
        const fromToken = order.fromToken;
        const toToken = order.toToken;
        const path = await swapContract.conversionPath(fromToken, toToken);
        const arg = {
            order,
            amountToFillIn: order.amountIn,
            amountToFillOut: order.amountOutMin,
            path: path
        };

        return arg;
    }

    /**
     * Load order detail for orderbook showing on client
     */
    static async parseOrderDetail(order: Order, checkFee = false) {
        const orderDetail: any = {
            id: order.id,
            hash: order.hash,
            maker: order.maker,
            fromToken: order.fromToken,
            toToken: order.toToken,
            recipient: order.recipient,
            deadline: new Date(order.deadline.toNumber() * 1000),
            created: new Date(order.created.toNumber() * 1000),
            status: order.status,
            relayer: order.relayer,
            txHash: order.txHash,
            pair: order.pair,
            matchPercent: order.matchPercent,
            filledPrice: order.filledPrice
        };
        
        const pairTokens = this.getPair(order.fromToken, order.toToken);

        if (orderDetail.fromToken.toLowerCase() == pairTokens[0].address.toLowerCase()) {
            orderDetail.fromSymbol = pairTokens[0].name;
            orderDetail.toSymbol = pairTokens[1].name;
            orderDetail.isSell = true;
        } else {
            orderDetail.fromSymbol = pairTokens[1].name;
            orderDetail.toSymbol = pairTokens[0].name;
            orderDetail.isSell = false;
        }

        orderDetail.amountIn = Utils.shortNum(formatEther(order.amountIn)) + ' ' + orderDetail.fromSymbol;
        orderDetail.amountOutMin = Utils.shortNum(formatEther(order.amountOutMin)) + ' ' + orderDetail.toSymbol;

        if (checkFee) {
            const fee = await Orders.estimateOrderFee(RSK.Mainnet.provider, { address: order.fromToken } as any, order.amountIn);
            const actualAmountIn = BigNumber.from(order.amountIn).sub(fee);
            const limitPrice = BigNumber.from(order.amountOutMin).mul(ethers.constants.WeiPerEther).div(actualAmountIn);
            orderDetail.estFee = formatEther(fee) + ' ' + orderDetail.fromSymbol;
            orderDetail.currentPrice = await PriceFeeds.getPrice(order.fromToken, order.toToken);

            if (orderDetail.isSell) {
                orderDetail.limitPrice = ">= " + Utils.shortNum(formatEther(limitPrice));
            } else {
                orderDetail.limitPrice = "<= " + Utils.shortNum(1 / Number(formatEther(limitPrice)));
                orderDetail.currentPrice = String(1/Number(orderDetail.currentPrice));
            }
            orderDetail.currentPrice = Utils.shortNum(orderDetail.currentPrice);
        }

        return orderDetail;
    }

    /**
     * Find valid pair for 2 token addresses
     */
    static getPair(adr1: string, adr2: string): TokenEntry[] {
        const i1 = config.tokens.findIndex(t => t.address.toLowerCase() == adr1.toLowerCase());
        const i2 = config.tokens.findIndex(t => t.address.toLowerCase() == adr2.toLowerCase());
        if (i1 < 0 || i2 < 0) {
            throw "Wrong token: " + adr1 + '-' + adr2;
        }

        return i1 < i2 ? [config.tokens[i1], config.tokens[i2]]
            : [config.tokens[i2], config.tokens[i1]];
    }


    /**
     * Check if spot order whether filled or not
     */
    static async checkFilledOrder(order: Order, provider: ethers.providers.BaseProvider) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const filledAmountIn = await settlement.filledAmountInOfHash(order.hash);
        if (order.amountIn.eq(filledAmountIn)) {
            const added = await Db.checkOrderHash(order.hash);
            if (!added) {
                new Promise(async (resolve) => {
                    const filterFilled = settlement.filters.FeeTransferred(order.hash);
                    const event = await settlement.queryFilter(filterFilled);
                    const filler = event && event[0] && event[0].args && event[0].args.recipient;
                    if (filler) {
                        await Db.addOrder(order, { status: OrderStatus.filled });
                        await Db.updateOrderFiller(order.hash, {filler, isSpot: true, filledTx: event[0].transactionHash});
                        console.log("Check spot order %s filled, amount %s, filler %s", order.hash, formatEther(filledAmountIn), filler);
                    }
                    resolve(null);
                });
            } else if (added.status != OrderStatus.filled) {
                Db.updateOrdersStatus([order.hash], OrderStatus.filled, null, true);
            }
            return true;
        }
        return false;
    }

    /**
     * Filter spot orders that would be executed successfully by simulating fillOrders transaction.
     * Filtered out cancelled, filled orders
     * Check if spot orders have enough rbtc balance on the settlement contract, or enough token balance on owner wallet
     * If all params is correct, it will check if amount out of AMM > order.amountOutMin, then re-open it
     */
    static async checkSimulatedTransaction(orders: Order[], provider: ethers.providers.BaseProvider) {
        const executables: Order[] = [];
        const p = this;

        await Promise.all(orders.map(async (order) => {
            try {
                const enoughBal = await p.checkOrderOwnerBalance(order, provider);

                if (!enoughBal) {
                    if (order.created.toNumber() + config.depositThresold * 60 > Date.now()/1000) {
                        return; //Skip checking balance for 5 minutes from order created time
                    }

                    return Db.updateOrdersStatus([order.hash], OrderStatus.failed_notEnoughBalance, null, true);
                }

                const txData = await p.getFillOrdersData([order], provider);
                const simulatedTx = await provider.call(txData);
                // Log.d('simulatedTx', simulatedTx);
                executables.push(order);

                if (order.status != OrderStatus.matched) {
                    return Db.updateOrdersStatus([order.hash], OrderStatus.matched, null, true);
                }

            } catch (e) {
                Log.e('Failed to simulate tx for spot order: ' + order.hash);
                Log.e(JSON.stringify(e, null, 2));
                const revertedError: string = e.error && e.error.body;
                if (revertedError) {
                    if (revertedError.indexOf('already-filled') >= 0 && (order.status != OrderStatus.filled && order.status != OrderStatus.success)) {
                        return p.checkFilledOrder(order, provider);
                    }
                    if (revertedError.indexOf('order-canceled') >= 0 && order.status != OrderStatus.canceled) {
                        return Db.updateOrdersStatus([order.hash], OrderStatus.canceled, null, true);
                    }
                    if (revertedError.indexOf('order-expired') >= 0 && order.status != OrderStatus.expired) {
                        return Db.updateOrdersStatus([order.hash], OrderStatus.expired, null, true);
                    }
                    if (revertedError.indexOf('insufficient-amount-out') >= 0 && order.status != OrderStatus.open) {
                        //re-open order for matching price next time
                        return Db.updateOrdersStatus([order.hash], OrderStatus.open, null, true);
                    }
                    if (revertedError.indexOf('insufficient-balance') >= 0) {
                        //not enough deposited rBTC balance on Settlement
                        return Db.updateOrdersStatus([order.hash], OrderStatus.failed_notEnoughBalance, null, true);
                    }
                    if (revertedError.indexOf('SafeERC20: low-level call failed') >= 0) {
                        //skip checking this message, not sure where it come
                        executables.push(order);
                        return;
                    }
                    return Db.updateOrdersStatus([order.hash], OrderStatus.failed, null, true);
                }
            }
        }));

        return executables;
    }


    /**
     * Get transaction data of settlememt.fillOrders method
     */
    static async getFillOrdersData(orders: Order[], provider: ethers.providers.BaseProvider) {
        const contract = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const args = (
            await Promise.all(
                orders.map(order => Orders.argsForOrder(order, provider))
            )
        ).filter(arg => arg !== null);

        if (args.length > 0) {
            const txData = await contract.populateTransaction.fillOrders(args, {
                gasLimit: String(1000000 * orders.length)
            });
            return txData;
        }
    }

    static async checkOrderOwnerBalance(order: Order, provider: ethers.providers.BaseProvider) {
        let bal = BigNumber.from(0);
        if (Utils.getTokenSymbol(order.fromToken) == 'WRBTC') {
            const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
            bal = await settlement.balanceOf(order.maker);
        } else {
            const token = new Contract(order.fromToken, erc20Abi, provider);
            bal = await token.balanceOf(order.maker);
        }

        return bal.gte(order.amountIn);
    }
}

export default Orders;

