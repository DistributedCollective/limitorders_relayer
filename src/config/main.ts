import { tokens } from '../tokens/mainnet.json';
import accounts from '../secrets/accounts';

export default {
    mainnet: true,
    db: 'limitorders_relayer.db',
    serverPort: 4000,
    rpcNode: 'https://mainnet.sovryn.app/rpc',
    contracts: {
        settlement: '0x4E19834396816398469585C7C0F6c5fd5DBFDA8b',
        orderBook: '0x8316F90a73e14a4e3B87263f0fde575219d3c210',
        orderBookMargin: '0x142397a33b79c97f13dC709DFE93fca39A7ba25e',
        sovrynSwap: '0x98ace08d2b759a265ae326f010496bcd63c15afc',
    },
    tokens: tokens,
    minOrderSize: String(1000e18), //1000$ ~ 2$ fee
    maxOrdersInBatch: 5,
    accounts: accounts.main,
    blockExplorer: "https://explorer.rsk.com/",
};