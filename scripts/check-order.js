const { default: Monitor } = require('../dist/Monitor');
const { default: Db} = require('../dist/Db');
const { default: RSK} = require('../dist/RSK');
const { SettlementLogic__factory } = require("../dist/contracts");
const { default: config } = require('../dist/config');
const {Utils} = require('../dist/Utils');
const ethers = require('ethers');
const erc20Abi = require('../src/config/abi_erc20.json');


const provider = RSK.Mainnet.provider;
const settlement = SettlementLogic__factory.connect(config.contracts.settlement, provider);

async function getOrder(hash, isMargin) {
    return new Promise(resolve => {
        Monitor.getOrderDetail(hash, isMargin, (order) => {
            console.log(order);
            resolve(order);
        })
    })
}

async function checkBal(adr, tokenAdr, provider) {
    if (tokenAdr.toLowerCase() == Utils.getTokenAddress('wrbtc').toLowerCase()) {
        console.log('settlement rbtc balance', ethers.utils.formatEther(await settlement.balanceOf(adr)));
    } else {
        const token = new ethers.Contract(tokenAdr, erc20Abi, provider);
        console.log('token balance of maker', ethers.utils.formatEther(await token.balanceOf(adr)), await token.symbol());
        console.log('allowance', ethers.utils.formatEther(await token.allowance(adr, config.contracts.settlement)));
    }
}

(async function check(hash = '0xb144133da8a64712e331dcd4647648305bc0543537c2e74db5bbbc4be7406737') {
    await Db.initDb(config.db);

    const { type } = await Db.checkOrderHash(hash);
    const order = await getOrder(hash, type == 'margin');
    console.log(Number(await settlement.minMarginOrderTxFee()));

    if (type == 'margin') {
        console.log('Loan token:');
        await checkBal(order.trader, order.loanAssetAddress, provider);
        console.log('\nCollateral token:');
        await checkBal(order.trader, order.collateralTokenAddress, provider);

    } else {
        await checkBal(order.maker, order.fromToken, provider);
    }

})();