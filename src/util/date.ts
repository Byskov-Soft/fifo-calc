import { addDays, isAfter, isBefore, isEqual } from 'date-fns'

export const utcDateStringToISO = (date: string): Date => {
  const d = date.endsWith('Z') ? date : `${date}Z`
  return new Date(d)
}

export const utcDateStringToISOString = (date: string): string => {
  return utcDateStringToISO(date).toISOString()
}

export const getUtcDateString = (date: Date): string => {
  // Extract UTC components
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  // YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/*
    Is a date within a buffer period of days before the start of the year?
*/
export const isBufferDateBeforeYearStart = (date: string, year: string, numberOfDays: number) => {
  const firstDateOfYear = new Date(year)
  const providedDate = utcDateStringToISO(date)
  const dateBeforeYearStart = addDays(firstDateOfYear, -numberOfDays)

  // Keep these log lines if debugging is needed
  // console.log('first day of year:', firstDateOfYear.toISOString())
  // console.log(`${numberOfDays} days before:`, dateBeforeYearStart.toISOString())
  // console.log('provided date:', date, providedDate.toISOString())

  // console.log(
  //     `${providedDate.toISOString()} is before ${firstDateOfYear.toISOString()} ? `,
  //     isBefore(providedDate, firstDateOfYear),
  // )

  // console.log(
  //     `${providedDate.toISOString()} is after ${dateBeforeYearStart} ? `,
  //     isAfter(providedDate, dateBeforeYearStart) || isEqual(providedDate, dateBeforeYearStart),
  // )

  const isValid = isBefore(providedDate, firstDateOfYear) &&
    (isAfter(providedDate, dateBeforeYearStart) || isEqual(providedDate, dateBeforeYearStart))

  return isValid
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
