/**
 * Margin Order controller
 * Provide all helper functions for margin orders
 */

import { BigNumber, constants, Contract, ethers } from "ethers";
import { OrderBookMarginLogic__factory, SettlementLogic, SettlementLogic__factory } from "./contracts";
import MarginOrder from "./types/MarginOrder";
import config from "./config";
import Log from "./Log";
import { Utils } from "./Utils";
import loanAbi from "./config/abi_loan.json";
import Db from "./Db";
import { formatEther, parseEther } from "ethers/lib/utils";
import RSK from "./RSK";
import Orders from "./Orders";
import PriceFeeds from "./PriceFeeds";
import OrderStatus from "./types/OrderStatus";

export type OnCreateOrder = (hash: string) => Promise<void> | void;
export type OnCancelOrder = (hash: string) => Promise<void> | void;

const LIMIT = 20;
const BLOCKS_PER_DAY = 20000;
let _relayerFeePercent, _minMarginOrderTxFee;

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
 * Load minMarginOrderTxFee from Settlement contract
 */
const getMinMarginOrderTxFee = async (settlement: SettlementLogic) => {
    if (!_minMarginOrderTxFee) {
        _minMarginOrderTxFee = await settlement.minMarginOrderTxFee();
    }
    return _minMarginOrderTxFee;
}

class MarginOrders {
    /** 
     * Load all cancelled hashes of margin orders
     */
    private static async fetchCanceledHashes(provider: ethers.providers.BaseProvider) {
        const fromBlock = (await provider.getBlockNumber()) - BLOCKS_PER_DAY;
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const filter = settlement.filters.MarginOrderCanceled();
        return (await settlement.queryFilter(filter, fromBlock)).map(event => event.args![0]);
    }

    /**
     * Load all margin orders hashes from MarginOrderBook contract
     */
    private static async fetchHashes(orderbookProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, orderbookProvider);
        const length = (await orderBook.numberOfAllHashes()).toNumber();
        const pages: number[] = [];
        for (let i = 0; i * LIMIT < length; i++) pages.push(i);
        return (await Promise.all(pages.map(async page => await orderBook.allHashes(page, LIMIT))))
            .flat()
            .filter(hash => hash !== ethers.constants.HashZero);
    }

    /**
     * Load details of all margin orders, not include canceled, filled, expired orders
     */
    static async fetch(provider: ethers.providers.BaseProvider, orderbookProvider: ethers.providers.BaseProvider) {
        try {
            const canceledHashes = await MarginOrders.fetchCanceledHashes(provider);
            const hashes = await MarginOrders.fetchHashes(orderbookProvider);
            const now = Math.floor(Date.now() / 1000);
            const orders = (
                await Promise.all(
                    hashes
                        .filter(hash => !canceledHashes.includes(hash))
                        .map(async hash => {
                            const added = await Db.checkOrderHash(hash);
                            if (added) return null;

                            const order = await this.fetchOrder(hash, provider, orderbookProvider);
                            if (order.deadline.toNumber() < now) return null;
                            if (await this.checkFilledOrder(order, provider)) {
                                return null;
                            }
                            if (!this.validOrderParams(order)) return null;
                            return order;
                        })
                )
            ).filter(order => !!order);

            for (const order of orders) {
                await Db.addMarginOrder(order, { status: OrderStatus.open });
            }

            return orders;
        } catch (e) {
            Log.e(e);
            return [];
        }
    }

    /**
     * Load details of order hash
     */
    static async fetchOrder(hash: string, provider: ethers.providers.BaseProvider, orderbookProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, orderbookProvider);
        const {
            loanId,
            leverageAmount,
            loanTokenAddress,
            loanTokenSent,
            collateralTokenSent,
            collateralTokenAddress,
            trader,
            minEntryPrice,
            loanDataBytes,
            deadline,
            createdTimestamp,
            v,
            r,
            s
        } = await orderBook.orderOfHash(hash);

        const order = {
            hash,
            loanId,
            leverageAmount,
            loanTokenAddress,
            loanTokenSent,
            collateralTokenSent,
            collateralTokenAddress,
            trader,
            minEntryPrice,
            loanDataBytes,
            deadline,
            createdTimestamp,
            v,
            r,
            s
        } as MarginOrder;
        await this.checkLoanAdr(order, provider);
        return order;
    }

    /**
     * Observe orders created, cancelled
     */
    static watch(
        onCreateOrder: OnCreateOrder,
        onCancelOrder: OnCancelOrder,
        provider: ethers.providers.BaseProvider,
        orderbookProvider: ethers.providers.BaseProvider
    ) {
        const orderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, orderbookProvider);
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        orderBook.on("MarginOrderCreated", onCreateOrder);
        settlement.on("MarginOrderCanceled", onCancelOrder);
    }

    /**
     * This function will load the Token address of loan contract of a margin order.
     * We only have several loan contracts, so store all loaded token on local mapping `loanAssets` would be better
     */
    static loanAssets = {};
    static async checkLoanAdr(order: MarginOrder, provider: ethers.providers.BaseProvider) {
        if (!order.loanAssetAdr) {
            let loanAssetAdr = this.loanAssets[order.loanTokenAddress];
            if (loanAssetAdr == null) {
                const loanContract = new Contract(order.loanTokenAddress, loanAbi, provider);
                this.loanAssets[order.loanTokenAddress] = loanAssetAdr = await loanContract.loanTokenAddress();
            }
            order.loanAssetAdr = loanAssetAdr;
        }
        return order.loanAssetAdr;
    }

    /**
     * Return total deposited amount in loan token
     */
    static async getTotalDeposited(order: MarginOrder, provider: ethers.providers.BaseProvider) : Promise<BigNumber> {
        let totalDeposited: BigNumber = order.loanTokenSent;
        const loanAssetAdr = await this.checkLoanAdr(order, provider);

        if (order.collateralTokenSent.gt(constants.Zero)) {
            const amn = await Utils.convertTokenAmount(order.collateralTokenAddress, loanAssetAdr, order.collateralTokenSent);
            totalDeposited = totalDeposited.add(amn);
        }
        return totalDeposited;
    }

    /**
     * Calculate size of margin order in usd amount
     */
    static async getOrderSize(order: MarginOrder, provider: ethers.providers.BaseProvider) : Promise<BigNumber> {
        const loanAssetAdr = await this.checkLoanAdr(order, provider);
        const totalDeposited = await this.getTotalDeposited(order, provider);
        const orderSizeInUsd = await Utils.convertUsdAmount(loanAssetAdr, totalDeposited);
        return orderSizeInUsd;
    }

    /**
     * Parse margin order from JSON object
     * This will be used when loading order details from db
     */
    static parseOrder(json: any): MarginOrder {
        try {
            return {
                ...json,
                leverageAmount: BigNumber.from(json.leverageAmount),
                loanTokenSent: BigNumber.from(json.loanTokenSent),
                collateralTokenSent: BigNumber.from(json.collateralTokenSent),
                minEntryPrice: BigNumber.from(json.minEntryPrice),
                deadline: BigNumber.from(json.deadline),
                createdTimestamp: BigNumber.from(json.createdTimestamp),
            };
        } catch (error) {
            console.log(json)
            throw error;
        }
    }

    /**
     * Check if margin orders are valid
     * order.loanTokenAddress need to be in config.loanContracts list
     * order.collateralTokenAddress need to be in config.tokens list
     */
    static validOrderParams(order: MarginOrder) {
        const loanTokenAddress = order.loanTokenAddress.toLowerCase();
        const collateralTokenAddress = order.collateralTokenAddress.toLowerCase();
        const validLoanAdr = Object.values(config.loanContracts).find(adr => adr.toLowerCase() == loanTokenAddress);
        const validCollToken = config.tokens.find(token => token.address.toLowerCase() == collateralTokenAddress);
        if (!validLoanAdr || !validCollToken) {
            console.log("margin order parmas invalid, hash", order.hash, order.loanTokenAddress);
        }
        return validLoanAdr != null && validCollToken != null;
    }

    /**
     * Calculate relayer fee
     */
    static async estimateOrderFee(provider: ethers.providers.BaseProvider, orderSizeUsd: BigNumber) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const relayerFeePercent = await getRelayerFeePercent(settlement);
        const txFee = await getMinMarginOrderTxFee(settlement);
        let orderFee = orderSizeUsd.mul(relayerFeePercent).div(parseEther('100')); //div 10^20
        const wrbtcPrice = PriceFeeds.getPrice(Utils.getTokenAddress('wrbtc'), Utils.getTokenAddress('xusd'));
        const txFeeUsd = BigNumber.from(txFee).mul(parseEther(wrbtcPrice)).div(ethers.constants.WeiPerEther);

        if (orderFee.lt(txFeeUsd)) return txFeeUsd;
        return orderFee;
    }

    /**
     * Check if a margin order could be filled or not.
     * Order could be filled when price of position size on AMM >= order.minEntryPrice
     */
    static async checkTradable(provider: ethers.providers.BaseProvider, order: MarginOrder) {
        const totalDeposited = await this.getTotalDeposited(order, provider);
        const orderSize = await Utils.convertUsdAmount(order.loanAssetAdr, totalDeposited);
        const estFee = await this.estimateOrderFee(provider, orderSize);
        if (orderSize.lt(estFee)) {
            Log.e("Margin order size's too small for relayer fee, order size:", formatEther(orderSize) + '$,',
                "est fee:", formatEther(estFee) + '$');
            await Db.addMarginOrder(order, { status: OrderStatus.failed_smallOrder })
            return false;
        }

        const loanContract = new ethers.Contract(order.loanTokenAddress, loanAbi, provider);
        const { principal } = await loanContract.getEstimatedMarginDetails(
            order.leverageAmount,
            order.loanTokenSent,
            order.collateralTokenSent,
            order.collateralTokenAddress
        );
        const feeInLoan = await Utils.convertTokenAmount(Utils.getTokenAddress('xusd'), order.loanAssetAdr, estFee);
        const loanTokenSent = order.loanTokenSent.add(principal).sub(feeInLoan);

        const collAmount = await Utils.convertTokenAmount(order.loanAssetAdr, order.collateralTokenAddress, loanTokenSent);
        const curPrice = BigNumber.from(collAmount).mul(ethers.constants.WeiPerEther).div(loanTokenSent);

        const loanSymb = Utils.getTokenSymbol(order.loanAssetAdr);
        const collSymb = Utils.getTokenSymbol(order.collateralTokenAddress);

        const matchPercent = curPrice.mul(100).div(order.minEntryPrice).toNumber();
        if (matchPercent > 80) {
            Log.d(
                'MarginOrders.checkTradable: hash', order.hash, matchPercent.toFixed(1) + '% matched',
                '\n\t orderSize', formatEther(orderSize) + '$',
                '\n\t totalDeposited', formatEther(totalDeposited), loanSymb,
                '\n\t estFee', formatEther(estFee) + '$',
                '\n\t curPrice', formatEther(curPrice), loanSymb + '/' + collSymb,
                '\n\t minEntryPrice', formatEther(order.minEntryPrice), loanSymb + '/' + collSymb,
            );
        }
        return orderSize.gt(config.minOrderSize) && curPrice.gte(order.minEntryPrice);
    }

    /**
     * Load order details for orderbook showing on client
     */
    static async parseOrderDetail(order: MarginOrder, checkFee = false) {
        await this.checkLoanAdr(order, RSK.Mainnet.provider);
        const orderDetail: any = {
            id: order.id,
            hash: order.hash,
            loanId: order.loanId,
            leverageAmount: Number(formatEther(order.leverageAmount)) + 1,
            loanTokenAddress: order.loanTokenAddress,
            loanAssetAddress: order.loanAssetAdr,
            collateralTokenAddress: order.collateralTokenAddress,
            trader: order.trader,
            minEntryPrice: formatEther(order.minEntryPrice),
            loanDataBytes: order.loanDataBytes,
            deadline: new Date(order.deadline.toNumber() * 1000),
            createdTimestamp: new Date(order.createdTimestamp.toNumber() * 1000),
            status: order.status,
            relayer: order.relayer,
            txHash: order.txHash,
        };
        const pairTokens = Orders.getPair(order.loanAssetAdr, order.collateralTokenAddress);
        orderDetail.pair = pairTokens[0].name + '/' + pairTokens[1].name;

        if (order.loanAssetAdr.toLowerCase() == pairTokens[0].address.toLowerCase()) {
            orderDetail.fromSymbol = pairTokens[0].name;
            orderDetail.toSymbol = pairTokens[1].name;
            orderDetail.pos = 'Short';
            orderDetail.limitPrice = ">= " + Utils.shortNum(orderDetail.minEntryPrice);
        } else {
            orderDetail.fromSymbol = pairTokens[1].name;
            orderDetail.toSymbol = pairTokens[0].name;
            orderDetail.pos = 'Long';
            orderDetail.limitPrice = "<= " + Utils.shortNum(1 / Number(orderDetail.minEntryPrice));
        }

        if (checkFee) {
            orderDetail.currentPrice = await PriceFeeds.getPrice(order.loanAssetAdr, order.collateralTokenAddress);
            if (orderDetail.pos == 'Long') {
                orderDetail.currentPrice = String(1 / Number(orderDetail.currentPrice));
            }
            orderDetail.currentPrice = Utils.shortNum(orderDetail.currentPrice);
        }

        orderDetail.loanTokenSent = formatEther(order.loanTokenSent) + ' ' + orderDetail.fromSymbol;
        orderDetail.collateralTokenSent = formatEther(order.collateralTokenSent) + ' ' + orderDetail.toSymbol;

        return orderDetail;
    }

    /**
     * Check if margin order was filled or not
     */
    static async checkFilledOrder(order: MarginOrder, provider: ethers.providers.BaseProvider) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const filledAmountIn = await settlement.filledAmountInOfHash(order.hash);
        if (order.collateralTokenSent.add(order.loanTokenSent).eq(filledAmountIn)) {
            const added = await Db.checkOrderHash(order.hash);
            if (!added) {
                new Promise(async (resolve) => {
                    const filterFilled = settlement.filters.FeeTransferred(order.hash);
                    const event = await settlement.queryFilter(filterFilled);
                    const filler = event && event[0] && event[0].args && event[0].args.recipient;

                    if (filler) {
                        await Db.addMarginOrder(order, { status: OrderStatus.filled });
                        await Db.updateOrderFiller(order.hash, filler, false);
                        console.log("Check margin order %s filled, amount %s, filler %s", order.hash, formatEther(filledAmountIn), filler);
                    }
                    resolve(null);
                });
            }
            return true;
        }
        return false;
    }

    /**
     * Filter margin orders that would be executed successfully by simulating fillMarginOrders transaction.
     * Filtered out cancelled, filled orders
     * Check if margin orders have enough rbtc balance on the settlement contract, or enough token balance on owner wallet
     * If all params is correct, it will check if entry price does not match => re-open it
     */
    static async checkSimulatedTransaction(orders: MarginOrder[], provider: ethers.providers.BaseProvider) {
        const executables: MarginOrder[] = [];
        const p = this;

        await Promise.all(orders.map(async (order) => {
            try {
                const txData = await p.getFillOrdersData([order], provider);
                const simulatedTx = await provider.call(txData);
                Log.d('simulatedTx', simulatedTx);
                executables.push(order);

            } catch (e) {
                Log.e('Failed to simulate tx for margin order: ' + order.hash);
                Log.e(JSON.stringify(e, null, 2));
                const revertedError: string = e.error && e.error.body;
                if (revertedError) {
                    if (revertedError.indexOf('already-filled') && (order.status != OrderStatus.filled && order.status != OrderStatus.success)) {
                        return p.checkFilledOrder(order, provider);
                    }
                    if (revertedError.indexOf('order-canceled') && order.status != OrderStatus.canceled) {
                        return Db.updateOrdersStatus([order.hash], OrderStatus.canceled, null, true);
                    }
                    if (revertedError.indexOf('order-expired') && order.status != OrderStatus.expired) {
                        return Db.updateOrdersStatus([order.hash], OrderStatus.expired, null, true);
                    }
                    if (revertedError.indexOf('entry price above the minimum') && order.status != OrderStatus.open) {
                        //re-open order for matching price next time
                        return Db.updateOrdersStatus([order.hash], OrderStatus.open, null, false);
                    }
                    if (revertedError.indexOf('insufficient-balance')) {
                        //not enough deposited rBTC balance on Settlement
                        return Db.updateOrdersStatus([order.hash], OrderStatus.failed_notEnoughBalance, null, false);
                    }
                    if (revertedError.indexOf('SafeERC20: low-level call failed')) {
                        //not enough Token amount on owner wallet
                        return Db.updateOrdersStatus([order.hash], OrderStatus.failed_notEnoughBalance, null, false);
                    }

                    return Db.updateOrdersStatus([order.hash], OrderStatus.failed, null, false);
                }
            }
        }));

        return executables;
    }

    static async getFillOrdersData(orders: MarginOrder[], provider: ethers.providers.BaseProvider) {
        const contract = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const args = orders.map(order => ({ order }));

        if (args.length > 0) {
            const txData = await contract.populateTransaction.fillMarginOrders(args, {
                gasLimit: String(2000000 * orders.length)
            });

            return txData;
        }
    }
}

export default MarginOrders;
