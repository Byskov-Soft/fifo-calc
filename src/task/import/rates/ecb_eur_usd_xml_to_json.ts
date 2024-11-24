import { addDays, isBefore, parseISO } from 'date-fns'
import { XMLParser } from 'fast-xml-parser'
import type { Year } from '../../../model/common.ts'
import { createDbDir, getDatabasePath } from '../../../persistence/database.ts'
import { getDateRange, isBufferDate } from '../../../util/date.ts'

type RateTable = Record<string, number>

const parseDatesAndRateXML = (xmlString: string, year: Year): {
    records: RateTable
    firstDate: Date
    lastDate: Date
} => {
    const yearStr = year.toString()
    // Initialize the parser with options
    const parser = new XMLParser({
        ignoreAttributes: false, // Keep attributes
        attributeNamePrefix: '', // Remove prefix from attribute keys
    })

    // Parse XML to JSON
    const parsed = parser.parse(xmlString)

    // Navigate to the relevant part of the parsed JSON
    const observations = parsed.CompactData?.DataSet?.Series?.Obs

    // Convert the observations into the desired format
    const foundDatesAndRates: Record<string, number> = {}

    if (Array.isArray(observations)) {
        for (const obs of observations) {
            const date = obs.TIME_PERIOD as string
            const rate = obs.OBS_VALUE as string

            // We want to add some buffer days from the previous year
            // in case we need to fill in missing rates at the beginning of the year
            if ((date.startsWith(yearStr) || isBufferDate(date, yearStr, 4)) && date && rate) {
                foundDatesAndRates[date] = parseFloat(rate)
            }
        }
    }

    const dates = Object.keys(foundDatesAndRates).sort((a, b) => (a > b ? 1 : -1))
    const firstDate = parseISO(dates[0])
    const lastDate = parseISO(dates[dates.length - 1])
    firstDate.setUTCHours(0, 0, 0, 0)
    lastDate.setUTCHours(0, 0, 0, 0)
    return { records: foundDatesAndRates, firstDate, lastDate }
}

const addMissingDays = (
    records: RateTable,
    firstDate: Date,
    lastDate: Date,
    year: Year,
): Record<string, number> => {
    const yearStr = year.toString()
    // Add rates to the rate table.
    // If a day is missing (weekend + public holidays) the last known rate is used.
    const rateDates = Object.keys(records)
    let currentRate = records[rateDates[0]]
    const dates = getDateRange(firstDate, lastDate)
    const rateTable: Record<string, number> = {}

    dates.forEach((d) => {
        const index = d.toISOString().substring(0, 10)

        if (records[index] !== undefined) {
            currentRate = records[index]
        }

        rateTable[index] = currentRate
    })

    // Add the missing days at the end of a past year
    //  OR
    // Add the missing days up until today in the current year
    const currentYearStr = new Date().getFullYear().toString()

    const targetDateOfYear = yearStr === currentYearStr
        ? new Date()
        : new Date(Date.UTC(year, 12 - 1, 31)) // Months are 0-indexed

    if (isBefore(lastDate, targetDateOfYear)) {
        const extraDates = getDateRange(addDays(lastDate, 1), targetDateOfYear)

        extraDates.forEach((d) => {
            const index = d.toISOString().substring(0, 10)
            rateTable[index] = currentRate
        })
    }

    return rateTable
}

export const createEcbEurUsdRates = async (xmlFilePath: string, year: Year) => {
    const xmlData = await Deno.readTextFile(xmlFilePath)

    try {
        // Parse the XML data and convert it to JSON
        const { records, firstDate, lastDate } = parseDatesAndRateXML(xmlData, year)
        const rateTable = addMissingDays(records, firstDate, lastDate, year)
        const jsonData = JSON.stringify(rateTable, null, 2)

        // Write the JSON data to a file
        const outputFilePath = `${getDatabasePath()}/eur-usd-${year}.rate.json`
        await createDbDir()
        await Deno.writeTextFile(outputFilePath, jsonData)
        console.log(`\nEUR-USD rates written to ${outputFilePath}\n`)
    } catch (error) {
        console.error('\nError parsing XML:', error)
    }
}
