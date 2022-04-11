// const sqlite3 = require('sqlite3').verbose();
import * as path from "path";
import * as SQLite3 from 'sqlite3';
import Log from "./Log";

import SpotTrade from "./models/SpotTrade";
import MarginTrade from "./models/MarginTrade";
import MarginOrder from "./types/MarginOrder";
import Order from "./types/Order";
import Orders from "./Orders";
import MarginOrders from "./MarginOrders";
import { Utils } from "./Utils";
import config from "./config";

const sqlite3 = SQLite3.verbose();

class DbCtrl {
    db: SQLite3.Database;
    spotModel: SpotTrade;
    marginModel: MarginTrade;

    async initDb(dbName: string) {
        return new Promise(resolve => {
            const file = path.join(__dirname, '../db/' + dbName);
            this.db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    Log.e(err.message, file);
                } else {

                    Log.d('Connected to the ' + dbName + ' database.');

                    this.initRepos().catch(Log.e).finally(() => resolve(null));
                }
            });
        });
    }

    /**
     * @private
     */
    async initRepos() {
        try {
            this.spotModel = new SpotTrade(this.db);
            this.marginModel = new MarginTrade(this.db);

            await this.spotModel.createTable();
            await this.marginModel.createTable();
        } catch (e) {
            Log.e(e);
        }
    }

    getModel(isSpot) {
        return isSpot ? this.spotModel : this.marginModel;
    }

    async checkOrderHash(hash: string) {
        let isSpot = true;
        let model: any = await this.spotModel.findOne({ hash: hash });
        if (!model) {
            model = await this.marginModel.findOne({ hash: hash });
            isSpot = false;
        }
        if (!model) return null;

        const json = JSON.parse(model.detail);
        json.status = model.status;
        json.type = isSpot ? 'spot' : 'margin';

        return isSpot ? 
            Orders.parseOrder(json) :
            MarginOrders.parseOrder(json);
    }

    async addOrder(order: Order, { status = 'matched'} = {}) {
        try {
            const exists = await this.spotModel.findOne({ hash: order.hash });
            if (exists) return null;

            const pairTokens = Orders.getPair(order.fromToken, order.toToken);
            const pair = pairTokens[0].name + '/' + pairTokens[1].name;
            return await this.spotModel.insert({
                hash: order.hash,
                pair: pair,
                status: status || 'matched',
                owner: order.maker,
                orderTime: Utils.formatDate(Number(order.created)),
                detail: JSON.stringify({ ...order, trade: undefined })
            });
        } catch (e) {
            Log.e(e);
        }
    }

    async addMarginOrder(order: MarginOrder, { status = 'matched' } = {}) {
        try {
            const exists = await this.marginModel.findOne({ hash: order.hash });
            if (exists) return null;

            const pairTokens = Orders.getPair(order.loanAssetAdr, order.collateralTokenAddress);
            const pair = pairTokens[0].name + '/' + pairTokens[1].name;

            return await this.marginModel.insert({
                hash: order.hash,
                pair: pair,
                status: status || 'matched',
                owner: order.trader,
                orderTime: Utils.formatDate(Number(order.createdTimestamp)),
                detail: JSON.stringify(order)
            });
        } catch (e) {
            Log.e(e);
        }
    }

    async updateFilledOrder(relayer: string, hash: string, txHash: string, status: string, profit: string, isSpot = true) {
        try {
            const old: any = await this.getModel(isSpot).findOne({ hash });
            return await this.getModel(isSpot).update({ hash }, {
                relayer,
                txHash: txHash || old.txHash,
                profit,
                status,
                filledAdded: Utils.formatDate(Date.now() / 1000)
            });
        } catch (e) {
            Log.e(e);
        }
    }

    async updateOrdersStatus(hashList: string[], status: string, batchId = null, isSpot = true) {
        const updateObj: any = { status };
        if (batchId != null) {
            updateObj.batchId = batchId;
        }
        return await this.getModel(isSpot).update({ hash: hashList }, updateObj);
    }

    async updateOrderFiller(hash: string, filler: string, isSpot = true) {
        return await this.getModel(isSpot).update({ hash: hash }, {
            relayer: filler,
            filledAdded: Utils.formatDate(Date.now() / 1000)
        });
    }

    async findOrders(type, { status, batchId, limit, offset, latest, pair } = {} as any) {
        const cond: any = {};
        const isSpot = type === 'spot';
        let orderBy;
        if (status) cond.status = status;
        if (batchId) cond.batchId = batchId;
        if (pair) cond.pair = pair;
        if (latest) orderBy = { orderTime: -1 };

        const list: any = await this.getModel(isSpot).find(cond, {
            offset,
            limit: limit || 100,
            orderBy
        });
        return (list || []).map(item => {
            const json = JSON.parse(item.detail);
            json.id = item.id;
            json.status = item.status;
            json.type = type;
            json.relayer = item.relayer;
            json.txHash = item.txHash;
            json.pair = item.pair;
            return type == 'spot' ? Orders.parseOrder(json) : MarginOrders.parseOrder(json);
        });
    }

    async countOrders({ type, status, pair } = {} as any) {
        const cond: any = {};
        if (status) cond.status = status;
        if (pair) cond.pair = pair;

        return await this.getModel(type == 'spot').count(cond);
    }

    async getTotals(last24H) {
        try {
            const adrQuery = 'LOWER(relayer) IN (' + config.accounts.map(acc => `'${acc.address.toLowerCase()}'`).join(',') + ')';
            let profit = 0;
            const sqlQuery = last24H ? // select either all actions or only the last 24h ones
                `SELECT * FROM spot_trades WHERE filledAdded BETWEEN DATETIME('now', '-1 day') 
                    AND DATETIME('now') 
                    AND status IN ('filled', 'success', 'failed')
                    AND ${adrQuery}` :
                `SELECT * FROM spot_trades WHERE status IN ('filled', 'success', 'failed') AND ${adrQuery}`;
            const spotRows: any = await this.spotModel.all(sqlQuery);
            const marginRows: any = await this.marginModel.all(sqlQuery.replace('spot_trades', 'margin_trades'));
            const allRows = (spotRows || []).concat(marginRows || [])

            allRows.forEach((row) => {
                if (row.profit) {
                    profit += Number(row.profit);
                }
            });
            return { totalActionsNumber: allRows.length, profit };
        } catch (e) {
            Log.e(e);
        }
    }

    async listAllPairs(isSpot = true) {
        const tbModel = this.getModel(isSpot);
        const sqlQuery = `SELECT pair from ${tbModel.table} GROUP BY pair`;
        const pairs: any = await tbModel.all(sqlQuery);
        return (pairs || []).map(p => p.pair);
    }
}

export default new DbCtrl();
