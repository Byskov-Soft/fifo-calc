import { format, parseISO } from 'date-fns'
import { rateFileExtension, RateRecord, type Year } from '../model/common.ts'
import { getDatabasePath } from './database.ts'

interface RateTables {
    [currency: string]: {
        [year: string]: RateRecord
    }
}

const rateTables: RateTables = {}

export const getRateFileNames = async () => {
    const files: string[] = []

    for await (const f of Deno.readDir(getDatabasePath())) {
        if (f.isFile && f.name.endsWith(rateFileExtension)) {
            files.push(f.name)
        }
    }

    return files
}

export const loadRateTable = async (currency: string, year: Year) => {
    const expectedFileName = `${currency}-usd-${year}.rate.json`

    const fileName = (await getRateFileNames()).find((fileName) => {
        return fileName === expectedFileName
    })

    if (!fileName) {
        console.error(`Rate table file ${expectedFileName} was not found from ${getDatabasePath()}`)
        Deno.exit(1)
    }

    const data = await Deno.readTextFile(`${getDatabasePath()}/${fileName}`)

    if (!rateTables[currency]) {
        rateTables[currency] = {}
    }

    rateTables[currency][year] = RateRecord.parse(JSON.parse(data))
}

export const getUsdRate = (currency: string, transactionDate: string): number => {
    const year = format(parseISO(transactionDate), 'yyyy')
    const date = format(parseISO(transactionDate), 'yyyy-MM-dd')

    if (!rateTables[currency] || !rateTables[currency][year]) {
        console.error(`Rate table for ${currency}-usd in year ${year} has not been loaded`)
        Deno.exit(1)
    }

    if (!rateTables[currency][year][date]) {
        console.error(`Rate for ${currency}-usd in year ${year} on ${date} has not been loaded`)
        Deno.exit(1)
    }

    return rateTables[currency][year][date]
}
