import { addDocument, getDataBase, persistDatabases, restoreDatabases } from './database.ts'
import { COLLECTION } from './model/common.ts'
import { Transaction, TRANSACTION_TYPE, type TransactionInCurrency } from './model/transaction.ts'

export const createTransactionsByCurrency = async (year: string, currency: string) => {
    await restoreDatabases()
    const db = getDataBase(year)
    const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([])
    const transactions = dbItems.map((t) => Transaction.parse(t.object()))

    const newTransactions = transactions.map((t) => {
        const cur_cost = t.usd_cost / t.usd_rate
        const cur_price_per_item = cur_cost / t.amount

        const cur_fee = t.type === TRANSACTION_TYPE.B
            ? cur_price_per_item * t.symbol_fee
            : 1 / t.usd_rate * t.usd_fee

        const cur_fee_per_item = cur_fee / t.amount

        const newTrans: TransactionInCurrency = {
            ...t,
            cur_cost,
            cur_price_per_item,
            cur_fee,
            cur_fee_per_item,
        }

        addDocument(year, COLLECTION.TRANSACTION_IN_CURRENCY, newTrans, t.date)
        return newTrans
    })

    await persistDatabases()

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

    newTransactions.forEach((t) => {
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
