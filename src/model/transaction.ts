import { parseISO } from 'date-fns'
import { z } from 'zod'
import { ISO8601DateString } from './common.ts'

export const transactionColumns = [
    'date',
    'type',
    'symbol',
    'usd_cost',
    'amount',
    'usd_rate',
    'symbol_fee',
    'usd_fee',
]

export const currencyColumns = [
    'cost',
    'price_per_item',
    'fee',
    'fee_per_item',
]

export enum TRANSACTION_TYPE {
    B = 'B',
    S = 'S',
}

export const TransctionType = z.enum([TRANSACTION_TYPE.B, TRANSACTION_TYPE.S])
export type TransctionType = z.TypeOf<typeof TransctionType>

// Parser for CSV input
export const InputTransaction = z.object({
    date: z.string().transform((v: string) => parseISO(v).toISOString()),
    type: TransctionType,
    symbol: z.string().toUpperCase(),
    usd_cost: z.string().transform((v: string) => parseFloat(v)),
    amount: z.string().transform((v: string) => parseFloat(v)),
    usd_rate: z.string().transform((v: string) => parseFloat(v)),
    symbol_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
    usd_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
})

export type InputTransaction = z.TypeOf<typeof InputTransaction>

// Parser for internal transaction
export const Transaction = z.object({
    date: ISO8601DateString,
    type: TransctionType,
    symbol: z.string().toUpperCase(),
    usd_cost: z.number(),
    amount: z.number(),
    usd_rate: z.number(),
    symbol_fee: z.number(),
    usd_fee: z.number(),
})

export type Transaction = z.TypeOf<typeof Transaction>

// Parser for internal currency specific transaction
export const TransactionInCurrency = z.object({
    ...Transaction.shape,
    cur_cost: z.number(),
    cur_price_per_item: z.number(),
    cur_fee: z.number(),
    cur_fee_per_item: z.number(),
})

export type TransactionInCurrency = z.TypeOf<typeof TransactionInCurrency>

export const TransactionProfitInCurrency = z.object({
    date: z.string(),
    amount: z.number(),
    sell_cost: z.number(),
    cur_cost_per_item: z.number(),
    cur_original_buy_cost: z.number(),
    cur_profit: z.number(),
    cur_buying_fee: z.number(),
    cur_selling_fee: z.number(),
    cur_total_fee: z.number(),
})

export type TransactionProfitInCurrency = z.TypeOf<typeof TransactionProfitInCurrency>
