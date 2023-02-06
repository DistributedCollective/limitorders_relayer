import {
    Pair,
    Token,
    Currency,
} from "@sushiswap/sdk";
import _ from 'lodash';
import swapAbi from "./config/abi_sovrynSwap.json";
import erc20Abi from "./config/abi_erc20.json";
import { BigNumber, Contract, ContractReceipt, ethers, PopulatedTransaction, Event } from "ethers";
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
import OrderStatus from "./types/OrderStatus";

export type OnOrderFilled = (
    hash: string,
    amountIn: ethers.BigNumber,
    amountOut: ethers.BigNumber,
    filledPrice: ethers.BigNumber
) => Promise<void> | void;

export type OnFeeTransferred = (
    hash: string,
    recipient: string,
    event: Event
) => Promise<void> | void;


/**
 * Calculate spot, margin order fee and return profit in xusd
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

    /**
     * Observe filled spot orders
     */
    watch(onOrderFilled: OnOrderFilled) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        settlement.on("OrderFilled", (hash, maker, amountIn, amountOut, path, filledPrice) => {
            onOrderFilled(hash, amountIn, amountOut, filledPrice);
        });
    }

    /**
     * Observe filled margin orders
     */
    watchMargin(onOrderFilled: OnOrderFilled) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        settlement.on("MarginOrderFilled",  (hash, trader, pricipal, collateral) => {
            onOrderFilled(hash, BigNumber.from(0), BigNumber.from(0), BigNumber.from(0));
        });
    }

    /**
     * Observe FeeTransferred event, containing relayer filled orders
     */
    watchFeeTranfered(onFeeTransferred: OnFeeTransferred) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        settlement.on("FeeTransferred", onFeeTransferred);
    }

    /**
     * Get filled amount of order hash
     */
    async filledAmountIn(hash: string) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        return await settlement.filledAmountInOfHash(hash);
    }

    /**
     * Get canceled status of order hash
     */
    async checkCanceledOrder(hash: string) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, this.provider);
        return await settlement.canceledOfHash(hash);
    }

    /**
     * Check all open spot orders in db and mark it as 'matched' when order could be filled
     */
    async matchSpotOrders(tokens: Token[], pairs: Pair[]) {
        const executables: Order[] = [];
        const openOrders: Order[] = await Db.findOrders('spot', {
            status: [OrderStatus.open, OrderStatus.filling, OrderStatus.retrying],
            latest: true,
            batchId: null
        });
        Log.d(`Checking ${openOrders.length} open spot orders`);

        const process1Order = async (order: Order) => {
            const orderInDb = await Db.checkOrderHash(order.hash);

            // skip checking orders if it's been filled in another round
            if (orderInDb.status != OrderStatus.open) {
                Orders.checkFilledOrder(order, this.provider);
                return;
            }

            if (this.checkingHashes[order.hash]) {
                return;
            }

            this.checkingHashes[order.hash] = true;

            const now = Date.now();
            const fromToken = Utils.findToken(tokens, order.fromToken);
            const toToken = Utils.findToken(tokens, order.toToken);
            const isExpired = order.deadline.toNumber() * 1000 < now;
            const isFilled = await Orders.checkFilledOrder(order, this.provider);
            const isCanceled = await this.checkCanceledOrder(order.hash);

            if (isExpired) {
                await Db.updateOrdersStatus([order.hash], OrderStatus.expired, null, true);
            }
            if (isCanceled) {
                await Db.updateOrdersStatus([order.hash], OrderStatus.canceled, null, true);
            }

            if (fromToken && toToken && !isExpired && !isFilled && !isCanceled) {
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
                    await Db.updateOrdersStatus([order.hash], OrderStatus.matched, null, true);
                    const aux = order.trade
                        ? " at " +
                        order.trade?.executionPrice.toFixed(8) +
                        " " +
                        order.trade.route.path[order.trade.route.path.length - 1].symbol +
                        "/" +
                        order.trade.route.path[0].symbol
                        : "";
                    Log.d("Spot order matched: " + order.hash + aux);
                }
            }

            delete this.checkingHashes[order.hash];
        };

        const batches = _.chunk(openOrders, 10);
        for (const orders of batches) {
            await Promise.all(orders.map(order => process1Order(order)));
        }

        Log.d(`completed checking ${openOrders.length} open spot orders, has ${executables.length} tradable orders`);

        return executables;
    }

    /**
     * Check all open margin orders in db and mark them as 'matched' when order could be filled
     */
    async matchMarginOrders() {
        const openOrders: MarginOrder[] = await Db.findOrders('margin', {
            status: [OrderStatus.open, OrderStatus.filling, OrderStatus.retrying],
            latest: true,
            batchId: null
        });
        Log.d(`Checking ${openOrders.length} open margin orders`);
        const executables: MarginOrder[] = [];

        const process1Order =async (order: MarginOrder) => {
            const orderInDb = await Db.checkOrderHash(order.hash);

            if (orderInDb.status != OrderStatus.open) {
                MarginOrders.checkFilledOrder(order, this.provider);
                return;
            }

            if (this.checkingHashes[order.hash]) {
                return;
            }

            const now = Date.now();
            const isExpired = order.deadline.toNumber() * 1000 < now;
            const isFilled = await MarginOrders.checkFilledOrder(order, this.provider);
            const isCanceled = await this.checkCanceledOrder(order.hash);

            if (isCanceled) {
                await Db.updateOrdersStatus([order.hash], OrderStatus.canceled, null, false);
            }

            if (isExpired) {
                await Db.updateOrdersStatus([order.hash], OrderStatus.expired, null, false);
            }

            this.checkingHashes[order.hash] = true;
            const tradable = await MarginOrders.checkTradable(this.provider, order);
            if (tradable && !isExpired && !isFilled && !isCanceled) {
                executables.push(order);
                await Db.updateOrdersStatus([order.hash], OrderStatus.matched, null, false);
                Log.d(`Margin order matched: ` + order.hash);
            }

            delete this.checkingHashes[order.hash];
        }

        const batches = _.chunk(openOrders, 10);
        for (const orders of batches) {
            await Promise.all(orders.map(order => process1Order(order)));
        }

        Log.d(`completed checking ${openOrders.length} open margin orders, has ${executables.length} tradable orders`);

        return executables;
    }

    /**
     * Load all matched orders in db and split orders into batches of max `config.maxOrdersInBatch`
     * It will try to execute fillOrders tx with batch of orders (list size N)
     * If tx failed, will retry 2 fillOrders txs:
     *  - the first tx will fill the first half of old orders, element 0 -> N/2
     *  - the second tx will fill the remaining half of old orders, element N/2 + 1 -> N - 1
     * It will continue to send tx if there are more than 2 failed orders in a batch
     */
    async checkFillBatchOrders(net: RSK, type = 'spot', retryBatchId: string = null) {
        try {
            Log.d("Start checking for filling batch orders, type", type);
            const isSpotOrder = type == 'spot';
            let orders: BaseOrder[] = await Db.findOrders(type, {
                batchId: retryBatchId,
                status: !!retryBatchId ? OrderStatus.retrying : OrderStatus.matched
            });

            if (isSpotOrder) {
                orders = await Orders.checkSimulatedTransaction(orders as Order[], this.provider);

                Log.d("filling spot orders...");
                orders.forEach((order: Order) => {
                    const symbol = Utils.getTokenSymbol(order.fromToken);
                    Log.d("  " + order.hash + " (amountIn: " + formatEther(order.amountIn) + " " + symbol + ")");
                });
            } else {
                orders = await MarginOrders.checkSimulatedTransaction(orders as MarginOrder[], this.provider);
                
                Log.d("filling margin orders...");
                orders.forEach(order => {
                    Log.d("  " + order.hash);
                });
            }

            const batches = _.chunk(orders, config.maxOrdersInBatch);
            Log.d(`processing ${orders.length} ${type} orders on ${batches.length} batches`);

            for (let batchOrders of batches) {

                let signerAdr;
                try {
                    const batchId = retryBatchId || Utils.getUuid();
                    await Db.updateOrdersStatus(batchOrders.map(order => order.hash), OrderStatus.filling, batchId, isSpotOrder);
                    Log.d('batch:', batchId, batchOrders.map(order => order.hash))
    
                    let txData: PopulatedTransaction;
    
                    if (isSpotOrder) {
                        txData = await Orders.getFillOrdersData(batchOrders as Order[], this.provider);
                    } else {
                        txData = await MarginOrders.getFillOrdersData(batchOrders as MarginOrder[], this.provider);
                    }
    
                    const { tx, signer } = await net.sendTx(txData);

                    if (tx) {
                        signerAdr = signer.address;
                        Log.d('tx hash', tx.hash, 'nonce', tx.nonce, batchId);
                        for (const order of batchOrders) {
                            await Db.updateFilledOrder(signerAdr, order.hash, tx.hash, OrderStatus.filling, "", isSpotOrder);
                        }
                        const receipt = await tx.wait(1);
                        for (const order of batchOrders) {
                            const profit = await calculateProfit(this.provider, order, receipt, batchOrders.length, tx.gasPrice);
                            Log.d(`profit of ${order.hash}: ${profit}$`);

                            await Db.updateFilledOrder(signerAdr, order.hash, receipt.transactionHash, OrderStatus.success, profit, isSpotOrder);

                            Utils.sendTelegramMsg(`<b>LimitOrder</b>: executed full filling ${order.type} order hash ${order.hash}
                                \nProfit $${Number(profit).toFixed(2)} tx ${config.blockExplorer}tx/${tx.hash}`
                            );
                        }
                    }
                    
                } catch (err) {
                    Log.e(err);
                    Log.e('tx failed', err.transactionHash);

                    if (batchOrders.length === 1) {
                        const dbOrder = await Db.checkOrderHash(batchOrders[0].hash);

                        if (dbOrder && dbOrder.status != OrderStatus.filled) {
                            if (isSpotOrder) {
                                await Orders.checkSimulatedTransaction(batchOrders as Order[], this.provider);
                            } else {
                                await MarginOrders.checkSimulatedTransaction(batchOrders as MarginOrder[], this.provider);
                            }
                        }

                    } else {
                        await Utils.wasteTime(10);
                        await this.retryFillFailedOrders(batchOrders.map(order => order), net, isSpotOrder);
                    }
                }

                await Utils.wasteTime(5);
            }


        } catch (err) {
            Log.e(err);
        }
    }

    /**
     * Split orders into 2 batches and try to execute fillOrders again
     */
    async retryFillFailedOrders(orders: any[], net: RSK, isSpotOrder = false) {
        const mid = Math.round(orders.length / 2)
        const firstBatch = orders.slice(0, mid), lastBatch = orders.slice(mid);
        const batchId1 = Utils.getUuid(), batchId2 = Utils.getUuid();
        await Db.updateOrdersStatus(firstBatch.map(o => o.hash), OrderStatus.retrying, batchId1, isSpotOrder);
        await Db.updateOrdersStatus(lastBatch.map(o => o.hash), OrderStatus.retrying, batchId2, isSpotOrder);

        if (isSpotOrder) {
            await new Promise(async (resolve) => {
                this.checkFillBatchOrders(net, 'spot', batchId1)
                await Utils.wasteTime(3);
                this.checkFillBatchOrders(net, 'spot', batchId2);
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
}

export default Executor;
