import {tokens} from '../tokens/testnet.json';
import accounts from '../secrets/accounts';

export default {
    rpcNode: 'https://testnet.sovryn.app/rpc',
    db: 'limitorders_relayer_test.db',
    serverPort: 4000,
    contracts: {
        settlement: '0x4E19834396816398469585C7C0F6c5fd5DBFDA8b',
        orderBook: '0x8316F90a73e14a4e3B87263f0fde575219d3c210',
        orderBookMargin: '0x142397a33b79c97f13dC709DFE93fca39A7ba25e',
        sovrynSwap: '0x61172b53423e205a399640e5283e51fe60ec2256',
    },
    tokens: tokens,
    minOrderSize: String(1e18), //xusd
    maxOrdersInBatch: 5,
    accounts: accounts.testnet,
    blockExplorer: "https://explorer.testnet.rsk.com/",
};