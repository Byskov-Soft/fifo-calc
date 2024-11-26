// Converts from Pionex trading.csv to fifo-calc's format
import { parse } from '@std/csv/parse'
import { parseISO } from 'date-fns'
import { z } from 'zod'
import { inputColumns, type InputTransaction, TRANSACTION_TYPE } from '../../model/transaction.ts'
import { getUsdRate, loadRateTable } from '../../persistence/rateTable.ts'
import { utcDateStringToISOString } from '../../util/date.ts'

const pionexTradingInputColumns = [
  'date',
  'amount',
  'price',
  'order_type',
  'side',
  'symbol',
  'state',
  'fee',
  'strategy_type',
]

const PionexTradingInputRecord = z.object({
  date: z.string().transform((v: string) => utcDateStringToISOString(v)),
  amount: z.string().transform((v: string) => parseFloat(v)),
  price: z.string().transform((v: string) => parseFloat(v)),
  side: z.enum(['BUY', 'SELL']),
  symbol: z.string().transform((v: string) => v.split('_')[0]),
  fee: z.string().transform((v: string) => parseFloat(v)),
})

type PionexInputRecord = z.TypeOf<typeof PionexTradingInputRecord>

const parseCsvToInputRecord = async (
  csvFilePath: string,
  outputFilePath: string,
): Promise<PionexInputRecord[]> => {
  const dataTxt = await Deno.readTextFile(csvFilePath)
  const dataJSON = parse(dataTxt, { columns: pionexTradingInputColumns, skipFirstRow: true })
  const invalids: Record<string, unknown>[] = []

  const parsed = dataJSON.map((row) => {
    const record = PionexTradingInputRecord.parse(row)

    if (record.price === 0 || record.amount === 0) {
      invalids.push(row)
      return null
    }

    return record
  }).filter((record) => record !== null)

  if (invalids.length) {
    const filePath = `${outputFilePath}.invalid.csv`
    await Deno.writeTextFile(
      filePath,
      [
        pionexTradingInputColumns.join(','),
        ...invalids.map((row) => Object.values(row).join(',')),
      ].join('\n'),
    )

    console.error(
      `\nWrote ${invalids.length} zero price/amount records to ${filePath}\n`,
      '\nNote:\n',
      'These records may not be strictly invalid as they could\n',
      'be deposits, withdrawals or internal Pionex transfers.\n',
    )
  }

  return parsed
}

const convertToInputRecord = async (
  currency: string,
  inputRecords: PionexInputRecord[],
): Promise<InputTransaction[]> => {
  const years = new Set(inputRecords.map((record) => parseISO(record.date).getFullYear()))

  await Promise.all(
    Array.from(years).map((year) => loadRateTable(currency, year)),
  )

  /** Pionex data:
   *  - amount = the cost of the trade
   *  - price = the price of the asset
   *
   *  In fifo-calc we interpret amount to be the number of assets bought/sold
   *  We can calculate the amount of assets bought/sold by dividing the amount by the price
   */

  return inputRecords.map((record) => {
    const date = record.date
    const type = record.side === 'BUY' ? TRANSACTION_TYPE.B : TRANSACTION_TYPE.S
    const symbol = record.symbol
    const usd_cost = record.amount // Read comment above
    const item_count = record.amount / record.price
    const usd_conversion_rate = getUsdRate(currency, record.date)
    const symbol_fee = type === TRANSACTION_TYPE.B ? record.fee : 0
    const usd_fee = type === TRANSACTION_TYPE.S ? record.fee : 0

    return {
      date,
      type,
      symbol,
      usd_cost,
      item_count,
      usd_conversion_rate,
      symbol_fee,
      usd_fee,
      cleared: false,
      row_num: 0,
    }
  })
}

export const convertPionexTradingCsv = async (
  currency: string,
  inputFilePath: string,
  outputFilePath: string,
) => {
  const inputRecords = await parseCsvToInputRecord(inputFilePath, outputFilePath)
  const outputRecords = await convertToInputRecord(currency, inputRecords)

  const outputData = [
    inputColumns.join(','),
    ...outputRecords.map((record) => Object.values(record).join(',')),
  ].join('\n')

  await Deno.writeTextFile(outputFilePath, outputData)
}
