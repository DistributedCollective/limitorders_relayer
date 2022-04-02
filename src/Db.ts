// const sqlite3 = require('sqlite3').verbose();
import * as path from "path";
import * as SQLite3 from 'sqlite3';
import Log from "./Log";

import OrderModel from "./models/OrderModel";
import MarginOrder from "./types/MarginOrder";
import Order from "./types/Order";
import Orders from "./Orders";
import MarginOrders from "./MarginOrders";
import { Utils } from "./Utils";
const sqlite3 = SQLite3.verbose();

class DbCtrl {
    db: SQLite3.Database;
    orderModel: OrderModel;

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
            this.orderModel = new OrderModel(this.db);

            await this.orderModel.createTable();
        } catch (e) {
            Log.e(e);
        }
    }

    async checkOrderHash(hash: string) {
        const model: any = await this.orderModel.findOne({ hash: hash });
        if (!model) return null;

        const json = JSON.parse(model.detail);
        json.status = model.status;
        json.type = model.type;

        return model.type == 'limit' ? 
            Orders.parseOrder(json) :
            MarginOrders.parseOrder(json);
    }

    async addOrder(order: Order, { status = 'matched'} = {}) {
        try {
            const exists = await this.orderModel.findOne({ hash: order.hash });
            if (exists) return null;

            return await this.orderModel.insert({
                hash: order.hash,
                status: status || 'matched',
                type: 'limit',
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
            const exists = await this.orderModel.findOne({ hash: order.hash });
            if (exists) return null;

            return await this.orderModel.insert({
                hash: order.hash,
                status: status || 'matched',
                type: 'margin',
                owner: order.trader,
                orderTime: Utils.formatDate(Number(order.createdTimestamp)),
                detail: JSON.stringify(order)
            });
        } catch (e) {
            Log.e(e);
        }
    }

    async updateFilledOrder(relayer: string, hash: string, txHash: string, status: string, profit: string) {
        try {
            const old: any = await this.orderModel.findOne({ hash });
            return await this.orderModel.update({ hash }, {
                relayer,
                txHash: txHash || old.txHash,
                profit,
                status,
            });
        } catch (e) {
            Log.e(e);
        }
    }

    async updateOrdersStatus(hashList: string[], status: string, batchId = null) {
        const updateObj: any = { status };
        if (batchId != null) {
            updateObj.batchId = batchId;
        }
        return await this.orderModel.update({ hash: hashList }, updateObj);
    }

    async updateOrderFiller(hash: string, filler: string) {
        return await this.orderModel.update({ hash: hash }, {
            relayer: filler
        });
    }

    async findOrders(type, { status, batchId, limit, offset, latest } = {} as any) {
        const cond: any = {
            type,
        };
        let orderBy;
        if (status) cond.status = status;
        if (batchId) cond.batchId = batchId;
        if (latest) orderBy = { orderTime: -1 };

        const list: any = await this.orderModel.find(cond, {
            offset,
            limit: limit || 100,
            orderBy
        });
        return (list || []).map(item => {
            const json = JSON.parse(item.detail);
            json.id = item.id;
            json.status = item.status;
            json.type = item.type;
            json.relayer = item.relayer;
            json.txHash = item.txHash;
            return item.type == 'limit' ? Orders.parseOrder(json) : MarginOrders.parseOrder(json);
        });
    }

    async countOrders({ type, status } = {} as any) {
        const cond: any = {};
        if (type) cond.type = type;
        if (status) cond.status = status;

        return await this.orderModel.count(cond);
    }

    async getTotals(last24H) {
        try {
            let profit = 0;
            const sqlQuery = last24H ? // select either all actions or only the last 24h ones
                `SELECT * FROM orders WHERE dateAdded BETWEEN DATETIME('now', '-1 day') AND DATETIME('now') AND status IN ('success', 'failed')` :
                `SELECT * FROM orders WHERE status IN ('success', 'failed')`;
            const allRows: any = await this.orderModel.all(sqlQuery);
            (allRows || []).forEach((row) => {
                if (row.profit) {
                    profit += Number(row.profit);
                }
            });
            return { totalActionsNumber: allRows.length, profit };
        } catch (e) {
            Log.e(e);
        }
    }
}

export default new DbCtrl();
