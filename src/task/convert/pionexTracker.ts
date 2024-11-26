// Converts from Pionex trading.csv to fifo-calc's format
import { parse } from '@std/csv/parse'
import { parseISO } from 'date-fns'
import { all, identity } from 'rambda'
import { z } from 'zod'
import { inputColumns, type InputTransaction, TRANSACTION_TYPE } from '../../model/transaction.ts'
import { getUsdRate, loadRateTable } from '../../persistence/rateTable.ts'
import { utcDateStringToISOString } from '../../util/date.ts'

const pionexTrackerInputColumns = [
  'date',
  'received_quantity',
  'received_currency',
  'sent_quantity',
  'sent_currency',
  'fee_amount',
  'fee_currency',
  'tag',
]

const PionexTrackerInputRecord = z.object({
  date: z.string().transform((v: string) => utcDateStringToISOString(v)),
  received_quantity: z.string().transform((v: string) => parseFloat(v)),
  received_currency: z.string(),
  sent_quantity: z.string().transform((v: string) => parseFloat(v)),
  sent_currency: z.string(),
  fee_amount: z.string().transform((v: string) => parseFloat(v)),
  fee_currency: z.string(),
  tag: z.string(),
})

type PionexInputRecord = z.TypeOf<typeof PionexTrackerInputRecord>

const parseCsvToInputRecord = async (
  csvFilePath: string,
  outputFilePath: string,
): Promise<PionexInputRecord[]> => {
  const dataTxt = await Deno.readTextFile(csvFilePath)
  const dataJSON = parse(dataTxt, { columns: pionexTrackerInputColumns, skipFirstRow: true })
  const invalids: Record<string, unknown>[] = []

  const parsed = dataJSON.map((row) => {
    const record = PionexTrackerInputRecord.parse(row)

    const conditions = [
      !isNaN(record.received_quantity),
      !isNaN(record.sent_quantity),
      !isNaN(record.fee_amount),
      record.received_quantity > 0,
      record.sent_quantity > 0,
    ]

    if (!all(identity, conditions)) {
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
        pionexTrackerInputColumns.join(','),
        ...invalids.map((row) => Object.values(row).join(',')),
      ].join('\n'),
    )

    console.error(
      `\nWrote ${invalids.length} zero quantity (received or sent) records to ${filePath}\n`,
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

  return inputRecords.map((record) => {
    const date = record.date
    const type = record.received_currency !== 'USDT' ? TRANSACTION_TYPE.B : TRANSACTION_TYPE.S
    const symbol = type === TRANSACTION_TYPE.B ? record.received_currency : record.sent_currency
    const item_count = type === TRANSACTION_TYPE.B ? record.received_quantity : record.sent_quantity
    const usd_cost = type === TRANSACTION_TYPE.B ? record.sent_quantity : record.received_quantity
    const usd_conversion_rate = getUsdRate(currency, record.date)

    return {
      date,
      type,
      symbol,
      usd_cost,
      item_count,
      usd_conversion_rate,
      symbol_fee: 0,
      usd_fee: record.fee_amount,
      cleared: false,
      row_num: 0,
    }
  })
}

export const convertPionexTrackerCsv = async (
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
