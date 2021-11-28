import { Pair, Token, TokenAmount } from "@sushiswap/sdk";
import { ethers } from "ethers";
import TokenEntry, { toToken } from "./types/TokenEntry";
import config from "./config";

export type OnSync = (pair: Pair) => Promise<void> | void;

class Pairs {
    static async fetch(provider: ethers.providers.BaseProvider) {
        const tokens: TokenEntry[]  = config.tokens;
        const tokenCombinations: [Token, Token][] = [];
        for (const entryA of tokens) {
            const tokenA = toToken(entryA);
            for (const entryB of tokens) {
                const tokenB = toToken(entryB);
                if (tokenA.address !== tokenB.address && tokenA.sortsBefore(tokenB)) {
                    tokenCombinations.push([tokenA, tokenB]);
                }
            }
        }
        const pairs = await Promise.all(
            tokenCombinations.map(async pair => {
                const [tokenA, tokenB] = pair;
                try {
                    const balances: any = [
                        ethers.constants.WeiPerEther.mul(1),
                        ethers.constants.WeiPerEther.mul(1),
                    ];
                    return new Pair(new TokenAmount(tokenA, balances[0]), new TokenAmount(tokenB, balances[1]));
                } catch (e) {
                    return null;
                }
            })
        );
        return { tokens: tokens.map(token => toToken(token)), pairs: pairs.filter(pair => pair != null) };
    }
}

export default Pairs;
