import {tokens} from '../tokens/testnet.json';
import accounts from '../secrets/accounts';

export default {
    rpcNode: 'https://testnet.sovryn.app/rpc',
    db: 'limitorders_relayer_test.db',
    serverPort: 3001,
    contracts: {
        settlement: '0x4dfb9ab1653Eb5A295109E02e37fc222D85fdA74',
        orderBook: '0xfD4D1FBFC652f5b3D98881b9346635399F1e6254',
        orderBookMargin: '0x1213B6D3552DA46dF4767EeD8cb2d0BD7D8e913d',
        sovrynSwap: '0x61172b53423e205a399640e5283e51fe60ec2256',
        priceFeeds: "0x7f38c422b99075f63C9c919ECD200DF8d2Cf5BD4",
    },
    tokens: tokens,
    minOrderSize: String(1e18), //xusd
    maxOrdersInBatch: 2,
    accounts: accounts.testnet,
    blockExplorer: "https://explorer.testnet.rsk.co/",
    loanContracts: {
        iXUSD: "0x9bd0ce087b14ef67c3d37c891139aae7d94a961a",
        iRBTC: "0xe67fe227e0504e8e96a34c3594795756dc26e14b",
        iDoc: "0x74e00A8CeDdC752074aad367785bFae7034ed89f",
    },
};