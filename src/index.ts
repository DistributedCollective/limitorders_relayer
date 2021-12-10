import * as dotenv from 'dotenv';
dotenv.config({ debug: true });

import RSK from "./RSK";
import Pairs from "./Pairs";
import Log from "./Log";
import Orders from "./Orders";
import Executor from "./Executor";

import { Fetcher } from "@sushiswap/sdk";
import { ethers } from "ethers";
import MarginOrders from './MarginOrders';


const mainnet = RSK.Mainnet;
const testnet = RSK.Testnet;

// tslint:disable-next-line:max-func-body-length

const main = async () => {
    await Promise.all([
        processLimitOrderes(),
        processMarginOrders(),
    ]);
};

const processLimitOrderes = async () => {
    Log.d("fetching pairs...");
    let { tokens, pairs } = await updateTokensAndPairs(mainnet.provider);

    Log.d("fetching orders...");
    const orders = await Orders.fetch(mainnet.provider, testnet.provider);
    Log.d("found " + orders.length + " orders");
    orders.forEach(order => {
        Log.d("  " + order.hash);
    });
    Orders.watch(
        async hash => {
            Log.d("order created: " + hash);
            orders.push(await Orders.fetchOrder(hash, testnet.provider));
        },
        hash => {
            Log.d("order cancelled: " + hash);
            const index = orders.findIndex(order => order.hash === hash);
            if (index >= 0) {
                orders.splice(index, 1);
            }
        },
        mainnet.provider,
        testnet.provider
    );

    const executor = new Executor(mainnet.provider);
    Log.d("listening to new blocks...");
    mainnet.provider.on("block", async blockNumber => {
        // Log.d("block: " + blockNumber);
        // every 12 hours
        if (blockNumber % 2880 === 0) {
            const latest = await updateTokensAndPairs(mainnet.provider);
            tokens = latest.tokens;
            pairs = latest.pairs;
        }
        // every 1 minute
        if (blockNumber % 2 === 0) {
            try {
                const matched = await executor.match(tokens, pairs, orders, 10000);
                Log.d("matched " + matched.length + " orders");
                matched.forEach(order => {
                    const aux = order.trade
                        ? " at " +
                          order.trade?.executionPrice.toFixed(8) +
                          " " +
                          order.trade.route.path[order.trade.route.path.length - 1].symbol +
                          "/" +
                          order.trade.route.path[0].symbol
                        : "";
                    Log.d("  " + order.hash + aux);
                });
                await executor.fillOrders(matched, mainnet.wallet);
            } catch (e) {
                Log.e("error: " + e.reason || e.message || e.toString());
            }
        }
    });
    executor.watch(async hash => {
        Log.d("order filled: " + hash);
        const index = orders.findIndex(o => o.hash === hash);
        if (index >= 0) {
            const order = orders[index];
            const filledAmountIn = await executor.filledAmountIn(order.hash);
            if (filledAmountIn.eq(order.amountIn)) {
                orders.splice(index, 1);
            }
        }
    });
};

const processMarginOrders = async () => {
    Log.d("fetching margin orders...");
    const orders = await MarginOrders.fetch(mainnet.provider, testnet.provider);
    Log.d("found " + orders.length + " margin orders");
    orders.forEach(order => {
        Log.d("  " + order.hash);
    });
    MarginOrders.watch(
        async hash => {
            Log.d("margin order created: " + hash);
            orders.push(await MarginOrders.fetchOrder(hash, testnet.provider));
        },
        hash => {
            Log.d("margin order cancelled: " + hash);
            const index = orders.findIndex(order => order.hash === hash);
            if (index >= 0) {
                orders.splice(index, 1);
            }
        },
        mainnet.provider,
        testnet.provider
    );

    const executor = new Executor(mainnet.provider);
    Log.d("listening to new blocks...");
    mainnet.provider.on("block", async blockNumber => {
        Log.d("block: " + blockNumber);
        // every 1 minute
        if (blockNumber % 4 === 0) {
            try {
                await executor.fillMarginOrders(orders, mainnet.wallet);
            } catch (e) {
                Log.e("error: " + e.reason || e.message || e.toString());
            }
        }
    });
    executor.watchMargin(async hash => {
        Log.d("order filled: " + hash);
        const index = orders.findIndex(o => o.hash === hash);
        if (index >= 0) {
            const order = orders[index];
            const filledAmountIn = await executor.filledAmountIn(order.hash);
            if (filledAmountIn.eq(order.collateralTokenSent.add(order.loanTokenSent))) {
                orders.splice(index, 1);
            }
        }
    });
};

const updateTokensAndPairs = async (provider: ethers.providers.BaseProvider) => {
    const { tokens, pairs } = await Pairs.fetch(provider);
    Log.d("found " + tokens.length + " tokens");
    tokens.forEach(token => {
        Log.d(token.symbol + ":  " + token.address);
    });
    Log.d("found " + pairs.length + " pairs");
    pairs.forEach(pair => {
        Log.d(`${pair.token0.symbol} - ${pair.token1.symbol}`);
    });
    return { tokens, pairs };
};

main().catch(e => {
    Log.e(e);
    process.exit(1);
});
