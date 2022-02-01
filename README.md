# Sovryn Relayer Bot

Automated relayer bot for [Sovryn Settlement] (https://github.com/DistributedCollective/LimitOrder).

## Incentives
 
### Fee
For every `fillOrder()` call, 0.2% fee of the amount sold is paid to the caller. The fee is deducted prior to the swap.


> **WARNING**: This bot is in *alpha* stage so it could harm your funds. Read the code and use it with caution.


## Install
1. Install [Node.js](https://nodejs.org/en/download/) if not installed.
2. Install [Yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable) if not installed.
3. Install dependencies.
```shell script
$ cd limitorders_relayer
$ yarn
```
4. Create directory logs and db
5. Prepare accounts for relayers: create `src/secrets/accounts.ts` file contains relayers private keys as below format:
```
export default {
    local: [],
    testnet: [],
    main: [
        {
            address: '',
            pKey: ''
        },
    ]
}
```

## Run
```shell script
$ yarn start:[testnet | mainnet]
```

## License
MIT
