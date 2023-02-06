import { tokens } from '../tokens/mainnet.json';
import accounts from '../secrets/accounts';
import telegram from '../secrets/telegram';

export default {
    mainnet: true,
    db: 'limitorders_relayer.db',
    serverPort: 3006,
    rpcNode: 'https://rsk-internal.sovryn.app/rpc',
    contracts: {
        settlement: '0x823e55322a395516ac3930F4C1ad9C7c2Fe2EACd',
        orderBook: '0x1c910918d6D05feC83e2376D57226d1b08324028',
        orderBookMargin: '0x3677e8a679536d80F0b33ED2d1d0bC01a6634a4D',
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
    telegram: telegram,
    depositThresold: 5
};
