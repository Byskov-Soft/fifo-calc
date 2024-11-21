import { getDataBase, restoreDatabases } from '../database.ts'
import { COLLECTION } from '../model/common.ts'
import { Transaction } from '../model/transaction.ts'

export const reportTransactions = async (year: string, currency: string, symbol?: string) => {
    await restoreDatabases()
    const db = getDataBase(year)

    const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute(
        symbol
            ? [{
                name: 'symbol',
                value: symbol.toUpperCase(),
            }]
            : [],
    )

    const transactions = dbItems.map((t) => Transaction.parse(t.object()))
    const cur = currency.toUpperCase()

    console.log([
        'Date',
        'Type',
        'Symbol',
        'Cost (USD)',
        'Amount',
        'Rate (USD)',
        'Symbol Fee',
        'USD Fee',
        `Cost (${cur})`,
        `Price per item (${cur})`,
        `Fee (${cur})`,
        `Fee per item (${cur})`,
    ].join(','))

    transactions.forEach((t) => {
        console.log([
            t.date,
            t.type,
            t.symbol,
            t.usd_cost,
            t.amount,
            t.usd_rate,
            t.symbol_fee,
            t.usd_fee,
            t.cur_cost,
            t.cur_price_per_item,
            t.cur_fee,
            t.cur_fee_per_item,
        ].join(','))
    })
}
