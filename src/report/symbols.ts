import { getDataBase, restoreDatabases } from '../database.ts'
import { COLLECTION } from '../model/common.ts'
import { Transaction } from '../model/transaction.ts'

export const getUniqueTransactionSymbols = async (year: string) => {
    await restoreDatabases()
    const db = getDataBase(year)
    const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([])
    const transactions = dbItems.map((t) => Transaction.parse(t.object()))
    const allSymbols = transactions.map((transaction) => transaction.symbol)
    const uniqueSymbols = Array.from(new Set(allSymbols))
    console.log(`Symbols used in ${year} transactions: ${uniqueSymbols.join(', ')}`)
}
