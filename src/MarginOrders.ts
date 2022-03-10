import { BigNumber, constants, Contract, ethers } from "ethers";
import { OrderBookMarginLogic__factory, SettlementLogic__factory } from "./contracts";
import MarginOrder from "./types/MarginOrder";
import config from "./config";
import Log from "./Log";
import { Utils } from "./Utils";
import abiLoan from './config/abi_loan.json';
import swapAbi from "./config/abi_sovrynSwap.json";
import loanAbi from "./config/abi_loan.json";
import Db from "./Db";
import { formatEther, parseEther } from "ethers/lib/utils";

export type OnCreateOrder = (hash: string) => Promise<void> | void;
export type OnCancelOrder = (hash: string) => Promise<void> | void;

const LIMIT = 20;
const BLOCKS_PER_DAY = 20000;

class MarginOrders {
    private static async fetchCanceledHashes(provider: ethers.providers.BaseProvider) {
        const fromBlock = (await provider.getBlockNumber()) - BLOCKS_PER_DAY;
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const filter = settlement.filters.MarginOrderCanceled();
        return (await settlement.queryFilter(filter, fromBlock)).map(event => event.args![0]);
    }

    private static async fetchHashes(kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, kovanProvider);
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
            const canceledHashes = await MarginOrders.fetchCanceledHashes(provider);
            const hashes = await MarginOrders.fetchHashes(kovanProvider);
            const now = Math.floor(Date.now() / 1000);
            return (
                await Promise.all(
                    hashes
                        .filter(hash => !canceledHashes.includes(hash))
                        .map(async hash => {
                            const order = await this.fetchOrder(hash, kovanProvider);
                            if (order.deadline.toNumber() < now) return null;
                            const filledAmountIn = await settlement.filledAmountInOfHash(hash);
                            if (order.collateralTokenSent.add(order.loanTokenSent).eq(filledAmountIn)) return null;
                            if (!this.validOrderParams(order)) return null;
                            return order;
                        })
                )
            ).filter(order => !!order);
        } catch (e) {
            Log.e(e);
            return [];
        }
    }

    static async fetchOrder(hash: string, kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, kovanProvider);
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
        return {
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
    }

    static watch(
        onCreateOrder: OnCreateOrder,
        onCancelOrder: OnCancelOrder,
        provider: ethers.providers.BaseProvider,
        kovanProvider: ethers.providers.BaseProvider
    ) {
        const orderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, kovanProvider);
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        orderBook.on("MarginOrderCreated", onCreateOrder);
        settlement.on("MarginOrderCanceled", onCancelOrder);
    }

    static async checkLoanAdr(order: MarginOrder, provider: ethers.providers.BaseProvider) {
        if (!order.loanAssetAdr) {
            const loanContract = new Contract(order.loanTokenAddress, abiLoan, provider);
            order.loanAssetAdr = await loanContract.loanTokenAddress();
        }
        return order.loanAssetAdr;
    }

    /**
     * return total deposited amount in loan token
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

    static async getOrderSize(order: MarginOrder, provider: ethers.providers.BaseProvider) : Promise<BigNumber> {
        const loanAssetAdr = await this.checkLoanAdr(order, provider);
        const totalDeposited = await this.getTotalDeposited(order, provider);
        const orderSizeInUsd = await Utils.convertUsdAmount(loanAssetAdr, totalDeposited);
        return orderSizeInUsd;
    }

    static parseOrder(json: any): MarginOrder {
        return {
            ...json,
            leverageAmount: BigNumber.from(json.leverageAmount),
            loanTokenSent: BigNumber.from(json.loanTokenSent),
            collateralTokenSent: BigNumber.from(json.collateralTokenSent),
            minEntryPrice: BigNumber.from(json.minEntryPrice),
            deadline: BigNumber.from(json.deadline),
            createdTimestamp: BigNumber.from(json.createdTimestamp),
        };
    }

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

    static async estimateOrderFee(provider: ethers.providers.BaseProvider, orderSizeUsd: BigNumber) {
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
        const swap = new ethers.Contract(config.contracts.sovrynSwap, swapAbi, provider);
        const relayerFeePercent = await settlement.relayerFeePercent();
        const marginOrderGas = await settlement.marginOrderGas();
        const gasPrice = await Utils.getGasPrice(provider);
        let orderFee = orderSizeUsd.mul(relayerFeePercent).div(parseEther('100')); //div 10^20
        let txFee = gasPrice.mul(marginOrderGas).mul(3).div(2);
        const path = await swap.conversionPath(Utils.getTokenAddress('wrbtc'), Utils.getTokenAddress('xusd'));
        const txFeeUsd = await swap.rateByPath(path, txFee);

        if (orderFee.lt(txFeeUsd)) return txFeeUsd;
        return orderFee;
    }

    static async checkTradable(provider: ethers.providers.BaseProvider, order: MarginOrder) {
        const totalDeposited = await this.getTotalDeposited(order, provider);
        const orderSize = await Utils.convertUsdAmount(order.loanAssetAdr, totalDeposited);
        const estFee = await this.estimateOrderFee(provider, orderSize);
        if (orderSize.lt(estFee)) {
            Log.e("Margin order size's too small for relayer fee, order size:", formatEther(orderSize) + '$,',
                "est fee:", formatEther(estFee) + '$');
            await Db.addMarginOrder(order, { status: 'failed_smallOrder' })
            return false;
        }

        const swap = new ethers.Contract(config.contracts.sovrynSwap, swapAbi, provider);
        const loanContract = new ethers.Contract(order.loanTokenAddress, loanAbi, provider);
        const { principal } = await loanContract.getEstimatedMarginDetails(
            order.leverageAmount,
            order.loanTokenSent,
            order.collateralTokenSent,
            order.collateralTokenAddress
        );
        const loanTokenSent = order.loanTokenSent.add(principal);

        const collPath = await swap.conversionPath(order.loanAssetAdr, order.collateralTokenAddress);
        const collAmount = await swap.rateByPath(collPath, loanTokenSent);
        const curPrice = BigNumber.from(collAmount).mul(ethers.constants.WeiPerEther).div(loanTokenSent);

        const loanSymb = Utils.getTokenSymbol(order.loanAssetAdr);
        const collSymb = Utils.getTokenSymbol(order.collateralTokenAddress);
        Log.d(
            'MarginOrders.checkTradable: hash', order.hash,
            '\n\t orderSize', formatEther(orderSize) + '$',
            '\n\t totalDeposited', formatEther(totalDeposited), loanSymb,
            '\n\t estFee', formatEther(estFee) + '$',
            '\n\t curPrice', formatEther(curPrice), loanSymb + '/' + collSymb,
            '\n\t minEntryPrice', formatEther(order.minEntryPrice), loanSymb + '/' + collSymb,
        );
        return orderSize.gt(config.minOrderSize) && curPrice.gte(order.minEntryPrice);
    }
}

export default MarginOrders;
