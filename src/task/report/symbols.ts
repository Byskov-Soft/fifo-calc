import { COLLECTION, type Year } from '../../model/common.ts'
import { Transaction } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const reportSymbols = async (year: Year) => {
    await restoreDatabases()
    const db = getDataBase(year.toString())
    const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([])

    const transactions = dbItems.map((t) => {
        try {
            return Transaction.parse(t.object())
        } catch (_e) {
            console.error(`Error parsing transaction: ${JSON.stringify(t.object(), null, 2)}`)
            Deno.exit(1)
        }
    })

    const allSymbols = transactions.map((transaction) => transaction.symbol)
    const uniqueSymbols = Array.from(new Set(allSymbols)).sort()
    console.log(`Symbols traded in ${year}:\n\n${JSON.stringify(uniqueSymbols)}\n`)
}
