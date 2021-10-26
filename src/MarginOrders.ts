import { ethers } from "ethers";
import { OrderBookMarginFactory, SettlementFactory } from "./contracts";
import MarginOrder from "./types/MarginOrder";
import config from "./config";

const LIMIT = 20;

export type OnCreateOrder = (hash: string) => Promise<void> | void;
export type OnCancelOrder = (hash: string) => Promise<void> | void;

const BLOCKS_PER_DAY = 6500;

class MarginOrders {
    private static async fetchCanceledHashes(provider: ethers.providers.BaseProvider) {
        const fromBlock = (await provider.getBlockNumber()) - BLOCKS_PER_DAY;
        const settlement = SettlementFactory.connect(config.contracts.settlement, provider);
        const filter = settlement.filters.MarginOrderCanceled();
        return (await settlement.queryFilter(filter, fromBlock)).map(event => event.args![0]);
        // return await settlement.allCanceledHashes();
    }

    private static async fetchHashes(kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookMarginFactory.connect(config.contracts.orderBookMargin, kovanProvider);
        const length = (await orderBook.numberOfAllHashes()).toNumber();
        const pages: number[] = [];
        for (let i = 0; i * LIMIT < length; i++) pages.push(i);
        return (await Promise.all(pages.map(async page => await orderBook.allHashes(page, LIMIT))))
            .flat()
            .filter(hash => hash !== ethers.constants.HashZero);
    }

    static async fetch(provider: ethers.providers.BaseProvider, kovanProvider: ethers.providers.BaseProvider) {
        const settlement = SettlementFactory.connect(config.contracts.settlement, provider);
        const canceledHashes = await MarginOrders.fetchCanceledHashes(provider);
        // console.log(canceledHashes)
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
                        // console.log(hash, Number(filledAmountIn));
                        if (order.collateralTokenSent.add(order.loanTokenSent).eq(filledAmountIn)) return null;
                        return order;
                    })
            )
        ).filter(order => !!order);
    }

    static async fetchOrder(hash: string, kovanProvider: ethers.providers.BaseProvider) {
        const orderBook = OrderBookMarginFactory.connect(config.contracts.orderBookMargin, kovanProvider);
        const {
            loanId,
            leverageAmount,
            loanTokenAddress,
            loanTokenSent,
            collateralTokenSent,
            collateralTokenAddress,
            trader,
            minReturn,
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
            minReturn,
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
        const orderBook = OrderBookMarginFactory.connect(config.contracts.orderBookMargin, kovanProvider);
        const settlement = SettlementFactory.connect(config.contracts.settlement, provider);
        orderBook.on("OrderCreated", onCreateOrder);
        settlement.on("MarginOrderCanceled", onCancelOrder);
    }
}

export default MarginOrders;
