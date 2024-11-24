import { parse } from '@std/csv/parse'
import { format, parseISO } from 'date-fns'
import { z } from 'zod'
import { COLLECTION } from '../../../model/common.ts'
import {
    inputColumns,
    type InputTransaction,
    type Transaction,
    TRANSACTION_TYPE,
    TransctionType,
} from '../../../model/transaction.ts'
import { addDocument, persistDatabases, restoreDatabases } from '../../../persistence/database.ts'
import { generateUUID } from '../../../util/uuid.ts'

type RecordsByYear = { [year: string]: InputTransaction[] }
const headerLine = inputColumns.join(',')

export const parseCsvToJson = async (csvFilePath: string): Promise<InputTransaction[]> => {
    const csvData = await Deno.readTextFile(csvFilePath)

    if (!csvData.startsWith(headerLine)) {
        console.error(`Invalid headers in CSV file. Expecting "${headerLine}"`)
        Deno.exit(1)
    }

    const jsonData = parse(csvData, { columns: inputColumns, skipFirstRow: true })

    return jsonData.map((row) => {
        return z.object({
            date: z.string().transform((v: string) => parseISO(v).toISOString()),
            type: TransctionType,
            symbol: z.string().toUpperCase(),
            usd_cost: z.string().transform((v: string) => parseFloat(v)),
            item_count: z.string().transform((v: string) => parseFloat(v)),
            usd_conversion_rate: z.string().transform((v: string) => parseFloat(v)),
            symbol_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
            usd_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
        }).parse(row)
    })
}

export const createTransactions = async (
    year: string,
    exchange: string,
    inputRecordsInYear: InputTransaction[],
) => {
    const records = inputRecordsInYear.sort((a, b) =>
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
    )

    records.forEach((record) => {
        const cur_cost = record.usd_cost / record.usd_conversion_rate
        const cur_price_per_item = cur_cost / record.item_count

        const cur_fee = record.type === TRANSACTION_TYPE.B
            ? cur_price_per_item * record.symbol_fee
            : 1 / record.usd_conversion_rate * record.usd_fee

        const newTrans: Transaction = {
            ...record,
            exchange,
            symbol: record.symbol.toUpperCase(),
            cur_cost,
            cur_price_per_item,
            cur_fee,
        }

        addDocument(year, COLLECTION.TRANSACTION, newTrans, generateUUID())
        return newTrans
    })

    await persistDatabases()
    console.log(`\nCreated ${records.length} transactions for ${year}\n`)
}

export const importExchangeTransactions = async (exchange: string, csvFilePath: string) => {
    await restoreDatabases()
    const input = await parseCsvToJson(csvFilePath)

    const recordsByYear = input.reduce((acc: RecordsByYear, record: InputTransaction) => {
        const year = format(parseISO(record.date), 'yyyy')

        if (!acc[year]) {
            acc[year] = []
        }

        acc[year].push(record)
        return acc
    }, {})

    for (const year in recordsByYear) {
        await createTransactions(year, exchange, recordsByYear[year])
    }
}
