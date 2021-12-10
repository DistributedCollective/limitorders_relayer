import { ethers } from "ethers";
import config from "./config";
import testnet from "./config/testnet";

class RSK {
    provider: ethers.providers.JsonRpcProvider;
    wallet: ethers.Wallet;

    static Mainnet = new RSK(config.rpcNode, "0x" + process.env.PRIVATE_KEY);
    static Testnet = new RSK(testnet.rpcNode, "0x" + process.env.PRIVATE_KEY);

    private constructor(nodeUrl: string, privateKey: string) {
        this.provider = new ethers.providers.JsonRpcProvider(nodeUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
}

export default RSK;
