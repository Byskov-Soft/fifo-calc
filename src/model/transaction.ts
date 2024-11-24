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
    usd_cost: z.number(),
    item_count: z.number(),
    usd_conversion_rate: z.number(),
    symbol_fee: z.number(),
    usd_fee: z.number(),
})

export type InputTransaction = z.TypeOf<typeof InputTransaction>

// Transaction is the InputRecord with additional fields for the taxable currency
export const Transaction = z.object({
    ...InputTransaction.shape,
    exchange: z.string(),
    cur_cost: z.number(),
    cur_price_per_item: z.number(),
    cur_fee: z.number(),
})

export type Transaction = z.TypeOf<typeof Transaction>

// TransactionProfit it the calculated profit of a transaction.
// All numbers are in the taxable currency
export const TransactionProfit = z.object({
    date: z.string(),
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

export type TransactionProfit = z.TypeOf<typeof TransactionProfit>
