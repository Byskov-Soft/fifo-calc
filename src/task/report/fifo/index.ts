import { getOptValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import { COLLECTION, DB_FIFO, type Usage } from '../../../model/common.ts'
import {
  Transaction,
  TRANSACTION_TYPE,
  type TransactionProfitFifo,
} from '../../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../../persistence/database.ts'
import { createDirectory, getFileId } from '../../../util/file.ts'
import { FifoQueue } from './FifoQueue.ts'
import { createRecordsFromSale } from './createRecordsOfSale.ts'
import { persistProcessed } from './persistProcessed.ts'
import { reportprofitAndLossAsFifo } from './reportFifo.ts'
import { reportMismatches } from './reportMismatch.ts'
export const FIFO_REPORT_TYPE = 'fifo'

interface FifoReportResult {
  // Whether the report was successful or not
  success: boolean
  // Used for the CSV FIFO report
  fifoRecords: TransactionProfitFifo[]
  // Used for the mismatch info report
  mismatches: Transaction[]
  // Buy transactions that were updated and need to be persisted
}

const processTransactions = async (
  transactions: Transaction[],
): Promise<FifoReportResult> => {
  const sortedTransactions = transactions.sort((a, b) => a.row_num - b.row_num)
  const fifoQueue = new FifoQueue()
  const fifoRecords: TransactionProfitFifo[] = []
  const mismatches: Transaction[] = []

  sortedTransactions.forEach((tx) => {
    if (tx.type === TRANSACTION_TYPE.B) {
      if (tx.remaining_item_count > 0) {
        fifoQueue.addBuyTransaction(tx)
      }
    } else if (tx.type === TRANSACTION_TYPE.S) {
      const { success, fifoRecords: fifoList, mismatches: mismatchList } = createRecordsFromSale(
        tx,
        fifoQueue,
      )

      if (!success) {
        mismatches.push(...mismatchList)
      } else {
        fifoRecords.push(...fifoList)
      }
    }
  })

  const buyUpdates = fifoQueue.getUpdatedBuyTransactions()
  const sellUpdates = fifoQueue.getClearedSellTransactions()
  await persistProcessed([...buyUpdates, ...sellUpdates])

  if (buyUpdates.length === 0) {
    console.log('\nFIFO report was not created as no sell records were found for the symbol\n')
    return { success: false, fifoRecords, mismatches }
  }

  console.log(
    `\nUpdated ${buyUpdates.length} buy record(s) and ${sellUpdates.length} sell record(s)`,
  )

  return { success: true, fifoRecords, mismatches }
}

export const usage: Usage = {
  option: `report --type ${FIFO_REPORT_TYPE}`,
  arguments: [
    '--symbol <symbol>             : The symbol to report on',
    '[--exchange <exchange>]       : The exchange to report on',
    '[--output-dir <output-dir>]   : Output directory - defaults to the ./report',
  ],
}

export const reportFifo = async () => {
  // Resolve task arguments
  setUsage(usage)
  const symbolVal = getOptValue('symbol')
  const exchangeVal = getOptValue('exchange')
  let outputDir = getOptValue('output-dir')
  const help = getOptValue('help')
  const symbol = symbolVal ? symbolVal.toUpperCase() : undefined
  const exchange = exchangeVal ? exchangeVal.toUpperCase() : undefined

  if (help) {
    showUsageAndExit({ exitWithError: false })
  }

  if (!symbol) {
    showUsageAndExit()
  }

  if (!outputDir) {
    outputDir = `${Deno.cwd()}/report`
    await createDirectory({ dirPath: outputDir })
  }

  // Restore the database and get the transactions
  await restoreDatabases()
  const db = getDataBase(DB_FIFO)

  const query = [
    { name: 'symbol', value: symbol },
    { name: 'cleared', 'value': false },
  ]

  if (exchange) {
    query.push({ name: 'exchange', value: exchange })
  }

  const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute(query)

  if (dbItems.length === 0) {
    console.log(
      `\nNo transactions found for symbol '${symbol}'${
        exchange ? ` and exchange '${exchange}'` : ''
      }\n`,
    )

    Deno.exit(0)
  }

  // Parse transactions and check for currency mismatch
  let currency = ''

  const transactions = dbItems.map((item) => {
    const transaction = Transaction.parse(item.object())

    if (transaction.tax_currency !== currency) {
      if (currency === '') {
        currency = transaction.tax_currency
      } else {
        console.error('\nAll transactions must have the same currency\n')
        Deno.exit(1)
      }
    }

    return transaction
  })

  // Process the transactions
  const { fifoRecords, mismatches } = await processTransactions(
    transactions,
  )

  const fileId = getFileId()

  // Report on sell mismatches
  if (mismatches.length > 0) {
    await reportMismatches(mismatches, symbol, fileId, outputDir)
  }

  // Report the profit and loss
  if (fifoRecords.length > 0) {
    await reportprofitAndLossAsFifo(
      fifoRecords,
      symbol.toUpperCase(),
      currency,
      fileId,
      outputDir,
    )
  }
}
