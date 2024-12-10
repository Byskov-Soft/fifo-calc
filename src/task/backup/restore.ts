import { parse } from '@std/csv/parse'
import { z } from 'zod'
import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import type { Usage, Year } from '../../model/common.ts'
import {
  COLLECTION,
  DB_FIFO,
  ISO8601DateString,
  Transaction,
  transactionColumns,
  TransctionType,
} from '../../model/index.ts'
import {
  addDocument,
  adjustRowNumbers,
  persistDatabases,
  restoreDatabase,
} from '../../persistence/index.ts'
import { generateUUID } from '../../util/uuid.ts'

export const BACKUP_RESTORE_TYPE = 'restore'

export const usage: Usage = {
  option: `report --type ${BACKUP_RESTORE_TYPE}`,
  arguments: [
    '--input <csv-file>     : Input CSV file',
    '[--symbol <symbol>]    : Limit to a specific symbol',
    '[--year-limit <year>]  : Limit to a specific year',
  ],
}
const headerLine = transactionColumns.join(',')

export const parseCsvToJson = async (
  csvFilePath: string,
  symbol?: string,
  yearLimit?: Year,
): Promise<Transaction[]> => {
  const csvData = await Deno.readTextFile(csvFilePath)

  if (!csvData.startsWith(headerLine)) {
    console.error(`Invalid headers in CSV file. Expecting "${headerLine}"`)
    Deno.exit(1)
  }

  const jsonData = parse(csvData, { columns: transactionColumns, skipFirstRow: true })

  return jsonData
    .map((row) =>
      z.object({
        date: ISO8601DateString,
        type: TransctionType,
        symbol: z.string(),
        usd_cost: z.string().transform((v: string) => parseFloat(v)),
        item_count: z.string().transform((v: string) => parseFloat(v)),
        usd_conversion_rate: z.string().transform((v: string) => parseFloat(v)),
        symbol_fee: z.string().transform((v: string) => parseFloat(v)),
        usd_fee: z.string().transform((v: string) => parseFloat(v)),
        _id: z.string().default(''),
        exchange: z.string(),
        cur_cost: z.string().transform((v: string) => parseFloat(v)),
        cur_price_per_item: z.string().transform((v: string) => parseFloat(v)),
        cur_fee: z.string().transform((v: string) => parseFloat(v)),
        cleared: z.string().transform((v: string) => v === 'true'),
        row_num: z.string().transform((v: string) => parseInt(v)),
        remaining_item_count: z.string().transform((v: string) => parseFloat(v)),
        remaining_cost: z.string().transform((v: string) => parseFloat(v)),
      }).parse(row)
    )
    .filter((record) => (
      (yearLimit ? record.date.startsWith(yearLimit.toString()) : true) &&
      (symbol ? record.symbol === symbol : true)
    ))
}

export const addTransactions = async (
  transactions: Transaction[],
) => {
  transactions.forEach((tx) => {
    addDocument(DB_FIFO, COLLECTION.TRANSACTION, tx, generateUUID())
  })

  const persistCount = await persistDatabases()

  if (persistCount) {
    await adjustRowNumbers(DB_FIFO)
  }
}

export const restoreTransactions = async () => {
  setUsage(usage)
  const inputCsvFile = getOptValue('input')
  const symbol = getOptValue('symbol')
  const yearLimit = getOptValue('year-limit')

  if (!inputCsvFile) {
    showUsageAndExit()
  }

  await restoreDatabase(DB_FIFO, true)
  const transactions = await parseCsvToJson(inputCsvFile, symbol, yearLimit)
  await addTransactions(transactions)
  console.log(`\nRestored ${transactions.length} transactions\n`)
}
