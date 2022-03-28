import { BigNumber, constants, Contract, ethers, providers } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import config, { RelayerAccount } from "./config";
import { OrderBookMarginLogic__factory, OrderBookSwapLogic__factory, SettlementLogic__factory } from "./contracts";
import Db from "./Db";
import RSK from "./RSK";
import { Utils } from "./Utils";
import Orders from "./Orders";
import erc20ABI from './config/abi_erc20.json';
import loanABI from './config/abi_loan.json';
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

            order = await MarginOrders.parseOrderDetail(raw as any);
            // const loanContract = new Contract(raw.loanTokenAddress, loanABI, RSK.Mainnet.provider);
            // const loanAssetToken = new Contract(await loanContract.loanTokenAddress(), erc20ABI, RSK.Mainnet.provider);
            // const collateralToken = new Contract(raw.collateralTokenAddress, erc20ABI, RSK.Mainnet.provider);

            // order = {
            //     loanId: raw.loanId,
            //     leverageAmount: formatEther(raw.leverageAmount),
            //     loanTokenAddress: raw.loanTokenAddress,
            //     loanTokenSent: formatEther(raw.loanTokenSent) + ' ' + (await loanAssetToken.symbol()),
            //     collateralTokenSent: formatEther(raw.collateralTokenSent) + ' ' + (await collateralToken.symbol()),
            //     collateralTokenAddress: raw.collateralTokenAddress,
            //     trader: raw.trader,
            //     minEntryPrice: formatEther(raw.minEntryPrice),
            //     loanDataBytes: raw.loanDataBytes,
            //     deadline: raw.deadline.toNumber(),
            //     createdTimestamp: raw.createdTimestamp.toNumber(),
            // };
            // const pairTokens = this.getPair(loanAssetToken.address, collateralToken.address);
            // order.pair = pairTokens[0].name + '/' + pairTokens[1].name;
            // if (loanAssetToken.address.toLowerCase() == pairTokens[0].address.toLowerCase()) {
            //     order.fromSymbol = pairTokens[0].name;
            //     order.toSymbol = pairTokens[1].name;
            //     order.pos = 'Short';
            //     order.limitPrice = ">= " + order.minEntryPrice;
            // } else {
            //     order.fromSymbol = pairTokens[1].name;
            //     order.toSymbol = pairTokens[0].name;
            //     order.pos = 'Long';
            //     order.limitPrice = "<= " + (1 / Number(order.minEntryPrice));
            // }
        } else {
            const raw = await orderBook.orderOfHash(hash);
            if (raw.maker == constants.AddressZero) cb({error: 'Order is not found'});
            order = await Orders.parseOrderDetail(raw as any, true);
            // order = {
            //     maker: raw.maker,
            //     fromToken: raw.fromToken,
            //     toToken: raw.toToken,
            //     amountIn: formatEther(raw.amountIn),
            //     amountOutMin: formatEther(raw.amountOutMin),
            //     recipient: raw.recipient,
            //     deadline: raw.deadline.toNumber(),
            //     created: raw.created.toNumber(),
            // };
            // const fee = await Orders.estimateOrderFee(RSK.Mainnet.provider, { address: raw.fromToken } as any, raw.amountIn);
            // const actualAmountIn = BigNumber.from(raw.amountIn).sub(fee);
            // const limitPrice = BigNumber.from(raw.amountOutMin).mul(ethers.constants.WeiPerEther).div(actualAmountIn);
            // const pairTokens = this.getPair(order.fromToken, order.toToken);
            // order.pair = pairTokens[0].name + '/' + pairTokens[1].name;

            // if (order.fromToken.toLowerCase() == pairTokens[0].address.toLowerCase()) {
            //     order.fromSymbol = pairTokens[0].name;
            //     order.toSymbol = pairTokens[1].name;
            //     order.isSell = true;
            //     order.limitPrice = ">= " + formatEther(limitPrice);
            // } else {
            //     order.fromSymbol = pairTokens[1].name;
            //     order.toSymbol = pairTokens[0].name;
            //     order.isSell = false;
            //     order.limitPrice = "<= " + (1 / Number(formatEther(limitPrice)));
            // }

            // order.estFee = formatEther(fee) + order.fromSymbol;
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
        if (status == 'filled') statusFilter.status = [ _STATUSS.filled_by_another, _STATUSS.success];

        const orders = await Db.findOrders(type, {
            offset,
            limit,
            latest: true,
            ...statusFilter
        });
        const total = await Db.countOrders({ type, ...statusFilter });
        const orderDetails = [];
        for (const order of orders) {
            console.log(order)
            let orderDetail;
            if (order.type == 'limit') orderDetail = await Orders.parseOrderDetail(order);
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