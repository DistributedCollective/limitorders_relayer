import {tokens} from '../tokens/testnet.json';
import accounts from '../secrets/accounts';

export default {
    rpcNode: 'https://testnet.sovryn.app/rpc',
    db: 'limitorders_relayer_test.db',
    serverPort: 3000,
    contracts: {
        settlement: '0x84F2456B16ba982A47cb623Fe7F4DaDaB896a0F5',
        orderBook: '0xC5227dBc8EA9E22439f328A80b605B0cDfaD0C54',
        orderBookMargin: '0xE222Ecb042565Ee577c34EC28686FFFd15675592',
        sovrynSwap: '0x61172b53423e205a399640e5283e51fe60ec2256',
    },
    tokens: tokens,
    minOrderSize: String(1e18), //xusd
    maxOrdersInBatch: 5,
    accounts: accounts.testnet,
    blockExplorer: "https://explorer.testnet.rsk.com/",
};