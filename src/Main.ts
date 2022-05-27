/**
 * Main controller
 * Start fetching all spot, margin orders, matching orders, filled orders
 * Also provides the api to monitor the order book
 */

import RSK from "./RSK";
import Pairs from "./Pairs";
import Log from "./Log";
import Orders from "./Orders";
import IO from "socket.io";
import { ethers } from "ethers";
import Executor from "./Executor";
import Monitor from "./Monitor";
import MarginOrders from './MarginOrders';
import config from './config';
import Db from './Db';
import Order from "./types/Order";
import MarginOrder from "./types/MarginOrder";
import PriceFeeds from "./PriceFeeds";
import OrderStatus from "./types/OrderStatus";


const mainnet = RSK.Mainnet;
let testnet = RSK.Testnet;

if (!config.mainnet) {
    testnet = mainnet;
}

// tslint:disable-next-line:max-func-body-length

/**
 * main entry function which init the DB, PriceFeeds, Monitor controllers
 */
export const start = async (io: IO.Server) => {
    await Db.initDb(config.db);
    PriceFeeds.init(mainnet.provider);

    Promise.all([
        processSpotOrderes(),
        processMarginOrders(),
    ]).catch(e => {
        Log.e(e)
        console.trace();
    });

    Monitor.init(mainnet);
    io.on('connection', (socket) => {
        socket.on('getAddresses', async (cb) => Monitor.getAddresses(cb));
        socket.on('getNetworkData', async (cb) => Monitor.getNetworkData(cb));
        socket.on('getTotals', async (cb) => Monitor.getTotals(cb));
        socket.on('getLast24HTotals', async (cb) => Monitor.getTotals(cb, true));
        socket.on('getOrderDetail', async (...args) => Monitor.getOrderDetail.call(Monitor, ...args));
        socket.on('listOrders', async (...args) => Monitor.listOrders.call(Monitor, ...args));
        socket.on('listPairs', async (...args) => Monitor.listAllPair.call(Monitor, ...args));
        socket.on('sumVolPair', async (...args) => Monitor.sumVolPair.call(Monitor, ...args));
        socket.on('totalVolumes', async (...args) => Monitor.totalVolumes.call(Monitor, ...args));
        socket.on('reOpenFailedOrder', async (...args) => Monitor.reOpenFailedOrder.call(Monitor, ...args));
    });
};

/**
 * Load all spot orders, watch spot orders created
 * Start checking matched spot orders on every block
 * This function will start an interval every 15 seconds for loading 
 * all matched orders on db included spot, margin orders and start filling them.
 */
const processSpotOrderes = async () => {
    Log.d("fetching pairs...");
    let { tokens, pairs } = await updateTokensAndPairs(mainnet.provider);

    new Promise(async () => {
        Log.d("fetching orders...");
        const openOrders = await Orders.fetch(mainnet.provider, testnet.provider);
        Log.d("found " + openOrders.length + " new open orders");
        openOrders.forEach(order => {
            Log.d("  " + order.hash);
        });
    });

    Orders.watch(
        async hash => {
            Log.d("order created: " + hash);
            const order = await Orders.fetchOrder(hash, testnet.provider);
            await Db.addOrder(order, { status: OrderStatus.open });
        },
        hash => {
            Log.d("order cancelled: " + hash);
            Db.updateOrdersStatus([hash], OrderStatus.canceled, true);
        },
        mainnet.provider,
        testnet.provider
    );

    const executor = new Executor(mainnet.provider);
    Log.d("listening to new blocks...");
    mainnet.provider.on("block", async blockNumber => {
        // Log.d("block: " + blockNumber);
        // every 3 minutes
        if (blockNumber % 5 === 0) {
            const latest = await updateTokensAndPairs(mainnet.provider);
            tokens = latest.tokens;
            pairs = latest.pairs;
        }
        // every 1 minute
        if (blockNumber % 2 === 0) {
            try {
                await executor.matchSpotOrders(tokens, pairs, 200000);
            } catch (e) {
                Log.e("error: " + e.reason || e.message || e.toString());
                console.error(e);
            }
        }
    });
    executor.watch(async hash => {
        Log.d("order filled: " + hash);
        const order = await Db.checkOrderHash(hash) as Order;
        if (order) {
            const filledAmountIn = await executor.filledAmountIn(order.hash);
            if (filledAmountIn.eq(order.amountIn)) {
                await Db.updateOrdersStatus([hash], OrderStatus.filled, true);
            }
        }
    });

    // interval every 15 seconds for checking all fillable orders
    setInterval(async () => {
        try {
            await Promise.all([
                executor.checkFillBatchOrders(mainnet, 'spot'),
                executor.checkFillBatchOrders(mainnet, 'margin'),
            ]);
        } catch (e) {
            Log.e("error: " + e.reason || e.message || e.toString());
            console.error(e);
        }
    }, 15000);
};

/**
 * Load all spot orders, watch margin orders created
 * Start checking matched margin orders on every block
 */
const processMarginOrders = async () => {
    new Promise(async () => {
        Log.d("fetching margin orders...");
        const orders = await MarginOrders.fetch(mainnet.provider, testnet.provider);
        Log.d("found " + orders.length + " new open margin orders");
        orders.forEach(order => {
            Log.d("  " + order.hash);
        });
    });

    MarginOrders.watch(
        async hash => {
            Log.d("margin order created: " + hash);
            const order = await MarginOrders.fetchOrder(hash, mainnet.provider, testnet.provider);
            await Db.addMarginOrder(order, { status: OrderStatus.open });
        },
        hash => {
            Log.d("margin order cancelled: " + hash);
            Db.updateOrdersStatus([hash], OrderStatus.canceled, true);
        },
        mainnet.provider,
        testnet.provider
    );

    const executor = new Executor(mainnet.provider);
    Log.d("listening to new blocks...");
    mainnet.provider.on("block", async blockNumber => {
        Log.d("block: " + blockNumber);
        // every 1 minute
        if (blockNumber % 2 === 0) {
            try {
                await executor.matchMarginOrders();
            } catch (e) {
                Log.e("error: " + e.reason || e.message || e.toString());
                console.error(e);
            }
        }
    });
    executor.watchMargin(async hash => {
        Log.d("order filled: " + hash);
        const order = await Db.checkOrderHash(hash) as MarginOrder;
        if (order) {
            const filledAmountIn = await executor.filledAmountIn(order.hash);
            if (filledAmountIn.eq(order.collateralTokenSent.add(order.loanTokenSent))) {
                await Db.updateOrdersStatus([hash], OrderStatus.filled, null, false);
            }
        }
    });

    executor.watchFeeTranfered(async (hash, filler) => {
        const order = await Db.checkOrderHash(hash);
        if (order && !order.relayer) {
            await Db.updateOrderFiller(hash, filler, order.type == 'spot');
        }
    });
};

/**
 * Load all available pairs and update all local prices
 */
const updateTokensAndPairs = async (provider: ethers.providers.BaseProvider) => {
    const { tokens, pairs } = await Pairs.fetch(provider);
    Log.d("found " + tokens.length + " tokens");
    tokens.forEach(token => {
        Log.d(token.symbol + ":  " + token.address);
    });
    Log.d("found " + pairs.length + " pairs");
    // pairs.forEach(pair => {
    //     Log.d(`${pair.token0.symbol} - ${pair.token1.symbol}`);
    // });
    PriceFeeds.updatePairs(pairs);
    return { tokens, pairs };
};
