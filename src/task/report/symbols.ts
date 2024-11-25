import { getArgValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { COLLECTION, type Usage } from '../../model/common.ts'
import { Transaction } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const SYMBOLS_REPORT_TYPE = 'symbols'

export const usage: Usage = {
  option: `report --type ${SYMBOLS_REPORT_TYPE}`,
  arguments: [
    '--year <year>',
  ],
}

export const reportSymbols = async () => {
  setUsage(usage)
  const _year = getArgValue('year')

  if (!_year) {
    showUsageAndExit()
  }

  const year = parseInt(_year)
  await restoreDatabases()
  const db = getDataBase(year.toString())
  const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([])

  const transactions = dbItems.map((t) => {
    try {
      return Transaction.parse(t.object())
    } catch (_e) {
      console.error(`Error parsing transaction: ${JSON.stringify(t.object(), null, 2)}`)
      Deno.exit(1)
    }
  })

  const allSymbols = transactions.map((transaction) => transaction.symbol)
  const uniqueSymbols = Array.from(new Set(allSymbols)).sort()
  console.log(`\nSymbols traded in ${year}:\n\n${JSON.stringify(uniqueSymbols)}\n`)
}
