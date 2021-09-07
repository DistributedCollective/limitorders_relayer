# Sovryn Relayer Bot

Automated relayer bot for [Sovryn Settlement] (https://github.com/DistributedCollective/LimitOrder).

## Incentives
### Relayer
`Settlement` is a wrapper contract around `UniswapV2Router02`. Every function in this contract has a duplicated version in the `Settlement` with an extra parameter `args`. If `args` is not empty, it is used for filling orders; see `Settlement.fillOrders()` for details.

So, users for SushiSwap can choose to be a relayer or not. If he/she decided to do so, calling any swap functions in `Settlement` will benefit them. Otherwise, he/she can just call functions in `UniswapV2Router02` without receiving any fee.
 
### Fee
For every `fillOrder()` call, 0.2% fee of the amount sold is charged. Out of the fee, 20% goes to xSUSHI holders and the remainder to the relayer. The fee is deducted prior to the swap.

Let's assume *Alice* created an order to sell **1 ETH** with the minimum price of **500 DAI**. Current price of **ETH** is **400 DAI** so this order cannot be filled right away. Leter, when the market price goes up to **500 DAI**, *Bob* is trying to fill the entire amount of this order as a relayer.

If the call is successful, amounts of tokens transferred are:
* Limit Order Fee: **1 ETH** x 0.2% x 80% = **0.0016 ETH** (goes to *Bob*; relayer)
* Limit Order Fee Split: **1 ETH** x 0.2% x 20% = **0.0004 ETH** (goes to *xSUSHI*)
* Swap Fee: (**1 ETH** - **0.002 ETH**) x 0.3% = **0.002994 ETH** (goes to the liquidity provider)
* ETH Amount Sold: **1 ETH** - **0.002 ETH** - **0.002994 ETH** = **0.995006 ETH** (goes to the liquidity pool)
* DAI Amount Bought: **0.995006 ETH** x **500 DAI** = **497.503 DAI** (goes to *Alice*; maker)


> **WARNING**: This bot is in *pre-alpha* stage so it could harm your funds. Read the code and use it with caution.

## Download
```shell script
git clone https://github.com/sushiswap/sushiswap-relayer
```

## Install
1. Install [Node.js](https://nodejs.org/en/download/) if not installed.
2. Install [Yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable) if not installed.
3. Install dependencies.
```shell script
$ cd sushiswap-relayer
$ yarn
```

## Configure
### Provider
You need alchemy API keys.
1. Sign up [here](https://dashboard.alchemyapi.io/signup/).
2. Create two apps on Mainnet and Kovan.
3. Copy **API keys** from both networks.

### Signer
You need an ethereum account with balances.
Copy your ethereum account **private key**.

### Write .env file
Create `.env` in the project root.
```shell script
MAINNET=<Your Mainnet App API Key>
KOVAN=<Your Kovan App API Key>
PRIVATE_KEY=<Your Private Kye>
```

## Run
```shell script
$ yarn start
```

## License
MIT
