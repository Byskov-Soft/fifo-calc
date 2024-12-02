import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { COLLECTION, DB_FIFO, type Usage } from '../../model/common.ts'
import { Transaction } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const TRANSACTIONS_REPORT_TYPE = 'transactions'

export const usage: Usage = {
  option: `report --type ${TRANSACTIONS_REPORT_TYPE}`,
  arguments: [
    '--currency <taxable-currency> : Some columns show values in this currency (converted from USD)',
    '--output <output-csv-file>    : Output CSV file path',
    '[--symbol <symbol>]           : Limit to a specific symbol',
    '[--year-limit <year>]         : Limit to a specific year',
  ],
}

export const reportTransactions = async () => {
  setUsage(usage)
  const currency = getOptValue('currency')
  const yearLimit = getOptValue('year-limit')
  const outputFilePath = getOptValue('output')
  const symbol = getOptValue('symbol')

  if (!currency || !outputFilePath) {
    showUsageAndExit()
  }

  await restoreDatabases()
  const db = getDataBase(DB_FIFO)

  const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute(
    symbol
      ? [{
        name: 'symbol',
        value: symbol.toUpperCase(),
      }]
      : [],
  )

  const transactions = dbItems.map((t) => Transaction.parse(t.object())).filter((t) => {
    return yearLimit ? t.date.startsWith(yearLimit.toString()) : true
  })

  const cur = currency.toUpperCase()

  const headers = [
    'Date',
    'Exchange',
    'Type',
    'Symbol',
    'Cost (USD)',
    'Number of items',
    'Rate (USD)',
    'Symbol Fee',
    'USD Fee',
    `Cost (${cur})`,
    `Price per item (${cur})`,
    `Fee (${cur})`,
    'Cleared',
    'Row Number',
  ].join(',')

  const records = transactions.map((t) =>
    [
      t.date,
      t.exchange,
      t.type,
      t.symbol,
      t.usd_cost,
      t.item_count,
      t.usd_conversion_rate,
      t.symbol_fee,
      t.usd_fee,
      t.cur_cost,
      t.cur_price_per_item,
      t.cur_fee,
      t.cleared,
      t.row_num,
    ].join(',')
  )

  const outputData = [headers, ...records].join('\n')
  await Deno.writeTextFile(outputFilePath, outputData)
}
