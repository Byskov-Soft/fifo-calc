import type { Transaction } from '../../../model/index.ts'
import { TRANSACTION_TYPE } from '../../../model/transaction.ts'

export class FifoQueue {
  updatedBuyTransactions: string[]
  buyTransactionIds: string[]
  buyTransactionDict: Record<string, Transaction>
  sellTransactionDict: Record<string, Transaction>
  index = 0

  constructor() {
    this.buyTransactionIds = []
    this.buyTransactionDict = {}
    this.sellTransactionDict = {}
    this.updatedBuyTransactions = []
  }

  resetQueueIndex() {
    this.index = 0
  }

  addBuyTransaction(tx: Transaction): void {
    if (tx.type !== TRANSACTION_TYPE.B) {
      throw new Error('Invalid buy transaction: ' + JSON.stringify(tx))
    }

    this.buyTransactionIds.push(tx._id)
    this.buyTransactionDict[tx._id] = tx
  }

  addClearedSellTransaction(tx: Transaction): void {
    if (tx.type !== TRANSACTION_TYPE.S) {
      throw new Error('Invalid sell transaction' + JSON.stringify(tx))
    }

    this.sellTransactionDict[tx._id] = { ...tx, cleared: true }
  }

  nextBuy(): Transaction {
    const id = this.buyTransactionIds[this.index]

    if (!id) {
      throw new Error('No more buy transactions')
    }

    this.index++
    return structuredClone(this.buyTransactionDict[id])
  }

  reverseBuyIndex(): void {
    this.index--
  }

  hasNextBuy(): boolean {
    return this.index < this.buyTransactionIds.length
  }

  updateBuyTransaction(id: string, tx: Partial<Transaction>): void {
    if (!this.buyTransactionDict[id]) {
      throw new Error('No transaction found with id: ' + id)
    }

    this.buyTransactionDict[id] = {
      ...this.buyTransactionDict[id],
      ...tx,
    }

    this.updatedBuyTransactions.push(id)
  }

  getUpdatedBuyTransactions(): Transaction[] {
    return this.updatedBuyTransactions.map(
      (id) => structuredClone(this.buyTransactionDict[id]),
    )
  }

  getClearedSellTransactions(): Transaction[] {
    return Object.values(this.sellTransactionDict)
  }

  // These methods are probably not needed
  //
  // getBuyTransaction(id: string): Transaction {
  //   const transaction = this.buyTransactionDict[id]

  //   if (!transaction) {
  //     throw new Error('No transactionn found with id: ' + id)
  //   }

  //   return structuredClone(this.buyTransactionDict[id])
  // }

  // deleteBuyTransaction(id: string): void {
  //   this.buyTransactionIds = this.buyTransactionIds.filter((txId) => txId !== id)
  //   delete this.buyTransactionDict[id]
  //   this.resetQueueIndex()
  // }
}
