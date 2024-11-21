import type { Database } from '@bysk/jsonfile-db'
import { parseISO } from 'date-fns'
import z from 'zod'

export enum COLLECTION {
    TRANSACTION = 'transaction',
    FIFO_IN_CURRENCY = 'fifo_in_currency',
}

export type DatabaseMap = { [name: string]: Database }

export const Year = z.string().transform((v) => {
    const value = parseInt(v)

    if (value < 2000 || value > 2100) {
        throw new Error('Invalid year')
    }

    return value
})

export type Year = z.TypeOf<typeof Year>

export const ISO8601DateString = z.string().refine(
    (arg): boolean => {
        if (parseISO(arg).toString() === 'Invalid Date') {
            console.error(`Parsing of '${arg}' as ISO8601 date failed`)
            return false
        }

        return true
    },
    { message: `Value is not a valid date` },
)

export type ISO8601DateString = z.TypeOf<typeof ISO8601DateString>
