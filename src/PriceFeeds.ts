import priceFeedsAbi from "./config/abi_pricefeed.json";
import swapAbi from "./config/abi_sovrynSwap.json";
import config from "./config";
import { Pair } from "@sushiswap/sdk";
import Log from "./Log";
import { BigNumber, ethers } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";

class PriceFeeds {
    pairs: Pair[];
    _pairPrices = {};
    priceFeeds: ethers.Contract;
    swap: ethers.Contract;

    init(provider: ethers.providers.BaseProvider) {
        this.priceFeeds = new ethers.Contract(config.contracts.priceFeeds, priceFeedsAbi, provider);
        this.swap = new ethers.Contract(config.contracts.sovrynSwap, swapAbi, provider);
    }

    async updatePairs(pairs: Pair[]) {
        this.pairs = pairs;
        await Promise.all(pairs.map(async (pair) => {
            const fromToken = pair.token0;
            const toToken = pair.token1;
            const pairSymbol = `${fromToken.symbol}/${toToken.symbol}`;
            let price;
            // try {
            //     const { rate, precision } = await this.priceFeeds.queryRate(fromToken.address, toToken.address);
            //     price = BigNumber.from(rate).mul(ethers.constants.WeiPerEther).div(precision);
            // } catch (er) {
            //     Log.d(`Failed to check price ${pairSymbol} on PriceFeeds, checking on swap amm`);
                const amount = parseEther('0.0001');
                const path = await this.swap.conversionPath(fromToken.address, toToken.address);
                const rate = await this.swap.rateByPath(path, amount);
                price = BigNumber.from(rate).mul(ethers.constants.WeiPerEther).div(amount);
            // }
            // Log.d('price', pairSymbol, '=', ethers.utils.formatEther(price));
            this._pairPrices[pairSymbol] = price;
        }));
    }

    getPrice(fromToken: string, toToken: string): string {
        fromToken = fromToken.toLowerCase();
        toToken = toToken.toLowerCase();
        const pair = this.pairs.find(p => {
            const token0 = p.token0.address.toLowerCase();
            const token1 = p.token1.address.toLowerCase();
            return token0 == fromToken && token1 == toToken ||
                token0 == toToken && token1 == fromToken;
        });
        if (!pair) {
            Log.d(`Pair not found, could not get price for tokens [${fromToken}, ${toToken}]`);
            this.pairs.forEach(p => console.log(p.token0.symbol, p.token1.symbol, p.token0.address, p.token1.address))
            return "1";
        }

        const pairSymbol = `${pair.token0.symbol}/${pair.token1.symbol}`;
        if (this._pairPrices[pairSymbol] == null) return "1";

        let price = Number(formatEther(this._pairPrices[pairSymbol]));
        if (fromToken == pair.token1.address.toLowerCase()) {
            price = 1/price;
        }

        return String(price);
    }
}

export default new PriceFeeds();