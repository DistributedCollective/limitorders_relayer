import { ethers } from "ethers";
import { Trade } from "@sushiswap/sdk";
import { BaseOrder } from "./Order";

interface MarginOrder extends BaseOrder {
    hash: string;
    loanId: string;
    leverageAmount: ethers.BigNumber;
    loanTokenAddress: string;
    loanTokenSent: ethers.BigNumber;
    collateralTokenSent: ethers.BigNumber;
    collateralTokenAddress: string;
    trader: string;
    minEntryPrice: ethers.BigNumber;
    loanDataBytes: string;
    deadline: ethers.BigNumber;
    createdTimestamp: ethers.BigNumber;
    v: number;
    r: string;
    s: string;
    trade?: Trade;
    loanAssetAdr?: string;
}

export default MarginOrder;
