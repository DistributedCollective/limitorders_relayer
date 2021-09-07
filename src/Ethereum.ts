import { ethers } from "ethers";

class Ethereum {
    provider: ethers.providers.JsonRpcProvider;
    wallet: ethers.Wallet;

    static Mainnet = new Ethereum(1, "0x" + process.env.PRIVATE_KEY);
    static Kovan = new Ethereum(42, "0x" + process.env.PRIVATE_KEY);

    private constructor(chainId: number, privateKey: string) {
        //this.provider = new ethers.providers.AlchemyProvider(chainId, apiKey);
        //this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
         this.provider = new ethers.providers.JsonRpcProvider("https://testnet.sovryn.app/rpc");
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
}

export default Ethereum;