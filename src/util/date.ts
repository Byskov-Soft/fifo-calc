import { addDays, isAfter, parseISO, startOfYear } from 'date-fns'
/*
    Is a date within a buffer period of days before the start of the year?
*/
export const isBufferDate = (date: string, year: string, numberOfDays: number) => {
    const firstDateOfYear = startOfYear(year)
    firstDateOfYear.setUTCHours(0, 0, 0, 0)
    const providedDate = parseISO(date)

    return !isAfter(providedDate, firstDateOfYear) &&
        isAfter(providedDate, addDays(firstDateOfYear, -(numberOfDays - 1)))
}

/*
    Get a range of dates from start to end (both included)
*/
export function getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = []

    const currentDate = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    ) // Start at midnight UTC

    const endDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())) // End at midnight UTC

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate)) // Add a copy of the current date

        // Move to the next day explicitly in UTC
        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    return dates
}

export const utcDateStringToISO = (date: string): string => {
    const d = date.endsWith('Z') ? date : `${date}Z`
    return new Date(d).toISOString()
}
