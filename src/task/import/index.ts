import { parse } from '@std/csv/parse'
import { z } from 'zod'
import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { adjustRowNumbers } from '../../misc/index.ts'
import { COLLECTION, DB_FIFO, type Usage, Year } from '../../model/common.ts'
import {
  inputColumns,
  type InputTransaction,
  type Transaction,
  TRANSACTION_TYPE,
  TransctionType,
} from '../../model/index.ts'
import { addDocument, persistDatabases, restoreDatabases } from '../../persistence/database.ts'
import { utcDateStringToISOString } from '../../util/date.ts'
import { generateUUID } from '../../util/uuid.ts'

const headerLine = inputColumns.join(',')

export const parseCsvToJson = async (
  csvFilePath: string,
  year?: Year,
): Promise<InputTransaction[]> => {
  const csvData = await Deno.readTextFile(csvFilePath)

  if (!csvData.startsWith(headerLine)) {
    console.error(`Invalid headers in CSV file. Expecting "${headerLine}"`)
    Deno.exit(1)
  }

  const jsonData = parse(csvData, { columns: inputColumns, skipFirstRow: true })

  return jsonData.map((row) => {
    return z.object({
      t_currency: z.string().transform((v: string) => v.toUpperCase()),
      tax_currency: z.string().transform((v: string) => v.toUpperCase()),
      date: z.string().transform((v: string) => utcDateStringToISOString(v)),
      type: TransctionType,
      symbol: z.string().toUpperCase(),
      tcur_cost: z.string().transform((v: string) => parseFloat(v)),
      item_count: z.string().transform((v: string) => parseFloat(v)),
      tcur_conversion_rate: z.string().transform((v: string) => parseFloat(v)),
      symbol_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
      tcur_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
    }).parse(row)
  }).filter((record) => {
    return year ? record.date.startsWith(year.toString()) : true
  })
}

export const createTransactions = async (
  exchange: string,
  inputTransactions: InputTransaction[],
) => {
  inputTransactions.forEach((tx) => {
    const taxcur_cost = tx.tcur_cost / tx.tcur_conversion_rate
    const taxcur_price_per_item = taxcur_cost / tx.item_count

    const taxcur_fee = tx.type === TRANSACTION_TYPE.B
      ? taxcur_price_per_item * tx.symbol_fee
      : 1 / tx.tcur_conversion_rate * tx.tcur_fee

    const newTrans: Transaction = {
      ...tx,
      _id: '', // will be replaced
      exchange,
      symbol: tx.symbol.toUpperCase(),
      taxcur_cost,
      taxcur_price_per_item,
      taxcur_fee,
      cleared: false,
      row_num: 0,
      remaining_item_count: tx.type === TRANSACTION_TYPE.B ? tx.item_count : -1,
      taxcur_remaining_cost: tx.type === TRANSACTION_TYPE.B ? taxcur_cost : -1,
    }

    addDocument(DB_FIFO, COLLECTION.TRANSACTION, newTrans, generateUUID())
  })

  const persistCount = await persistDatabases()

  if (persistCount) {
    await adjustRowNumbers(DB_FIFO)
    console.log(`\nImported ${inputTransactions.length} transaction(s)\n`)
  }
}

export const usage: Usage = {
  option: `import`,
  arguments: [
    '--exchange <exchange-name> : Name of the exchange transactions originate from',
    '--input <input-csv-file>   : A CSV file matching the fifo-calc input format',
    '[--year <year>]            : Limit imports to a specific year',
  ],
}

export const importTransactions = async () => {
  setUsage(usage)
  const exchange = getOptValue('exchange')
  const csvFilePath = getOptValue('input')
  const year = getOptValue('year')
  const help = getOptValue('help')

  if (help) {
    showUsageAndExit({ exitWithError: false })
  }

  if (!exchange || !csvFilePath) {
    showUsageAndExit()
  }

  if (year) {
    // This will throw an error on invalid year
    Year.parse(year)
  }

  await restoreDatabases()
  const input = await parseCsvToJson(csvFilePath, year)
  await createTransactions(exchange.toUpperCase(), input)
}
