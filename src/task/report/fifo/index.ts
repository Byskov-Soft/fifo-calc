import { getOptValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import { COLLECTION, DB_FIFO, type Usage } from '../../../model/common.ts'
import {
  Transaction,
  TRANSACTION_TYPE,
  type TransactionProfitFifo,
} from '../../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../../persistence/database.ts'
import { getFileId } from '../../../util/file.ts'
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
    '--currency <taxable-currency> : Some columns show values in this currency (converted from USD)',
    '--symbol <symbol>             : The symbol to report on',
  ],
}

export const reportFifo = async () => {
  // Resolve task arguments
  setUsage(usage)
  const currency = getOptValue('currency')
  const symbol = getOptValue('symbol')

  if (!currency || !symbol) {
    showUsageAndExit()
  }
  // Restore the database and get the transactions
  await restoreDatabases()
  const db = getDataBase(DB_FIFO)

  const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([
    { name: 'symbol', value: symbol.toUpperCase() },
    { name: 'cleared', 'value': false },
  ])

  const transactions = dbItems.map((item) => Transaction.parse(item.object()))

  // Process the transactions
  const { fifoRecords, mismatches } = await processTransactions(
    transactions,
  )

  const fileId = getFileId()

  // Report on sell mismatches
  if (mismatches.length > 0) {
    await reportMismatches(mismatches, symbol, fileId)
  }

  // Report the profit and loss
  if (fifoRecords.length > 0) {
    await reportprofitAndLossAsFifo(
      fifoRecords,
      symbol,
      currency.toUpperCase(),
      fileId,
    )
  }
}
