import { fifoCalcDbDir, getRateFilePath, rateFileExtension } from '../config.ts'
import { RateRecord, type Year } from '../model/common.ts'

interface RateTables {
  [currency: string]: {
    [year: string]: RateRecord
  }
}

const rateTables: RateTables = {}

export const getRateFileNames = async () => {
  const files: string[] = []

  for await (const f of Deno.readDir(fifoCalcDbDir)) {
    if (f.isFile && f.name.endsWith(rateFileExtension)) {
      files.push(f.name)
    }
  }

  return files
}

export const loadRateTable = async (currency: string, year: Year) => {
  const expectedFileName = getRateFilePath(currency, year)
  const fileInfo = await Deno.stat(expectedFileName)

  if (!fileInfo.isFile) {
    console.error(`\nRate table file ${expectedFileName} was not found.\n`)
    Deno.exit(1)
  }

  const data = await Deno.readTextFile(expectedFileName)

  if (!rateTables[currency]) {
    rateTables[currency] = {}
  }

  rateTables[currency][year] = RateRecord.parse(JSON.parse(data))
}

export const getUsdRate = (currency: string, transactionDate: string): number => {
  const year = transactionDate.substring(0, 4)
  const date = transactionDate.substring(0, 10)

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
