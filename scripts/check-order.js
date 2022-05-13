const { default: Monitor } = require('../dist/Monitor');
const { default: RSK} = require('../dist/RSK');
const { SettlementLogic__factory } = require("../dist/contracts");
const { default: config } = require('../dist/config');
const {Utils} = require('../dist/Utils');
const ethers = require('ethers');
const erc20Abi = require('../src/config/abi_erc20.json');


async function getOrder(hash, isMargin) {
    return new Promise(resolve => {
        Monitor.getOrderDetail(hash, isMargin, (order) => {
            console.log(order);
            resolve(order);
        })
    })
}


(async function check() {
    const provider = RSK.Mainnet.provider;
    const order = await getOrder('0x8fad056afd890e6652ec88318b3758d688ee9d2fa8cb35a0fd22071bf5dafb6b');
    const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);
    console.log(Number(await settlement.minMarginOrderTxFee()))
    if (order.fromToken.toLowerCase() == Utils.getTokenAddress('wrbtc').toLowerCase()) {
        console.log('settlement rbtc balance', ethers.utils.formatEther(await settlement.balanceOf(order.maker)));
    } else {
        const tokenIn = new ethers.Contract(order.fromToken, erc20Abi, provider);
        console.log('token balance of maker', ethers.utils.formatEther(await tokenIn.balanceOf(order.maker)), await tokenIn.symbol());
    }

})();