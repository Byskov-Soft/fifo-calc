import type { Transaction } from '../../../model/index.ts'

export interface TransactionMismatch {
  remaining: number
  transaction: Transaction
}
