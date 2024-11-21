import { parseISO } from 'date-fns'
import { z } from 'zod'
import { ISO8601DateString } from './common.ts'

export const inputColumns = [
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

// Parser for CSV input record
export const InputRecord = z.object({
    date: z.string().transform((v: string) => parseISO(v).toISOString()),
    type: TransctionType,
    symbol: z.string().toUpperCase(),
    usd_cost: z.string().transform((v: string) => parseFloat(v)),
    amount: z.string().transform((v: string) => parseFloat(v)),
    usd_rate: z.string().transform((v: string) => parseFloat(v)),
    symbol_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
    usd_fee: z.string().transform((v: string) => v ? parseFloat(v) : 0),
})

export type InputRecord = z.TypeOf<typeof InputRecord>

// Parser for transaction
export const Transaction = z.object({
    date: ISO8601DateString,
    type: TransctionType,
    symbol: z.string().toUpperCase(),
    usd_cost: z.number(),
    amount: z.number(),
    usd_rate: z.number(),
    symbol_fee: z.number(),
    usd_fee: z.number(),
    cur_cost: z.number(),
    cur_price_per_item: z.number(),
    cur_fee: z.number(),
    cur_fee_per_item: z.number(),
})

export type Transaction = z.TypeOf<typeof Transaction>

export const TransactionProfit = z.object({
    date: z.string(),
    symbol: z.string(),
    amount: z.number(),
    sell_cost: z.number(),
    cur_cost_per_item: z.number(),
    cur_original_buy_cost: z.number(),
    cur_profit: z.number(),
    cur_buying_fee: z.number(),
    cur_selling_fee: z.number(),
    cur_total_fee: z.number(),
})

export type TransactionProfit = z.TypeOf<typeof TransactionProfit>
