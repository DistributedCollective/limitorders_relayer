import {tokens} from '../tokens/testnet.json';
import accounts from '../secrets/accounts';

export default {
    rpcNode: 'https://testnet.sovryn.app/rpc',
    db: 'limitorders_relayer_test.db',
    serverPort: 4000,
    contracts: {
        settlement: '0xF7F1fFC1243405003C94f7c7db13aA5Abc043B7C',
        orderBook: '0x31186271359414fA40F81cbFA56fab72F549cBaD',
        orderBookMargin: '0x92aFAF5051d84692fcE7d04a1729C3357028DB79',
        sovrynSwap: '0x61172b53423e205a399640e5283e51fe60ec2256',
    },
    tokens: tokens,
    minOrderSize: String(1e18), //xusd
    maxOrdersInBatch: 5,
    accounts: accounts.testnet,
    blockExplorer: "https://explorer.testnet.rsk.com/",
};