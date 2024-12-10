import { loadRateTable } from '../../persistence/index.ts'

export const USD = 'USD'

export const loadRateTables = async (currency: string, years: number[]) => {
  if (currency !== USD) {
    await Promise.all(
      years.map((year) => loadRateTable(currency.toLocaleLowerCase(), year)),
    )
  }
}
