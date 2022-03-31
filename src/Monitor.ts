import { BigNumber, constants, Contract, ethers, providers } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import config, { RelayerAccount } from "./config";
import { OrderBookMarginLogic__factory, OrderBookSwapLogic__factory, SettlementLogic__factory } from "./contracts";
import Db from "./Db";
import RSK from "./RSK";
import { Utils } from "./Utils";
import Orders from "./Orders";
import TokenEntry from "./types/TokenEntry";
import OrderModel from "./models/OrderModel";
import MarginOrders from "./MarginOrders";

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
        let usdBal = 0;
        for (const tokenBal of accountWithInfo.tokenBalances) {
            let bal = Number(tokenBal.balance) || 0;
            if (tokenBal.token.toLowerCase() == 'wrbtc') bal += rbtcBal;
            if (bal <= 0) continue;
            const price = await Utils.convertUsdAmount(tokenBal.adr, BigNumber.from(parseEther(String(bal))));
            usdBal += (Number(formatEther(price)) * bal) || 0;
        }

        accountWithInfo.usdBalance = usdBal.toFixed(2);

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

    getPair(adr1: string, adr2: string): TokenEntry[] {
        const i1 = config.tokens.findIndex(t => t.address.toLowerCase() == adr1.toLowerCase());
        const i2 = config.tokens.findIndex(t => t.address.toLowerCase() == adr2.toLowerCase());
        if (i1 < 0 || i2 < 0) throw "Wrong token";

        return i1 < i2 ? [config.tokens[i1], config.tokens[i2]]
            : [config.tokens[i2], config.tokens[i1]];
    }

    async listOrders({ type = 'limit', status = '', offset = 0, limit = 10} = {}, cb) {
        const _STATUSS = OrderModel.Statuss;
        const statusFilter: any = {};
        if (status == 'open') statusFilter.status = [ 
            _STATUSS.open,
            _STATUSS.matched,
            _STATUSS.retrying,
            _STATUSS.filling,
            _STATUSS.failed,
            _STATUSS.failed_smallOrder,
        ];
        if (status == 'canceled') statusFilter.status = [ _STATUSS.canceled];
        if (status == 'filled') statusFilter.status = [ _STATUSS.filled, _STATUSS.success];

        const orders = await Db.findOrders(type, {
            offset,
            limit,
            latest: true,
            ...statusFilter
        });
        const total = await Db.countOrders({ type, ...statusFilter });
        const orderDetails = [];
        for (const order of orders) {
            let orderDetail;
            if (order.type == 'limit') orderDetail = await Orders.parseOrderDetail(order, true);
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
}

export default new Monitor();