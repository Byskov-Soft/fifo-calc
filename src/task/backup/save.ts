import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { getTransactionBackupFilePath } from '../../config.ts'
import { COLLECTION, DB_FIFO, type Usage, Year } from '../../model/common.ts'
import { Transaction, transactionColumns } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'
import { createDirectory } from '../../util/file.ts'

export const BACKUP_SAVE_TYPE = 'save'

export const usage: Usage = {
  option: `report --type ${BACKUP_SAVE_TYPE}`,
  arguments: [
    '[--symbol <symbol>]        : Limit to a specific symbol',
    '[--year <year>]            : Limit to a specific year',
    '[--oput-dir <output-dir>]  : Output directory - defaults to ./backup',
  ],
}
export const saveTransactions = async () => {
  setUsage(usage)
  const symbol = getOptValue('symbol')
  const year = getOptValue('year')
  let outputDir = getOptValue('output-dir')
  const help = getOptValue('help')

  if (help) {
    showUsageAndExit({ exitWithError: false })
  }

  if (year) {
    // This will throw an error on invalid year
    Year.parse(year)
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
      return year ? t.date.startsWith(year) : true
    })

  const headers = transactionColumns.join(',')

  const records = transactions.map((t) => {
    return [
      t.t_currency,
      t.tax_currency,
      t.date,
      t.type,
      t.symbol,
      t.tcur_cost,
      t.item_count,
      t.tcur_conversion_rate,
      t.symbol_fee,
      t.tcur_fee,
      t.exchange,
      t.taxcur_cost,
      t.taxcur_price_per_item,
      t.taxcur_fee,
      t.cleared,
      t.row_num,
      t.remaining_item_count,
      t.taxcur_remaining_cost,
    ].join(',')
  })

  const backupFile = getTransactionBackupFilePath(outputDir, symbol ?? 'all', year)
  const outputData = [headers, ...records].join('\n')
  await Deno.writeTextFile(backupFile, outputData)
  console.log(`\nTransactions backup was written to\n${backupFile}\n`)
}
