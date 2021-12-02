let { default: config } = require('./testnet');

if (process.argv.indexOf('--local') >= 0) {
    config = require('./local').default;
    console.log('Using local config');
} else if (process.argv.indexOf('--mainnet') >= 0) {
    config = require('./main').default;
    console.log('Using mainnet config');
} else {
    console.log('Using testnet config');
}

interface Config {
    rpcNode: string;
    contracts: {
        settlement: string;
        orderBook: string;
        orderBookMargin: string;
        sovrynSwap: string;
    };
    tokens: [];
}

export default config as Config;
