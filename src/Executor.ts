import {
    Pair,
    Token,
    Currency,
} from "@sushiswap/sdk";
import _ from 'lodash';
import swapAbi from "./config/abi_sovrynSwap.json";
import erc20Abi from "./config/abi_erc20.json";
import { BigNumber, constants, Contract, ContractReceipt, ContractTransaction, ethers, Signer } from "ethers";
import Order, { BaseOrder } from "./types/Order";
import Log from "./Log";
import { SettlementLogic__factory } from "./contracts";
import MarginOrder from "./types/MarginOrder";
import config from "./config";
import Db from "./Db";
import { Utils } from "./Utils";
import MarginOrders from "./MarginOrders";
import { formatEther } from "ethers/lib/utils";
import RSK from "./RSK";
import Orders from "./Orders";
import OrderModel from "./models/OrderModel";

export type OnOrderFilled = (
    hash: string,
    amountIn: ethers.BigNumber,
    amountOut: ethers.BigNumber
) => Promise<void> | void;

export type OnFeeTransferred = (
    hash: string,
    recipient: string
) => Promise<void> | void;

const checkOrdersAllowance = async (provider: ethers.providers.BaseProvider, orders: Order[]) => {
    const result = [];
    const makers = _.uniqBy(orders, o => o.maker + ':' + o.fromToken)
        .map(o => ({ maker: o.maker, token: o.fromToken }));
    const allowances = await Promise.all(makers.map(async ({ maker, token }) => {
        const tokenContract = new Contract(token, <any>erc20Abi, provider);
        let allowance;
        if (token.toLowerCase() === Utils.getTokenAddress('wrbtc').toLowerCase()) {
            const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
            allowance = await settlement.balanceOf(maker);
        } else {
            allowance = await tokenContract.allowance(maker, config.contracts.settlement);
        }

        return { maker, token, allowance: BigNumber.from(String(allowance)) };
    }));

    _.sortBy(orders, 'maker', order => -Number(formatEther(order.amountIn)))
        .forEach(order => {
            const validAllowance = allowances.find(o => {
                return o.maker === order.maker && o.token === order.fromToken
                    && o.allowance.gte(order.amountIn);
            });
            if (validAllowance) {
                result.push(order);
                validAllowance.allowance = validAllowance.allowance.sub(order.amountIn);
            }
        });

    return result
};

/**
 * Calculate swap|margin order fee and return profit in xusd
 */
const calculateProfit = async (provider: ethers.providers.BaseProvider, order: BaseOrder, tx: ContractReceipt, orderInBatch: number, gasPrice: BigNumber) => {
    const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
    const swap = new Contract(config.contracts.sovrynSwap, swapAbi, provider);
    let orderSizeUsd: BigNumber;
    let minTxFee: BigNumber;
    let usdToken: string = Utils.getTokenAddress('xusd');

    if ((order as Order).maker) {
        const limitOrder = order as Order;
        orderSizeUsd = await Utils.convertUsdAmount(limitOrder.fromToken, limitOrder.amountIn);
        minTxFee = await settlement.minSwapOrderTxFee();
    } else {
        const marginOrder = order as MarginOrder;
        orderSizeUsd = await MarginOrders.getOrderSize(marginOrder, provider);
        minTxFee = await settlement.minMarginOrderTxFee();
    }

    let orderFee = orderSizeUsd.mul(2).div(1000); // 0.2% fee
    const wrbtcAdr = Utils.getTokenAddress('wrbtc');
    const rbtcPath = await swap.conversionPath(wrbtcAdr, usdToken);
    const minTxFeeUsd = await swap.rateByPath(rbtcPath, minTxFee);

    if (minTxFeeUsd.gt(orderFee)) {
        orderFee = minTxFeeUsd;
    }

    const txFee = await Utils.convertUsdAmount(wrbtcAdr, tx.gasUsed.mul(gasPrice).div(orderInBatch));
    return formatEther(orderFee.sub(txFee));
}

class Executor {
    provider: ethers.providers.BaseProvider;
    checkingHashes: any = {};

    constructor(provider: ethers.providers.BaseProvider) {
        this.provider = provider;
    }

    watch(onOrderFilled: OnOrderFilled) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        settlement.on("OrderFilled", onOrderFilled);
    }

    watchMargin(onOrderFilled: OnOrderFilled) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        settlement.on("MarginOrderFilled", onOrderFilled);
    }

    watchFeeTranfered(onFeeTransferred: OnFeeTransferred) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        settlement.on("FeeTransferred", onFeeTransferred);
    }

    async filledAmountIn(hash: string) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        return await settlement.filledAmountInOfHash(hash);
    }

    async match(tokens: Token[], pairs: Pair[], timeout: number) {
        const executables: Order[] = [];
        const now = Date.now();
        const openOrders: Order[] = await Db.findOrders('limit', {
            status: OrderModel.Statuss.open,
            batchId: null
        });
        Log.d(`Checking ${openOrders.length} open spot orders`);

        for (const order of openOrders) {
            const orderInDb = await Db.checkOrderHash(order.hash);

            // skip checking order if it's been filled in another checking round
            if (orderInDb.status != OrderModel.Statuss.open || this.checkFillBatchOrders[order.hash]) {
                continue;
            }

            this.checkFillBatchOrders[order.hash] = true;

            const fromToken = Utils.findToken(tokens, order.fromToken);
            const toToken = Utils.findToken(tokens, order.toToken);
            const filledAmountIn = await this.filledAmountIn(order.hash);
            let matched = false;

            if (fromToken && toToken && order.deadline.toNumber() * 1000 >= now && filledAmountIn.lt(order.amountIn)) {
                const tradable = await Orders.checkTradable(
                    this.provider,
                    pairs,
                    fromToken,
                    toToken,
                    order,
                );
                const orderSize = await Utils.convertUsdAmount(order.fromToken, order.amountIn);
                if (tradable && orderSize.gt(config.minOrderSize)) {
                    executables.push(order);
                    await Db.updateOrdersStatus([order.hash], OrderModel.Statuss.matched);
                    const aux = order.trade
                        ? " at " +
                        order.trade?.executionPrice.toFixed(8) +
                        " " +
                        order.trade.route.path[order.trade.route.path.length - 1].symbol +
                        "/" +
                        order.trade.route.path[0].symbol
                        : "";
                    Log.d("Spot order matched: " + order.hash + aux);
                    matched = true;
                }
            }

            delete this.checkFillBatchOrders[order.hash];
            if (Date.now() - now > timeout) break;
        }

        return executables;
    }

    async matchMarginOrders() {
        const openOrders: MarginOrder[] = await Db.findOrders('margin', {
            status: OrderModel.Statuss.open,
            batchId: null
        });
        Log.d(`Checking ${openOrders.length} open margin orders`);
        const executables: MarginOrder[] = [];

        for (const order of openOrders) {
            const orderInDb = await Db.checkOrderHash(order.hash);
            if (orderInDb.status != OrderModel.Statuss.open || this.checkFillBatchOrders[order.hash]) {
                continue;
            }
            
            this.checkFillBatchOrders[order.hash] = true;
            const tradable = await MarginOrders.checkTradable(this.provider, order);
            if (tradable) {
                executables.push(order);
                await Db.updateOrdersStatus([order.hash], OrderModel.Statuss.matched);
                Log.d(`Margin order matched: ` + order.hash);
            }

            delete this.checkFillBatchOrders[order.hash];
        }

        return executables;
    }

    async checkFillBatchOrders(net: RSK, type = 'limit', retryBatchId: string = null) {
        try {
            Log.d("Start checking for filling batch orders, type", type);
            const isLimitOrder = type == 'limit';
            let orders: BaseOrder[] = await Db.findOrders(type, {
                batchId: retryBatchId,
                status: !!retryBatchId ? OrderModel.Statuss.retrying : OrderModel.Statuss.matched
            });

            if (isLimitOrder) {
                orders = await checkOrdersAllowance(this.provider, orders as Order[]);
            }

            const batches = _.chunk(orders, config.maxOrdersInBatch);
            Log.d(`processing ${orders.length} ${type} orders on ${batches.length} batches`);

            for (const batchOrders of batches) {
                const signer = await net.getWallet();
                if (signer == null) {
                    console.log(net.pendingHashes);
                    Log.d("No wallet available");
                    continue;
                }

                const batchId = retryBatchId || Utils.getUuid();
                await Db.updateOrdersStatus(batchOrders.map(order => order.hash), OrderModel.Statuss.filling, batchId);
                Log.d('batch:', batchId, batchOrders.map(order => order.hash))

                const signerAdr = await signer.getAddress();
                let fill: Promise<ContractTransaction>;

                if (isLimitOrder) {
                    fill = this.fillOrders(net, batchOrders as Order[], signer, batchId);
                } else {
                    fill = this.fillMarginOrders(net, batchOrders as MarginOrder[], signer, batchId);
                }

                fill.then(async (tx) => {
                    Log.d('tx hash', tx.hash, 'nonce', tx.nonce);
                    for (const order of batchOrders) {
                        await Db.updateFilledOrder(signerAdr, order.hash, tx.hash, OrderModel.Statuss.filling, "");
                    }
                    const receipt = await tx.wait();
                    net.removeHash(batchId);
                    for (const order of batchOrders) {
                        const profit = await calculateProfit(this.provider, order, receipt, batchOrders.length, tx.gasPrice);
                        await Db.updateFilledOrder(signerAdr, order.hash, receipt.transactionHash, OrderModel.Statuss.success, profit);
                        Log.d(`profit of ${order.hash}: ${profit}$`);
                    }
                }).catch(async (e) => {
                    Log.e(e);
                    Log.e('tx failed', e.transactionHash);

                    net.removeHash(batchId);
                    if (batchOrders.length === 1) {
                        await Db.updateFilledOrder(signerAdr, batchOrders[0].hash, '', OrderModel.Statuss.failed, '');
                    } else {
                        await Utils.wasteTime(10);
                        await this.retryFillFailedOrders(batchOrders.map(order => order), net, isLimitOrder);
                    }
                });
                await Utils.wasteTime(5);
            }


        } catch (err) {
            Log.e(err);
        }
    }

    async retryFillFailedOrders(orders: any[], net: RSK, isLimitOrder = false) {
        const mid = Math.round(orders.length / 2)
        const firstBatch = orders.slice(0, mid), lastBatch = orders.slice(mid);
        const batchId1 = Utils.getUuid(), batchId2 = Utils.getUuid();
        await Db.updateOrdersStatus(firstBatch.map(o => o.hash), OrderModel.Statuss.retrying, batchId1);
        await Db.updateOrdersStatus(lastBatch.map(o => o.hash), OrderModel.Statuss.retrying, batchId2);

        if (isLimitOrder) {
            await new Promise(async (resolve) => {
                this.checkFillBatchOrders(net, 'limit', batchId1)
                await Utils.wasteTime(3);
                this.checkFillBatchOrders(net, 'limit', batchId2);
                resolve(true);
            });
        } else {
            await new Promise(async (resolve) => {
                this.checkFillBatchOrders(net, 'margin', batchId1);
                await Utils.wasteTime(3);
                this.checkFillBatchOrders(net, 'margin', batchId2);
                resolve(true);
            });
        }
    }

    async fillOrders(net: RSK, orders: Order[], signer: ethers.Signer, batchId: string) {
        const contract = SettlementLogic__factory.connect(config.contracts.settlement, signer);
        const args = (
            await Promise.all(
                orders.map(order => Orders.argsForOrder(order, signer))
            )
        ).filter(arg => arg !== null);

        if (args.length > 0) {
            Log.d("filling orders...");
            await Db.updateOrdersStatus(args.map(arg => arg.order.hash), OrderModel.Statuss.filling, Utils.getUuid());

            args.forEach(arg => {
                const symbol = Utils.getTokenSymbol(arg.order.fromToken);
                Log.d("  " + arg.order.hash + " (amountIn: " + formatEther(arg.order.amountIn) + " " + symbol + ")");
            });

            const signerAdr = await signer.getAddress();
            const gasLimit = await contract.estimateGas.fillOrders(args);
            const gasPrice = await Utils.getGasPrice(signer);
            const nonce = await net.addPendingHash(signerAdr, batchId);
            const tx = await contract.fillOrders(args, {
                gasLimit: gasLimit.mul(120).div(100),
                gasPrice: gasPrice,
                nonce
            });
            Log.d("  tx hash: ", tx.hash);
            return tx;
        }
    }

    async fillMarginOrders(net: RSK, orders: MarginOrder[], signer: Signer, batchId: string) {
        const contract = SettlementLogic__factory.connect(config.contracts.settlement, signer);
        const args = orders.map(order => ({ order }));

        if (args.length > 0) {
            Log.d("filling margin orders...");
            args.forEach(arg => {
                Log.d("  " + arg.order.hash);
            });

            const signerAdr = await signer.getAddress();
            const gasLimit = await contract.estimateGas.fillMarginOrders(args);
            const gasPrice = await Utils.getGasPrice(signer);
            const nonce = await net.addPendingHash(signerAdr, batchId);
            const tx = await contract.fillMarginOrders(args, {
                gasLimit: gasLimit.mul(120).div(100),
                gasPrice: gasPrice,
                nonce
            });
            return tx;
        }
    }
}

export default Executor;
