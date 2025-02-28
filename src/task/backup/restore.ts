import { parse } from '@std/csv/parse'
import { z } from 'zod'
import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { type Usage, Year } from '../../model/common.ts'
import {
  COLLECTION,
  DB_FIFO,
  ISO8601DateString,
  type Transaction,
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
    '--input <csv-file>   : Input CSV file',
    '[--symbol <symbol>]  : Limit to a specific symbol',
    '[--year <year>]      : Limit to a specific year',
  ],
}
const headerLine = transactionColumns.join(',')

export const parseCsvToJson = async (
  csvFilePath: string,
  symbol?: string,
  year?: Year,
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
        t_currency: z.string(),
        tax_currency: z.string(),
        date: ISO8601DateString,
        type: TransctionType,
        symbol: z.string(),
        tcur_cost: z.string().transform((v: string) => parseFloat(v)),
        item_count: z.string().transform((v: string) => parseFloat(v)),
        tcur_conversion_rate: z.string().transform((v: string) => parseFloat(v)),
        symbol_fee: z.string().transform((v: string) => parseFloat(v)),
        tcur_fee: z.string().transform((v: string) => parseFloat(v)),
        _id: z.string().default(''),
        exchange: z.string(),
        taxcur_cost: z.string().transform((v: string) => parseFloat(v)),
        taxcur_price_per_item: z.string().transform((v: string) => parseFloat(v)),
        taxcur_fee: z.string().transform((v: string) => parseFloat(v)),
        cleared: z.string().transform((v: string) => v === 'true'),
        row_num: z.string().transform((v: string) => parseInt(v)),
        remaining_item_count: z.string().transform((v: string) => parseFloat(v)),
        taxcur_remaining_cost: z.string().transform((v: string) => parseFloat(v)),
      }).parse(row)
    )
    .filter((record) => (
      (year ? record.date.startsWith(year.toString()) : true) &&
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
  const year = getOptValue('year')
  const help = getOptValue('help')

  if (help) {
    showUsageAndExit({ exitWithError: false })
  }

  if (!inputCsvFile) {
    showUsageAndExit()
  }

  if (year) {
    // This will throw an error on invalid year
    Year.parse(year)
  }

  await restoreDatabase(DB_FIFO, true)
  const transactions = await parseCsvToJson(inputCsvFile, symbol, year)
  await addTransactions(transactions)
  console.log(`\nRestored ${transactions.length} transactions\n`)
}
