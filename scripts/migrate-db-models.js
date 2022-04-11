const { BigNumber } = require('ethers');
const { default: Db } = require('../dist/Db');
const { Utils } = require('../dist/Utils');
const { default: configs} = require('../dist/config');
const { default: OrderModel} = require('../dist/models/OrderModel');
const { default: Orders } = require('../dist/Orders');
const { default: MarginOrders } = require('../dist/MarginOrders');
const { default: RSK } = require('../dist/RSK');

const start = async () => {
    await Db.initDb(configs.db);
    const orderModel = new OrderModel(Db.db);
    const orders = await orderModel.find({}, { limit: 10000 });

    for (const order of orders) {
        const model = {
            hash: order.hash,
            batchId: order.batchId,
            status: order.status,
            owner: order.owner,
            relayer: order.relayer,
            dateAdded: order.dateAdded,
            profit: order.profit,
            txHash: order.txHash,
            orderTime: order.orderTime,
            detail: order.detail,
        }

        const detail = JSON.parse(order.detail);
        let res;
        if (order.type == 'limit') {
            const pairTokens = Orders.getPair(detail.fromToken, detail.toToken);
            model.pair = pairTokens[0].symbol + '/' + pairTokens[1].symbol;
            res = await Db.spotModel.insert(model);
        } else {
            const loanAssetAdr = await MarginOrders.checkLoanAdr(detail, RSK.Mainnet.provider);
            const pairTokens = Orders.getPair(loanAssetAdr, detail.collateralTokenAddress);
            model.pair = pairTokens[0].symbol + '/' + pairTokens[1].symbol;
            res = await Db.marginModel.insert(model);
        }
        console.log('inserted', order.type, order.hash, res && res.id);
    }
}

start().catch(console.error);