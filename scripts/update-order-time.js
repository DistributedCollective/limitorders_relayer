const { default: Db } = require('../dist/Db');
const { Utils } = require('../dist/Utils');
const { default: configs} = require('../dist/config');
const { BigNumber } = require('ethers');

const start = async () => {
    console.log(Utils);
    await Db.initDb(configs.db);
    const orders = await Db.orderModel.find({}, { limit: 10000 });
    for (const order of orders) {
        const orderData = JSON.parse(order.detail);
        const timestamp = order.type == 'margin' ? orderData.createdTimestamp : orderData.created;
        const orderTime = Utils.formatDate(BigNumber.from(timestamp).toNumber());
        console.log(timestamp, orderTime)
        await Db.orderModel.update({ hash: order.hash }, { orderTime });
        console.log('updated hash %s, %s', order.hash, orderTime);
    }
}

start();