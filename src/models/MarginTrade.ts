import { Utils } from "../Utils";
import BaseModel from "./BaseModel";

export default class MarginTrade extends BaseModel {
    constructor (db) {
        super(db, 'margin_trades', `CREATE TABLE IF NOT EXISTS margin_trades (
            id INTEGER PRIMARY KEY,
            hash text,
            pair text,
            batchId text,
            status text,
            owner text,
            relayer text,
            dateAdded datetime,
            profit text,
            txHash text,
            orderTime datetime,
            filledAdded datetime,
            detail text
            )`);
    }

    async createTable() {
        try {
            const marginTable = await super.createTable();

            console.log("Created Margin Trade table", marginTable);

            return marginTable;
        } catch (e) {
            console.log('Can not create Margin Trade table', e);
        }
    }

    insert(data: any) {
        return super.insert({
            ...data,
            dateAdded: Utils.formatDate(Date.now() / 1000)
        });
    }

}