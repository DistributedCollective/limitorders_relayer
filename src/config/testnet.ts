import {tokens} from '../tokens/testnet.json';
import accounts from '../secrets/accounts';

export default {
    rpcNode: 'https://testnet.sovryn.app/rpc',
    db: 'limitorders_relayer_test.db',
    serverPort: 3030,
    contracts: {
        settlement: '0xE97539b54a8a71597A0313c0cfE2CE7672d18eF8',
        orderBook: '0x7E174425b18cC76838A879607E18C5d9e65fE79c',
        orderBookMargin: '0x5c98Ec8291bfAD27Db2fC4366f1531d715D5094D',
        sovrynSwap: '0x61172b53423e205a399640e5283e51fe60ec2256',
    },
    tokens: tokens,
    minOrderSize: String(1e18), //xusd
    maxOrdersInBatch: 5,
    accounts: accounts.testnet,
    blockExplorer: "https://explorer.testnet.rsk.co/",
    loanContracts: {
        iXUSD: "0x9bd0ce087b14ef67c3d37c891139aae7d94a961a",
        iRBTC: "0xe67fe227e0504e8e96a34c3594795756dc26e14b",
    },
};