import { Utils } from "../Utils";
import BaseModel from "./BaseModel";

export default class SpotTrade extends BaseModel {
    constructor (db) {
        super(db, 'spot_trades', `CREATE TABLE IF NOT EXISTS spot_trades (
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
            const spotTable = await super.createTable();

            console.log("Created Spot Trade table", spotTable);

            return spotTable;
        } catch (e) {
            console.log('Can not create Spot Trade table', e);
        }
    }

    insert(data: any) {
        return super.insert({
            ...data,
            dateAdded: Utils.formatDate(Date.now() / 1000)
        });
    }

}