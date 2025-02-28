import { z } from 'zod'
import { ISO8601DateString } from './common.ts'

export const inputColumns = [
  't_currency',
  'tax_currency',
  'date',
  'type',
  'symbol',
  'tcur_cost',
  'item_count',
  'tcur_conversion_rate',
  'symbol_fee',
  'tcur_fee',
]

export const transactionColumns = [
  't_currency',
  'tax_currency',
  'date',
  'type',
  'symbol',
  'tcur_cost',
  'item_count',
  'tcur_conversion_rate',
  'symbol_fee',
  'tcur_fee',
  'exchange',
  'taxcur_cost',
  'taxcur_price_per_item',
  'taxcur_fee',
  'cleared',
  'row_num',
  'remaining_item_count',
  'taxcur_remaining_cost',
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
  t_currency: z.string(),
  tax_currency: z.string(),
  date: ISO8601DateString,
  type: TransctionType,
  symbol: z.string(),

  // The cost of the transaction in USD (price of all items)
  tcur_cost: z.number(),

  // How many items were bought or sold
  item_count: z.number(),

  // The cost of the taxable currency in USD
  tcur_conversion_rate: z.number(),

  // Typically for buy transactions (although some exchanges only have USD fees)
  symbol_fee: z.number(),

  // Typically for sell transactions
  tcur_fee: z.number(),
})

export type InputTransaction = z.TypeOf<typeof InputTransaction>

// Transaction is the InputRecord with additional fields for the taxable currency
export const Transaction = z.object({
  ...InputTransaction.shape,
  _id: z.string().default(''),
  exchange: z.string(),

  // Cost in the taxable currency: usd_cost / usd_conversion_rate
  taxcur_cost: z.number(),

  // Cost per item in the taxable currency: cur_cost / item_count
  taxcur_price_per_item: z.number(),

  // Fee in the taxable currency:
  // For buy transactions: cur_price_per_item * symbol_fee
  // For sell transactions: 1 / usd_conversion_rate * usd_fee
  taxcur_fee: z.number(),

  // Has the transaction has been accounted for (will not be included in Fifo reports if 'true)
  cleared: z.boolean().default(false),

  // Used for keeping record order in case of same dates
  row_num: z.number().default(0),

  // The remaining item count for partially or fully sold buy transactions
  remaining_item_count: z.number(),
  // The remaining cost for partially or fully sold buy transactions
  taxcur_remaining_cost: z.number(),
})

export type Transaction = z.TypeOf<typeof Transaction>

// TransactionProfit is the calculated profit of a transaction.
// All numbers are in the taxable currency
export const TransactionProfitFifo = z.object({
  sell_date: z.string(),
  buy_date: z.string(),
  exchange: z.string(),
  symbol: z.string(),
  item_count: z.number(),
  sell_cost: z.number(),
  taxcur_cost_per_item: z.number(),
  taxcur_original_buy_cost: z.number(),
  taxcur_profit: z.number(),
  taxcur_buying_fee: z.number(),
  taxcur_selling_fee: z.number(),
  taxcur_total_fee: z.number(),
})

export type TransactionProfitFifo = z.TypeOf<typeof TransactionProfitFifo>
