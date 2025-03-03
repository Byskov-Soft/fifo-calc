import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { COLLECTION, DB_FIFO, type Usage, Year } from '../../model/common.ts'
import { Transaction } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const SYMBOLS_REPORT_TYPE = 'symbols'

export const usage: Usage = {
  option: `report --type ${SYMBOLS_REPORT_TYPE}`,
  arguments: [
    '[--year <year>] : Year for which the symbols are being reported',
    '[--as-json]     : Output as JSON',
  ],
}

export const reportSymbols = async () => {
  setUsage(usage)
  const year = getOptValue('year')
  const asJson = getOptValue('as-json')
  const help = getOptValue('help')

  if (help) {
    showUsageAndExit({ exitWithError: false })
  }

  if (year) {
    // This will throw an error on invalid year
    Year.parse(year)
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
    return year ? t.date.startsWith(year.toString()) : true
  })

  const allSymbols = transactions.map((transaction) => transaction.symbol)
  const uniqueSymbols = Array.from(new Set(allSymbols)).sort()
  const inYear = year ? ` in ${year}` : ''

  if (!uniqueSymbols.length && !asJson) {
    return console.log(`\nNo symbols traded${inYear}\n`)
  }

  const output = asJson ? JSON.stringify(uniqueSymbols) : uniqueSymbols.join(' ')
  console.log(`\nSymbols traded${inYear}:\n\n${output}\n`)
}
