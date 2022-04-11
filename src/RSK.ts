import { constants, ethers, PopulatedTransaction } from "ethers";
import AsyncLock from 'async-lock';
import config, { RelayerAccount } from "./config";
import testnet from "./config/testnet";
import Log from "./Log";
import { Utils } from "./Utils";

const lock = new AsyncLock();
const acquireLock = async (key: string): Promise<() => void> => {
    return new Promise(resolve => {
        lock.acquire(key, (release) => {
            resolve(release);
        });
    });
};

class RSK {
    provider: ethers.providers.JsonRpcProvider;
    accounts: RelayerAccount[];
    pendingTxs = {};
    lastNonces = {};
    pendingHashes = {};

    static Mainnet = new RSK(config.rpcNode, config.accounts);
    static Testnet = new RSK(testnet.rpcNode, config.accounts);

    private constructor(nodeUrl: string, accounts: RelayerAccount[]) {
        this.provider = new ethers.providers.JsonRpcProvider(nodeUrl);
        this.accounts = accounts;
    }

    async getWallet(timeout = 60000): Promise<ethers.Wallet> {
        const stopAt = Date.now() + timeout;
        const release = await acquireLock('getWallet');
        try {
            while (Date.now() < stopAt) {
                for (const acc of this.accounts) {
                    this.pendingTxs[acc.address] = this.pendingTxs[acc.address] || 0;
        
                    const wallet = new ethers.Wallet(acc.pKey, this.provider);
                    const bal = await wallet.getBalance();
                    acc.address = wallet.address;
                    if (this.pendingTxs[wallet.address] < 4 && bal.gt(constants.Zero)) {
                        this.pendingTxs[wallet.address] ++;
                        release();
                        return wallet;
                    }
                }
                Utils.wasteTime(0.5);
            }
        } catch (e) {
            Log.e(e);
        } finally {
            release();
        }
    }

    decreasePending(walletAddress) {
        for (const acc of this.accounts) {
            if (acc.address.toLowerCase() === walletAddress.toLowerCase()) {
                this.pendingTxs[acc.address]--;
                return true;
            }
        }

        console.error("could not decrease the pending tx count for non-existing wallet address: " + walletAddress);
        return false;
    }

    async sendTx(txData: PopulatedTransaction) {
        const release = await acquireLock('sendTx');
        let nonce: number;
        let relayer: ethers.Wallet;

        try {
            relayer = await this.getWallet(5 * 60 * 1000);
            if (!relayer) {
                console.log("No wallet has enough fund or available");
                release();
                return;
            }

            nonce = this.lastNonces[relayer.address] = await this.getNonce(relayer);
            const gasPrice = await Utils.getGasPrice(relayer);
            const tx = await relayer.sendTransaction({
                ...txData,
                gasPrice: gasPrice,
                nonce
            });

            if (tx) {
                console.log('sending tx %s, nonce %s', tx.hash, nonce);
                new Promise(async (resolve) => {
                    try {
                        await this.provider.waitForTransaction(tx.hash, 1);
                        console.log('tx %s, nonce %s confirmed', tx.hash, nonce);
                        resolve(null);
                    } catch (e) {
                        console.log('tx failed %s, nonce %s', tx.hash, nonce);
                        console.error(e);
                    } finally {
                        this.decreasePending(relayer.address);
                    }
                });
            }
            
            return {
                tx,
                signer: relayer
            }
        } catch (err) {
            if (nonce != null && relayer) {
                this.decreasePending(relayer.address);
            }
            Log.e(err);
        } finally {
            release();
        }
    }

    /**
     * The Rsk node does not return a valid response occasionally for a short period of time
     * Thats why the request is repeated 5 times and in case it still fails the last nonce +1 is returned
     */
    async getNonce(wallet: ethers.Wallet) {
        const lastNonce: number = this.lastNonces[wallet.address];
        for (let cnt = 0; cnt < 5; cnt++) {
            try {
                const nonce = await wallet.getTransactionCount('pending');
                if (lastNonce != null && nonce !== lastNonce + 1) {
                    console.log("nonce %d not expected %d", nonce, lastNonce + 1);
                    if (cnt === 4) {
                        console.log("giving up and returning it anyway")
                        return nonce;
                    }

                    await Utils.wasteTime(0.5 ** 2 ** cnt);
                }
                else {
                    return nonce;
                }
            } catch (e) {
                console.error("Error retrieving transaction count");
                console.error(e);
            }
        }

        const finalNonce = lastNonce + 1 || 0;
        console.error("Returning guessed nonce %d", finalNonce);
        return finalNonce;
    }
}

export default RSK;
