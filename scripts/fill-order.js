//run: node -r esm scripts/fill-order.js --[testnet | mainnet]

const { default: Db } = require('../dist/Db');
const { default: RSK } = require('../dist/RSK');
const { default: Orders } = require('../dist/Orders');
const { default: MarginOrders } = require('../dist/MarginOrders');
const { default: config } = require('../dist/config');

const settlementNetwork = RSK.Mainnet;
const provider = settlementNetwork.provider;

async function fill(hash) {
    const order = await Db.checkOrderHash(hash);
    if (!order) return console.log("Order's not found");

    let txData;
    if (order.type == 'margin') {
        const filtered = await MarginOrders.checkSimulatedTransaction([order], provider);
        if (!filtered || filtered.length == 0) return;

        txData = await MarginOrders.getFillOrdersData([order], provider);
    } else {
        const filtered = await Orders.checkSimulatedTransaction([order], provider);
        if (!filtered || filtered.length == 0) return;

        txData = await Orders.getFillOrdersData([order], provider);
    }

    const sender = await settlementNetwork.getWallet();
    if (!sender) return;

    const { tx } = await settlementNetwork.sendTx(txData);
    console.log(tx);

    return await tx.wait();
}


(async () => {
    await Db.initDb(config.db);

    try {
        const res = await fill('0xa5e557e3894beca883d1114b8a06aa4d90965b02045849e4b941d0238ab6ae7b');
        console.log(res);
    } catch (e) {
        console.log('send error');
        console.log(JSON.stringify(e, null, 2));
    }
})();