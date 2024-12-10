import { divide } from 'rambda'
import type { Transaction, TransactionProfitFifo } from '../../../model/index.ts'
import { debug } from '../../../util/debug.ts'
import { multiply, subtract } from '../../../util/floatMath.ts'
import type { FifoQueue } from './FifoQueue.ts'

export interface BuyTransactionUpdates {
  [recordId: string]: {
    remaining_item_count: number
    remaining_cost: number
  }
}

export interface FifoSaleResult {
  fifoRecords: TransactionProfitFifo[]
  mismatches: Transaction[]
  success: boolean
}

export const createRecordsFromSale = (tx: Transaction, fifoQueue: FifoQueue): FifoSaleResult => {
  const fifoRecords: TransactionProfitFifo[] = []
  const mismatches: Transaction[] = []

  // A temporary storage for buy record updates. We need this
  // as we don't yet know if the sell transaction will be entirely
  // covered. In that case the updates will not be persisted.
  const buyUpdates: BuyTransactionUpdates = {}

  let remainingCount = tx.item_count
  const feePerItem = tx.cur_fee / tx.item_count

  debug(
    [
      '----------------------------------------',
      `Processing sell transaction '${tx._id}'. Symbol: ${tx.symbol}, Items: ${tx.item_count}`,
    ],
  )

  if (!fifoQueue.hasNextBuy()) {
    debug('No buy transactions to claim from')
  }

  while (remainingCount > 0 && fifoQueue.hasNextBuy()) {
    const currentBuy = fifoQueue.nextBuy()

    debug(
      `Buy transaction '${currentBuy._id}' has ${currentBuy.remaining_item_count} items available`,
    )

    if (currentBuy.remaining_item_count <= remainingCount) {
      // The available amount from the buy record is less than or equal to
      // the remaining sell amount, so we sell the entire buy record
      debug(`Claimning ${currentBuy.remaining_item_count} (all) items from buy transaction`)

      // currentBuy.item_count * tx.cur_price_per_item
      const sellCost = multiply(currentBuy.remaining_item_count, tx.cur_price_per_item)

      // sellCost - currentBuy.total_cost
      const profitOrLoss = subtract(sellCost, currentBuy.remaining_cost)

      // currentBuy.item_count * (tx.cur_fee / tx.item_count)
      const buyingFee = multiply(
        currentBuy.remaining_item_count,
        divide(tx.cur_fee, tx.item_count),
      )

      // currentBuy.item_count * feePerItem
      const sellingFee = multiply(currentBuy.remaining_item_count, feePerItem)

      fifoRecords.push({
        sell_date: tx.date,
        buy_date: currentBuy.date,
        exchange: tx.exchange,
        symbol: tx.symbol,
        item_count: currentBuy.remaining_item_count,
        sell_cost: parseFloat(sellCost.toFixed(4)),
        cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(10)),
        cur_original_buy_cost: parseFloat(currentBuy.remaining_cost.toFixed(4)),
        cur_profit: parseFloat(profitOrLoss.toFixed(4)),
        cur_buying_fee: buyingFee,
        cur_selling_fee: sellingFee,
        cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
      })

      remainingCount -= currentBuy.remaining_item_count
      currentBuy.remaining_item_count = 0
      currentBuy.remaining_cost = 0

      debug(`${remainingCount} buy items remaining to be claimed`)

      buyUpdates[currentBuy._id] = {
        remaining_item_count: 0,
        remaining_cost: 0,
      }
    } else {
      // The available amount from the buy record is more than the remaining
      // sell amount, so we partially sell the buy record
      debug(`Claimning ${remainingCount} items from buy transaction`)
      const partialSellCost = remainingCount * tx.cur_price_per_item
      const partialBuyCost = remainingCount * currentBuy.cur_price_per_item
      const profitOrLoss = partialSellCost - partialBuyCost

      const buyingFee = parseFloat(
        (remainingCount * (tx.cur_fee / tx.item_count)).toFixed(4),
      )

      const sellingFee = parseFloat((remainingCount * feePerItem).toFixed(8))

      fifoRecords.push({
        sell_date: tx.date,
        buy_date: currentBuy.date,
        exchange: tx.exchange,
        symbol: tx.symbol,
        item_count: remainingCount,
        sell_cost: parseFloat(partialSellCost.toFixed(4)),
        cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(10)),
        cur_original_buy_cost: parseFloat(partialBuyCost.toFixed(4)),
        cur_profit: parseFloat(profitOrLoss.toFixed(4)),
        cur_buying_fee: buyingFee,
        cur_selling_fee: sellingFee,
        cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
      })

      // Remove what we have sold from the buy record
      currentBuy.remaining_item_count = subtract(currentBuy.remaining_item_count, remainingCount)
      currentBuy.remaining_cost = subtract(currentBuy.remaining_cost, partialBuyCost)
      remainingCount = 0

      debug([
        'Sell transaction was fully covered',
        `${currentBuy.remaining_item_count} items remaining in buy transaction`,
      ])

      buyUpdates[currentBuy._id] = {
        remaining_item_count: currentBuy.remaining_item_count,
        remaining_cost: currentBuy.remaining_cost,
      }

      // Since the current buy record still has items left, we need to
      // reverse the index so that it is processed again in the next round
      fifoQueue.reverseBuyIndex()
    }
  }

  // Handle where we could not account for all sold items
  // (i.e. we ran out of buy records). We sell all items or none.
  if (remainingCount > 0) {
    debug([
      'Sell transaction could not be matched buy previous buy transactions',
      'Sell transaction was processed',
    ])
    mismatches.push(tx)

    return {
      fifoRecords: [],
      mismatches,
      success: false,
    }
  }

  // All items were sold successfully
  Object.keys(buyUpdates).forEach((id) => {
    // Update remaining counts and costs of the buy records
    const update = buyUpdates[id]

    fifoQueue.updateBuyTransaction(id, {
      ...update,
      ...(update.remaining_item_count === 0 ? { cleared: true } : {}),
    })
  })

  fifoQueue.addClearedSellTransaction(tx) // will set tx.cleared = true
  debug('Sell transaction was processed')

  return {
    fifoRecords,
    mismatches: [],
    success: true,
  }
}
