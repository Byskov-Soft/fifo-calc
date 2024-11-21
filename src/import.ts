import { parse } from '@std/csv/parse'
import { format, parseISO } from 'date-fns'
import { addDocument, persistDatabases } from './database.ts'
import { COLLECTION } from './model/common.ts'
import { InputTransaction, transactionColumns } from './model/transaction.ts'

const headerLine = transactionColumns.join(',')

const parseCsvToJson = async (csvFilePath: string): Promise<InputTransaction[]> => {
  const data = await Deno.readTextFile(csvFilePath)

  if (!data.startsWith(headerLine)) {
    console.error(`Invalid headers in CSV file. Expecting "${headerLine}"`)
    Deno.exit(1)
  }

  const parsed = parse(data, { columns: transactionColumns, skipFirstRow: true })
  return parsed.map((row) => InputTransaction.parse(row))
}

export const importTransactions = async (csvFilePath: string) => {
  const transactions = await parseCsvToJson(csvFilePath)

  transactions.forEach((transaction) => {
    const year = format(parseISO(transaction.date), 'yyyy')
    addDocument(year, COLLECTION.TRANSACTION, transaction, transaction.date)
  })

  await persistDatabases()
}
