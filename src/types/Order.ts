import { ethers } from "ethers";
import { Trade } from "@sushiswap/sdk";

export interface BaseOrder {
    hash: string;
    id?: number;
    status?: string;
    relayer?: string;
    txHash?: string;
    type?: string;
    pair?: string;
    matchPercent?: number;
}

interface Order extends BaseOrder {
    hash: string;
    maker: string;
    fromToken: string;
    toToken: string;
    amountIn: ethers.BigNumber;
    amountOutMin: ethers.BigNumber;
    recipient: string;
    deadline: ethers.BigNumber;
    created: ethers.BigNumber;
    v: number;
    r: string;
    s: string;
    trade?: Trade;
    filledPrice: string;
}

export default Order;
