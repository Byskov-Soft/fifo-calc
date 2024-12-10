import { getOptValue, setUsage } from '../../cmdOptions.ts'
import { getTransactionBackupFilePath } from '../../config.ts'
import { COLLECTION, DB_FIFO, type Usage, Year } from '../../model/common.ts'
import { Transaction, transactionColumns } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'
import { createDirectory } from '../../util/file.ts'

export const BACKUP_SAVE_TYPE = 'save'

export const usage: Usage = {
  option: `report --type ${BACKUP_SAVE_TYPE}`,
  arguments: [
    '[--symbol <symbol>]           : Limit to a specific symbol',
    '[--year-limit <year>]         : Limit to a specific year',
    '[--oput-dir <output-dir>]     : Output directory - defaults to ./backup',
  ],
}
export const saveTransactions = async () => {
  setUsage(usage)
  const symbol = getOptValue('symbol')
  const yearLimit = getOptValue('year-limit')
  let outputDir = getOptValue('output-dir')

  if (yearLimit) {
    // This will throw an error on invalid year
    Year.parse(yearLimit)
  }

  if (!outputDir) {
    outputDir = `${Deno.cwd()}/backup`
    await createDirectory({ dirPath: outputDir })
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

  const transactions = dbItems
    .map((t) => Transaction.parse(t.object()))
    .filter((t) => {
      return yearLimit ? t.date.startsWith(yearLimit) : true
    })

  const headers = transactionColumns.join(',')

  const records = transactions.map((t) => {
    return [
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
      t.remaining_item_count,
      t.remaining_cost,
    ].join(',')
  })

  const backupFile = getTransactionBackupFilePath(outputDir, symbol ?? 'all', yearLimit)
  const outputData = [headers, ...records].join('\n')
  await Deno.writeTextFile(backupFile, outputData)
  console.log(`\nTransactions backup was written to\n${backupFile}\n`)
}
