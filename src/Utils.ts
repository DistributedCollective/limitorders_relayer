import { BigNumber, Contract, ethers } from "ethers";
import config from "./config";
import RSK from "./RSK";
import swapAbi from "./config/abi_sovrynSwap.json";
import erc20Abi from "./config/abi_erc20.json";
import Log from "./Log";
import TokenEntry from "./types/TokenEntry";
import { Token } from "@sushiswap/sdk";

export class Utils {
    static formatDate(date) {
        const output = new Date(parseInt(date) * 1000).toISOString().slice(0, 19).replace("T", " ");
        return output;
    }

    static getTokenAddress(symbol: string): string {
        const token: TokenEntry = config.tokens.find((t: TokenEntry) => t.symbol.toLowerCase() === symbol.toLowerCase());
        return token && token.address;
    }

    static getTokenSymbol(address: string): string {
        const token: TokenEntry = config.tokens.find((t: TokenEntry) => t.address.toLowerCase() === address.toLowerCase());
        return token && token.symbol;
    }

    static async convertTokenAmount(fromToken: string, toToken: string, amount: BigNumber): Promise<BigNumber> {
        try {
            const swapContract = new Contract(config.contracts.sovrynSwap, swapAbi, RSK.Mainnet.provider);
            const path = await swapContract.conversionPath(fromToken, toToken);
            const amountOut = await swapContract.rateByPath(path, amount.toString());
            return BigNumber.from(String(amountOut));
        } catch (error) {
            Log.e(error);
        }
    }

    static async getTokenBalance(adr: string, token: string) {
        try {
            const contract = new Contract(token, erc20Abi, RSK.Mainnet.provider);
            const bal = await contract.balanceOf(adr);
            return BigNumber.from(String(bal));
        } catch (error) {
            Log.e(error);
        }
    }

    static async convertUsdAmount(token: string, amount: BigNumber): Promise<BigNumber> {
        const xusd = this.getTokenAddress('xusd');
        if (xusd.toLowerCase() === token.toLowerCase()) return amount;
        return await this.convertTokenAmount(token, xusd, amount);
    }

    static getUuid(len = 8) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < len; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static async wasteTime(seconds) {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    static async getGasPrice(signer: ethers.Signer | ethers.providers.Provider) {
        return (await signer.getGasPrice()).mul(120).div(100);
    }

    static findToken (tokens: Token[], tokenAddress: string) {
        return tokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase());
    };

    static shortNum(num) {
        let decimals = 4;
        if (Number(num) < 1) {
            decimals = 8;
        }
        const [int, float] = String(num).split('.');
        return int + "." + (float || "0").substring(0, decimals);
    }
}
