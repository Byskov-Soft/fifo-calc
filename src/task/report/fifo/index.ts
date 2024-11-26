import { getArgValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import { COLLECTION, DB_FIFO, type Usage } from '../../../model/common.ts'
import {
  Transaction,
  TRANSACTION_TYPE,
  type TransactionProfitFifo,
} from '../../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../../persistence/database.ts'
import { createMultiFileReportDir } from '../../../util/file.ts'
import type { TransactionMismatch } from './common.ts'
import { reportprofitAndLossAsFifo } from './reportFifo.ts'
import { reportMismatches } from './reportMismatch.ts'

export const FIFO_REPORT_TYPE = 'fifo'

function processSellTransactions(
  transactions: Transaction[],
): {
  fifoRecords: TransactionProfitFifo[]
  mismatches: TransactionMismatch[]
  hasSellRecords: boolean
} {
  const buyQueue: Array<{ item_count: number; cost_per_item: number; total_cost: number }> = []
  const sellRecords: TransactionProfitFifo[] = []
  const mismatches: TransactionMismatch[] = []
  let hasSellRecords = false

  transactions.forEach((tx) => {
    if (tx.type === TRANSACTION_TYPE.B) {
      buyQueue.push({
        item_count: tx.item_count,
        cost_per_item: tx.cur_price_per_item,
        total_cost: tx.cur_cost,
      })
    } else if (tx.type === TRANSACTION_TYPE.S) {
      hasSellRecords = true
      let remainingcount = tx.item_count
      const feePerItem = tx.cur_fee / tx.item_count

      while (remainingcount > 0 && buyQueue.length > 0) {
        const currentBuy = buyQueue[0]

        if (currentBuy.item_count <= remainingcount) {
          const sellCost = currentBuy.item_count * tx.cur_price_per_item
          const profitOrLoss = sellCost - currentBuy.total_cost

          const buyingFee = parseFloat(
            (currentBuy.item_count * (tx.cur_fee / tx.item_count)).toFixed(4),
          )

          const sellingFee = parseFloat((currentBuy.item_count * feePerItem).toFixed(4))

          sellRecords.push({
            date: tx.date,
            exchange: tx.exchange,
            symbol: tx.symbol,
            item_count: currentBuy.item_count,
            sell_cost: parseFloat(sellCost.toFixed(4)),
            cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(4)),
            cur_original_buy_cost: parseFloat(currentBuy.total_cost.toFixed(4)),
            cur_profit: parseFloat(profitOrLoss.toFixed(4)),
            cur_buying_fee: buyingFee,
            cur_selling_fee: sellingFee,
            cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
          })

          remainingcount -= currentBuy.item_count
          buyQueue.shift()
        } else {
          const partialSellCost = remainingcount * tx.cur_price_per_item
          const partialBuyCost = remainingcount * currentBuy.cost_per_item
          const profitOrLoss = partialSellCost - partialBuyCost

          const buyingFee = parseFloat(
            (remainingcount * (tx.cur_fee / tx.item_count)).toFixed(4),
          )

          const sellingFee = parseFloat((remainingcount * feePerItem).toFixed(4))

          sellRecords.push({
            date: tx.date,
            exchange: tx.exchange,
            symbol: tx.symbol,
            item_count: remainingcount,
            sell_cost: parseFloat(partialSellCost.toFixed(4)),
            cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(4)),
            cur_original_buy_cost: parseFloat(partialBuyCost.toFixed(4)),
            cur_profit: parseFloat(profitOrLoss.toFixed(4)),
            cur_buying_fee: buyingFee,
            cur_selling_fee: sellingFee,
            cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
          })

          currentBuy.item_count -= remainingcount
          currentBuy.total_cost -= partialBuyCost
          remainingcount = 0
        }
      }

      if (remainingcount > 0) {
        const mismatch: TransactionMismatch = {
          remaining: remainingcount,
          transaction: tx,
        }

        mismatches.push(mismatch)
      }
    }
  })

  return { fifoRecords: sellRecords, mismatches, hasSellRecords }
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
  const currency = getArgValue('currency')
  const symbol = getArgValue('symbol')

  if (!currency || !symbol) {
    showUsageAndExit()
  }

  // Restore the database and get the transactions
  await restoreDatabases()
  const db = getDataBase(DB_FIFO)

  const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute([{
    name: 'symbol',
    value: symbol.toUpperCase(),
  }])

  const transactions = dbItems.map((item) => Transaction.parse(item.object()))

  // Process the transactions
  const { fifoRecords, mismatches, hasSellRecords } = processSellTransactions(transactions)

  // Process the results
  if (!hasSellRecords) {
    console.log('\nFIFO report was not created as no sell records were found for the symbol\n')
    Deno.exit(0)
  }

  // Report on sell mismatches
  const { dir: outDir, prefix: dirPrefix } = await createMultiFileReportDir()
  await reportMismatches(mismatches, outDir, symbol, dirPrefix)

  // Finally, report the profit and loss
  await reportprofitAndLossAsFifo(
    fifoRecords,
    outDir,
    symbol,
    currency.toUpperCase(),
    dirPrefix,
  )
}
