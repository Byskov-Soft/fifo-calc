import { parseISO } from 'date-fns'
import { addDocument, persistDatabases } from '../database.ts'
import { COLLECTION } from '../model/common.ts'
import { type InputRecord, type Transaction, TRANSACTION_TYPE } from '../model/transaction.ts'

export const createTransactions = async (
    year: string,
    inputRecordsInYear: InputRecord[],
) => {
    const records = inputRecordsInYear.sort((a, b) =>
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
    )

    records.forEach((t) => {
        const cur_cost = t.usd_cost / t.usd_rate
        const cur_price_per_item = cur_cost / t.amount

        const cur_fee = t.type === TRANSACTION_TYPE.B
            ? cur_price_per_item * t.symbol_fee
            : 1 / t.usd_rate * t.usd_fee

        const cur_fee_per_item = cur_fee / t.amount

        const newTrans: Transaction = {
            ...t,
            symbol: t.symbol.toUpperCase(),
            cur_cost,
            cur_price_per_item,
            cur_fee,
            cur_fee_per_item,
        }

        addDocument(year, COLLECTION.TRANSACTION, newTrans, t.date)
        return newTrans
    })

    await persistDatabases()
    console.log('Transactions created successfully')
}
