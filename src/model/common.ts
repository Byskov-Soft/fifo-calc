import type { Database } from '@bysk/jsonfile-db'
import { parseISO } from 'date-fns'
import z from 'zod'

export interface Usage {
  option: string
  arguments: string[]
}

// Dates
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

// Database

export const DB_FIFO = 'fifo'

export enum COLLECTION {
  TRANSACTION = 'transaction',
}

export const dbFileExtension = '.db.json'
export type DatabaseMap = { [name: string]: Database }

// Conversion rates
export const rateFileExtension = '.rate.json'

export const RateRecord = z.record(ISO8601DateString, z.number())
export type RateRecord = z.TypeOf<typeof RateRecord>
