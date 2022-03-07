import { constants, ethers } from "ethers";
import AsyncLock from 'async-lock';
import config, { RelayerAccount } from "./config";
import testnet from "./config/testnet";
import Log from "./Log";

const locker = new AsyncLock();
const lock = async (key: string): Promise<() => void> => {
    return new Promise(resolve => {
        locker.acquire(key, (release) => {
            resolve(release);
        });
    });
};

class RSK {
    provider: ethers.providers.JsonRpcProvider;
    accounts: RelayerAccount[];
    pendingHashes = {};

    static Mainnet = new RSK(config.rpcNode, config.accounts);
    static Testnet = new RSK(testnet.rpcNode, config.accounts);

    private constructor(nodeUrl: string, accounts: RelayerAccount[]) {
        this.provider = new ethers.providers.JsonRpcProvider(nodeUrl);
        this.accounts = accounts;
    }

    async getWallet(): Promise<ethers.Wallet> {
        const release = await lock('getWallet');
        for (const acc of this.accounts) {
            const nrPending = this.getNrPending(acc.address);

            if (nrPending >= 4) continue;

            const wallet = new ethers.Wallet(acc.pKey, this.provider);
            const bal = await wallet.getBalance();
            // console.log('wallet.getBalance()', Number(bal), 'pending', nrPending)
            if (bal.gt(constants.Zero)) {
                release();
                return wallet;
            }
        }
        release();
    }

    async addPendingHash(adr: string, hash: string) {
        const release = await lock('addPendingHash:' + adr);
        const nrPending = this.getNrPending(adr);
        const nonce = await this.provider.getTransactionCount(adr, 'latest');
        // Log.d('Get nonce addPendingHash, latest:', nonce, 'tx pending', nrPending)
        this.pendingHashes[hash] = adr.toLowerCase();
        release();
        return nonce + nrPending;
    }

    removeHash(hash: string) {
        delete this.pendingHashes[hash];
    }

    getNrPending(adr: string) {
        return Object.keys(this.pendingHashes)
            .filter(h => this.pendingHashes[h] == adr.toLowerCase()).length;
    }
}

export default RSK;
