import { tokens } from '../tokens/mainnet.json';
import accounts from '../secrets/accounts';

export default {
    mainnet: true,
    db: 'limitorders_relayer.db',
    serverPort: 4000,
    rpcNode: 'https://mainnet.sovryn.app/rpc',
    contracts: {
        settlement: '0x0064237629be0B8eDc5D09De0cc897f443F66540',
        orderBook: '0x0064237629be0B8eDc5D09De0cc897f443F66540',
        orderBookMargin: '0xfb450793AFC52727fAd789dAE06E6ECF01cBBa61',
        sovrynSwap: '0x98ace08d2b759a265ae326f010496bcd63c15afc',
        priceFeeds: '0x437AC62769f386b2d238409B7f0a7596d36506e4',
    },
    tokens: tokens,
    minOrderSize: String(10e18),
    maxOrdersInBatch: 5,
    accounts: accounts.main,
    blockExplorer: "https://explorer.rsk.co/",
    loanContracts: {
        iXUSD: "0x8f77ecf69711a4b346f23109c40416be3dc7f129",
        iRBTC: "0xa9dcdc63eabb8a2b6f39d7ff9429d88340044a7a",
        iSUSD: "0xd8d25f03ebba94e15df2ed4d6d38276b595593c1",
        iUSDT: "0x849c47f9c259e9d62f289bf1b2729039698d8387",
    },
};