import { parse } from '@std/csv/parse'
import { format, parseISO } from 'date-fns'
import { inputColumns, InputRecord } from '../model/transaction.ts'
import { createTransactions } from './persistTransactions.ts'

const headerLine = inputColumns.join(',')
type RecordsByYear = { [year: string]: InputRecord[] }

const parseCsvToJson = async (csvFilePath: string): Promise<InputRecord[]> => {
  const data = await Deno.readTextFile(csvFilePath)

  if (!data.startsWith(headerLine)) {
    console.error(`Invalid headers in CSV file. Expecting "${headerLine}"`)
    Deno.exit(1)
  }

  const parsed = parse(data, { columns: inputColumns, skipFirstRow: true })
  return parsed.map((row) => InputRecord.parse(row))
}

export const importTransactions = async (csvFilePath: string) => {
  const inputRecords = await parseCsvToJson(csvFilePath)

  const recordsByYear = inputRecords.reduce((acc: RecordsByYear, record: InputRecord) => {
    const year = format(parseISO(record.date), 'yyyy')

    if (!acc[year]) {
      acc[year] = []
    }

    acc[year].push(record)
    return acc
  }, {})

  for (const year in recordsByYear) {
    await createTransactions(year, recordsByYear[year])
  }
}
