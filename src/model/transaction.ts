import { z } from 'zod'
import { ISO8601DateString } from './common.ts'

export const inputColumns = [
  'date',
  'type',
  'symbol',
  'usd_cost',
  'item_count',
  'usd_conversion_rate',
  'symbol_fee',
  'usd_fee',
]

export const transactionColumns = [
  'date',
  'exchange',
  'type',
  'symbol',
  'usd_cost',
  'item_count',
  'usd_conversion_rate',
  'symbol_fee',
  'usd_fee',
  'cur_cost',
  'cur_price_per_item',
  'cur_fee',
  'cleared',
  'row_num',
  'remaining_item_count',
  'remaining_cost',
]

export enum TRANSACTION_TYPE {
  B = 'B',
  S = 'S',
}

export const TransctionType = z.enum([TRANSACTION_TYPE.B, TRANSACTION_TYPE.S])
export type TransctionType = z.TypeOf<typeof TransctionType>

// The InputRecord without transformers. Use this when creating
// new input records without importing
export const InputTransaction = z.object({
  date: ISO8601DateString,
  type: TransctionType,
  symbol: z.string(),

  // The cost of the transaction in USD (price of all items)
  usd_cost: z.number(),

  // How many items were bought or sold
  item_count: z.number(),

  // The cost of the taxable currency in USD
  usd_conversion_rate: z.number(),

  // Typically for buy transactions (although some exchanges only have USD fees)
  symbol_fee: z.number(),

  // Typically for sell transactions
  usd_fee: z.number(),
})

export type InputTransaction = z.TypeOf<typeof InputTransaction>

// Transaction is the InputRecord with additional fields for the taxable currency
export const Transaction = z.object({
  ...InputTransaction.shape,
  _id: z.string().default(''),
  exchange: z.string(),

  // Cost in the taxable currency: usd_cost / usd_conversion_rate
  cur_cost: z.number(),

  // Cost per item in the taxable currency: cur_cost / item_count
  cur_price_per_item: z.number(),

  // Fee in the taxable currency:
  // For buy transactions: cur_price_per_item * symbol_fee
  // For sell transactions: 1 / usd_conversion_rate * usd_fee
  cur_fee: z.number(),

  // Has the transaction has been accounted for (will not be included in Fifo reports if 'true)
  cleared: z.boolean().default(false),

  // Used for keeping record order in case of same dates
  row_num: z.number().default(0),

  // The remaining item count for partially or fully sold buy transactions
  remaining_item_count: z.number(),
  // The remaining cost for partially or fully sold buy transactions
  remaining_cost: z.number(),
})

export type Transaction = z.TypeOf<typeof Transaction>

// TransactionProfit it the calculated profit of a transaction.
// All numbers are in the taxable currency
export const TransactionProfitFifo = z.object({
  sell_date: z.string(),
  buy_date: z.string(),
  exchange: z.string(),
  symbol: z.string(),
  item_count: z.number(),
  sell_cost: z.number(),
  cur_cost_per_item: z.number(),
  cur_original_buy_cost: z.number(),
  cur_profit: z.number(),
  cur_buying_fee: z.number(),
  cur_selling_fee: z.number(),
  cur_total_fee: z.number(),
})

export type TransactionProfitFifo = z.TypeOf<typeof TransactionProfitFifo>
