/**
 * Monitor controller
 * Provider all methods for client api
 */

import { BigNumber, constants, Contract, ethers, providers } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import config, { RelayerAccount } from "./config";
import { OrderBookMarginLogic__factory, OrderBookSwapLogic__factory, SettlementLogic__factory } from "./contracts";
import Db from "./Db";
import RSK from "./RSK";
import { Utils } from "./Utils";
import Orders from "./Orders";
import MarginOrders from "./MarginOrders";
import OrderStatus from "./types/OrderStatus";
import PriceFeeds from "./PriceFeeds";

class Monitor {
    net: RSK;

    init(net: RSK) {
        this.net = net;
    }

    /**
     * Load all detail of account wallets on this relayer
     */
    async getAddresses(cb: any) {
        const res = [];
        for (const acc of this.net.accounts) {
            const info = await this.getAccountInfoForFrontend(acc);
            res.push(info);
        }
        cb(res);
    }

    /**
     * Load total processed orders, profit
     */
    async getTotals(cb: any, last24h = false) {
        const result = await Db.getTotals(last24h);
        cb(result);
    }
    
    /**
     * Get detail account, include balance of all tokens, total balance in USD
     */
    async getAccountInfoForFrontend(account: RelayerAccount) {
        if (!account) return null;
        const tokens = config.tokens;
        let accountWithInfo = {
            address: account.address,
            usdBalance: "0",
            rBtcBalance: {
                balance: Number(
                    formatEther(await this.net.provider.getBalance(account.address))
                ).toFixed(5)
            },
            tokenBalances: await Promise.all(
                tokens.map(async token => ({
                    token: token.symbol,
                    adr: token.address,
                    balance: Number(
                        formatEther(await Utils.getTokenBalance(account.address, token.address))
                    ).toFixed(5),
                }))
            )
        }

        let rbtcBal = Number(accountWithInfo.rBtcBalance.balance) || 0;
        let totalUsdBal = 0;
        for (const tokenBal of accountWithInfo.tokenBalances) {
            let bal = Number(tokenBal.balance) || 0;
            if (tokenBal.token.toLowerCase() == 'wrbtc') bal += rbtcBal;
            if (bal <= 0) continue;
            const usdBal = await Utils.convertUsdAmount(tokenBal.adr, BigNumber.from(parseEther(bal.toFixed(10))));
            totalUsdBal += Number(formatEther(usdBal)) || 0;
        }

        accountWithInfo.usdBalance = totalUsdBal.toFixed(2);

        return accountWithInfo;
    }

    getNetworkData(cb) {
        const resp = {
            blockExplorer: config.blockExplorer
        };
        cb(resp)
    }

    /**
     * Get detail of spot, margin order by hash
     */
    async getOrderDetail(hash: string, isMargin: boolean, cb) {
        const orderBook = OrderBookSwapLogic__factory.connect(config.contracts.orderBook, RSK.Testnet.provider);
        const marginOrderBook = OrderBookMarginLogic__factory.connect(config.contracts.orderBookMargin, RSK.Testnet.provider);
        const settlement = SettlementLogic__factory.connect(config.contracts.settlement, RSK.Mainnet.provider)
        let order;

        if (isMargin) {
            const raw = await marginOrderBook.orderOfHash(hash);
            if (raw.trader == constants.AddressZero) cb({ error: 'Order is not found' });

            order = await MarginOrders.parseOrderDetail({...raw} as any, true);
        } else {
            const raw = await orderBook.orderOfHash(hash);
            if (raw.maker == constants.AddressZero) cb({error: 'Order is not found'});
            order = await Orders.parseOrderDetail({...raw} as any, true);
        }

        order.cancelled = await settlement.canceledOfHash(hash);
        const filledAmount = await settlement.filledAmountInOfHash(hash);
        order.filledAmount = formatEther(filledAmount);

        cb(order);
    }

    /**
     * Load all available spot, margin pairs from db
     */
    async listAllPair(type = 'spot', cb) {
        let pairs = await Db.listAllPairs(type == 'spot');
        cb(pairs);
    }

    /**
     * Load spot, margin orders by:
     * - status: open, filled, canceled
     * - pair
     */
    async listOrders({ type = 'spot', status = '', pair = '', offset = 0, limit = 10} = {}, cb) {
        const statusFilter: any = {};
        if (status == 'open') statusFilter.status = [ 
            OrderStatus.open,
            OrderStatus.matched,
            OrderStatus.retrying,
            OrderStatus.filling,
            OrderStatus.failed,
            OrderStatus.failed_smallOrder,
        ];
        if (status == 'canceled') statusFilter.status = [ OrderStatus.canceled];
        if (status == 'filled') statusFilter.status = [ OrderStatus.filled, OrderStatus.success];

        const orders = await Db.findOrders(type, {
            offset,
            limit,
            pair,
            latest: true,
            ...statusFilter
        });
        const total = await Db.countOrders({ type, pair, ...statusFilter });
        const orderDetails = [];
        for (const order of orders) {
            let orderDetail;
            if (order.type == 'spot') orderDetail = await Orders.parseOrderDetail(order, true);
            else orderDetail = await MarginOrders.parseOrderDetail(order);
            orderDetails.push(orderDetail);
        }

        cb({
            list: orderDetails,
            total,
            offset,
            limit
        });
    }

    /**
     * Get total volumes in usd of spot, margin pair
     * Include total buy volumes, sell volumes
     */
    async sumVolPair(type, pair, cb) {
        const orders = await Db.findOrders(type, { pair, limit: -1 });
        if (!orders || orders.length == 0) return { buy: '0', sell: '0' };

        let volBuy = BigNumber.from(0);
        let volSell = BigNumber.from(0);

        if (type == 'spot') {
            orders.forEach(order => {
                const pairTokens = Orders.getPair(order.fromToken, order.toToken);
                if (order.fromToken.toLowerCase() == pairTokens[0].address.toLowerCase()) {
                    const tokenPrice = PriceFeeds.getPrice(pairTokens[0].address, Utils.getTokenAddress('xusd'));
                    const amountInUsd = order.amountIn.mul(parseEther(tokenPrice));
                    volSell = amountInUsd.add(volSell);
                } else {
                    const tokenPrice = PriceFeeds.getPrice(pairTokens[1].address, Utils.getTokenAddress('xusd'));
                    const amountInUsd = order.amountIn.mul(parseEther(tokenPrice));
                    volBuy = amountInUsd.add(volBuy);
                }
            });
        } else {
            for (const order of orders) {
                const pairTokens = Orders.getPair(order.loanAssetAdr, order.collateralTokenAddress);
                const basePrice = PriceFeeds.getPrice(pairTokens[0].address, Utils.getTokenAddress('xusd'));
                const quotePrice = PriceFeeds.getPrice(pairTokens[1].address, Utils.getTokenAddress('xusd'));
                if (order.loanAssetAdr.toLowerCase() == pairTokens[0].address.toLowerCase()) {
                    const loanUsd = order.loanTokenSent.mul(parseEther(basePrice));
                    const collUsd = order.collateralTokenSent.mul(parseEther(quotePrice));
                    
                    volSell = loanUsd.add(collUsd).add(volSell);
                } else {
                    const loanUsd = order.loanTokenSent.mul(parseEther(quotePrice));
                    const collUsd = order.collateralTokenSent.mul(parseEther(basePrice));

                    volBuy = loanUsd.add(collUsd).add(volBuy);
                }
            }
        }

        const vol = {
            buy: Number(formatEther(volBuy.div(ethers.constants.WeiPerEther))).toFixed(2),
            sell: Number(formatEther(volSell.div(ethers.constants.WeiPerEther))).toFixed(2)
        };

        cb(vol);
    }

    /**
     * Get total volumes in usd of all spot, margin orders
     * Include total buy volumes, sell volumes
     */
    async totalVolumes(type, cb) {
        const allPairs = await Db.listAllPairs(type == 'spot');
        let volSell = 0, volBuy = 0;
        await Promise.all(allPairs.map((pair) => {
            return new Promise(resolve => {
                this.sumVolPair(type, pair, (vol) => {
                    volSell += Number(vol.sell);
                    volBuy += Number(vol.buy);
                    console.log(type, pair, vol);
                    resolve(null);
                });
            });
        }));
        
        cb({
            buy: volBuy,
            sell: volSell,
        })
    }
}

export default new Monitor();