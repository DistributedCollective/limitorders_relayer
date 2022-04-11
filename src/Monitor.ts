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

    async getAddresses(cb: any) {
        const res = [];
        for (const acc of this.net.accounts) {
            const info = await this.getAccountInfoForFrontend(acc);
            res.push(info);
        }
        cb(res);
    }
    async getTotals(cb: any, last24h = false) {
        const result = await Db.getTotals(last24h);
        cb(result);
    }
    
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

    async listAllPair(type = 'spot', cb) {
        let pairs = await Db.listAllPairs(type == 'spot');
        cb(pairs);
    }

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

    async sumVolumn(type, pair, cb) {
        const orders = await Db.findOrders(type, { pair, limit: -1 });
        let vol: any = {
            buy: 0,
            sell: 0
        };
        if (!orders || orders.length == 0) return vol;

        const [baseSymbol, quoteSymbol] = pair.split('/');

        if (type == 'spot') {
            orders.forEach(order => {
                const pairTokens = Orders.getPair(order.fromToken, order.toToken);
                if (order.fromToken.toLowerCase() == pairTokens[0].address.toLowerCase()) {
                    vol.sell += Number(formatEther(order.amountIn));
                } else {
                    vol.buy += Number(formatEther(order.amountIn));
                }
            });

            vol = {
                buy: Number(vol.buy.toFixed(6)) + ' ' + quoteSymbol,
                sell: Number(vol.sell.toFixed(6)) + ' ' + baseSymbol,
            };

        } else {
            let volBuy = BigNumber.from(0);
            let volSell = BigNumber.from(0);
            const baseAdr = Utils.getTokenAddress(baseSymbol);
            const quoteAdr = Utils.getTokenAddress(quoteSymbol);
            const basePrice = PriceFeeds.getPrice(baseAdr, Utils.getTokenAddress('xusd'));
            const quotePrice = PriceFeeds.getPrice(quoteAdr, Utils.getTokenAddress('xusd'));

            for (const order of orders) {
                if (order.loanAssetAdr.toLowerCase() == baseAdr.toLowerCase()) {
                    const loanUsd = order.loanTokenSent.mul(parseEther(basePrice));
                    const collUsd = order.collateralTokenSent.mul(parseEther(quotePrice));
                    
                    volSell = loanUsd.add(collUsd).add(volSell);
                } else {
                    const loanUsd = order.loanTokenSent.mul(parseEther(quotePrice));
                    const collUsd = order.collateralTokenSent.mul(parseEther(basePrice));

                    volBuy = loanUsd.add(collUsd).add(volBuy);
                }
            }

            vol.buy = Number(formatEther(volBuy.div(ethers.constants.WeiPerEther))).toFixed(2) + ' USD';
            vol.sell = Number(formatEther(volSell.div(ethers.constants.WeiPerEther))).toFixed(2) + ' USD';
        }

        cb(vol);
    }
}

export default new Monitor();