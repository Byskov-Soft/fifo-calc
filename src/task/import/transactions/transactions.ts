import { parse } from '@std/csv/parse'
import { z } from 'zod'
import { adjustRowNumbers } from '../../../misc/index.ts'
import { COLLECTION, DB_FIFO, type Year } from '../../../model/common.ts'
import {
  inputColumns,
  type InputTransaction,
  type Transaction,
  TRANSACTION_TYPE,
  TransctionType,
} from '../../../model/index.ts'
import { addDocument, persistDatabases, restoreDatabases } from '../../../persistence/database.ts'
import { utcDateStringToISOString } from '../../../util/date.ts'
import { generateUUID } from '../../../util/uuid.ts'

const headerLine = inputColumns.join(',')

export const parseCsvToJson = async (
  csvFilePath: string,
  yearLimit?: Year,
): Promise<InputTransaction[]> => {
  const csvData = await Deno.readTextFile(csvFilePath)

  if (!csvData.startsWith(headerLine)) {
    console.error(`Invalid headers in CSV file. Expecting "${headerLine}"`)
    Deno.exit(1)
  }

  const jsonData = parse(csvData, { columns: inputColumns, skipFirstRow: true })

  return jsonData.map((row) => {
    return z.object({
      date: z.string().transform((v: string) => utcDateStringToISOString(v)),
      type: TransctionType,
      symbol: z.string().toUpperCase(),
      usd_cost: z.string().transform((v: string) => parseFloat(v)),
      item_count: z.string().transform((v: string) => parseFloat(v)),
      usd_conversion_rate: z.string().transform((v: string) => parseFloat(v)),
      symbol_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
      usd_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
    }).parse(row)
  }).filter((record) => {
    return yearLimit ? record.date.startsWith(yearLimit.toString()) : true
  })
}

export const createTransactions = async (
  exchange: string,
  inputTransactions: InputTransaction[],
) => {
  inputTransactions.forEach((tx) => {
    const cur_cost = tx.usd_cost / tx.usd_conversion_rate
    const cur_price_per_item = cur_cost / tx.item_count

    const cur_fee = tx.type === TRANSACTION_TYPE.B
      ? cur_price_per_item * tx.symbol_fee
      : 1 / tx.usd_conversion_rate * tx.usd_fee

    const newTrans: Transaction = {
      ...tx,
      _id: '', // will be replaced
      exchange,
      symbol: tx.symbol.toUpperCase(),
      cur_cost,
      cur_price_per_item,
      cur_fee,
      cleared: false,
      row_num: 0,
      remaining_item_count: tx.type === TRANSACTION_TYPE.B ? tx.item_count : -1,
      remaining_cost: tx.type === TRANSACTION_TYPE.B ? cur_cost : -1,
    }

    addDocument(DB_FIFO, COLLECTION.TRANSACTION, newTrans, generateUUID())
    return newTrans
  })

  const persistCount = await persistDatabases()

  if (persistCount) {
    await adjustRowNumbers(DB_FIFO)
  }
}

export const importExchangeTransactions = async (
  exchange: string,
  csvFilePath: string,
  yearLimit?: Year,
) => {
  await restoreDatabases()
  const input = await parseCsvToJson(csvFilePath, yearLimit)
  await createTransactions(exchange, input)
}
