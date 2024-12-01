// Converts from Pionex trading.csv to fifo-calc's format
import { parse } from '@std/csv/parse'
import { parseISO } from 'date-fns'
import { z } from 'zod'
import { inputColumns, type InputTransaction, TRANSACTION_TYPE } from '../../model/transaction.ts'
import { getUsdRate, loadRateTable } from '../../persistence/rateTable.ts'
import { utcDateStringToISOString } from '../../util/date.ts'

const pionexTradingInputColumns = [
  'filled_local_time',
  'spot_pair',
  'order_type',
  'direction',
  'filled_value',
  'filled_price',
  'filled_quantity',
  'fees',
  'transaction_id',
  'order_no',
  'timestamp_utc',
]

const PionexTradingInputRecord = z.object({
  filled_local_time: z.string().transform((v: string) => utcDateStringToISOString(v)),
  spot_pair: z.string(),
  order_type: z.string(),
  direction: z.enum(['Buy', 'Sell']),
  filled_value: z.string().transform((v: string) => parseFloat(v)),
  filled_price: z.string().transform((v: string) => parseFloat(v)),
  filled_quantity: z.string().transform((v: string) => parseFloat(v)),
  fees: z.string().transform((v: string) => parseFloat(v)),
  transaction_id: z.string(),
  order_no: z.string(),
  timestamp_utc: z.string().transform((v: string) => utcDateStringToISOString(v)),
})

type PionexInputRecord = z.TypeOf<typeof PionexTradingInputRecord>

const parseCsvToInputRecord = async (
  csvFilePath: string,
): Promise<PionexInputRecord[]> => {
  const dataTxt = await Deno.readTextFile(csvFilePath)
  const dataJSON = parse(dataTxt, { columns: pionexTradingInputColumns, skipFirstRow: true })
  return dataJSON.map((row) => PionexTradingInputRecord.parse(row))
}

const convertToInputRecord = async (
  currency: string,
  inputRecords: PionexInputRecord[],
): Promise<InputTransaction[]> => {
  const years = new Set(
    inputRecords.map((record) => parseISO(record.filled_local_time).getFullYear()),
  )

  await Promise.all(
    Array.from(years).map((year) => loadRateTable(currency, year)),
  )
  return inputRecords.map((record) => {
    const date = record.filled_local_time
    const type = record.direction === 'Buy' ? TRANSACTION_TYPE.B : TRANSACTION_TYPE.S
    const symbol = record.spot_pair.split('/')[0]
    const usd_cost = record.filled_value
    const item_count = record.filled_quantity
    const usd_conversion_rate = getUsdRate(currency, record.filled_local_time)
    const symbol_fee = type === TRANSACTION_TYPE.B ? record.fees : 0
    const usd_fee = type === TRANSACTION_TYPE.S ? record.fees : 0

    return {
      date,
      type,
      symbol,
      usd_cost,
      item_count,
      usd_conversion_rate,
      symbol_fee,
      usd_fee,
    }
  })
}

export const convertBybitSpotPreUnifiedCsv = async (
  currency: string,
  inputFilePath: string,
  outputFilePath: string,
) => {
  const inputRecords = await parseCsvToInputRecord(inputFilePath)
  const outputRecords = await convertToInputRecord(currency, inputRecords)

  const sorted = outputRecords.sort((a, b) =>
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  )

  const outputData = [
    inputColumns.join(','),
    ...sorted.map((record) => Object.values(record).join(',')),
  ].join('\n')

  await Deno.writeTextFile(outputFilePath, outputData)
}
