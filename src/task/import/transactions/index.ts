import { getOptValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import type { Usage } from '../../../model/common.ts'
import { importExchangeTransactions } from './transactions.ts'

export const TRANSACTIONS_IMPORT_TYPE = 'transactions'

export const usage: Usage = {
  option: `import --type ${TRANSACTIONS_IMPORT_TYPE}`,
  arguments: [
    '--exchange <exchange-name> : Name of the exchange transactions originate from',
    '--input <input-csv-file>   : A CSV file matching the fifo-calc input format',
    '[--year-limit <year>]      : Limit imports to a specific year',
  ],
}

export const importTransactions = () => {
  setUsage(usage)
  const exchange = getOptValue('exchange')
  const csvFilePath = getOptValue('input')
  const yearLimit = getOptValue('year-limit')

  if (!exchange || !csvFilePath) {
    showUsageAndExit()
  }

  return importExchangeTransactions(exchange, csvFilePath, yearLimit)
}
