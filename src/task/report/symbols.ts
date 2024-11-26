import { getArgValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { COLLECTION, DB_FIFO, type Usage } from '../../model/common.ts'
import { Transaction } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const SYMBOLS_REPORT_TYPE = 'symbols'

export const usage: Usage = {
  option: `report --type ${SYMBOLS_REPORT_TYPE}`,
  arguments: [
    '--year <year> : Year for which the symbols are being reported',
    '[--as-json]   : Output as JSON',
  ],
}

export const reportSymbols = async () => {
  setUsage(usage)
  const year = getArgValue('year')
  const asJson = getArgValue('as-json')

  if (!year) {
    showUsageAndExit()
  }

  await restoreDatabases()
  const db = getDataBase(DB_FIFO)
  const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([])

  const transactions = dbItems.map((t) => {
    try {
      return Transaction.parse(t.object())
    } catch (_e) {
      console.log(_e)
      console.error(`Error parsing transaction: ${JSON.stringify(t.object(), null, 2)}`)
      console.log(t.object())
      Deno.exit(1)
    }
  }).filter((t) => {
    return t.date.startsWith(year.toString())
  })

  const allSymbols = transactions.map((transaction) => transaction.symbol)
  const uniqueSymbols = Array.from(new Set(allSymbols)).sort()

  if (!uniqueSymbols.length && !asJson) {
    uniqueSymbols.push('No symbols traded in the year')
  }

  const output = asJson ? JSON.stringify(uniqueSymbols) : uniqueSymbols.join(' ')
  console.log(`\nSymbols traded in ${year}:\n\n${output}\n`)
}
