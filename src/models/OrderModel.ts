import { Utils } from "../Utils";
import BaseModel from "./BaseModel";

export default class OrderModel extends BaseModel {
    constructor (db) {
        super(db, 'orders', `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            hash text,
            batchId text,
            status text,
            type text,
            owner text,
            relayer text,
            dateAdded datetime,
            profit text,
            txHash text,
            orderTime datetime,
            detail text
            )`);
    }

    static Statuss = {
        open: "open",
        matched: "matched",
        success: "success",
        retrying: "retrying",
        filling: "filling",
        failed: "failed",
        failed_smallOrder: "failed_smallOrder",
        filled_by_another: "filled_by_another",
        canceled: "canceled",
    }

    async createTable() {
        try {
            const orderTable = await super.createTable();

            console.log("Created order table", orderTable);

            return orderTable;
        } catch (e) {
            console.log('Can not create order table', e);
        }
    }

    insert(data: any) {
        return super.insert({
            ...data,
            dateAdded: Utils.formatDate(Date.now() / 1000)
        });
    }

}