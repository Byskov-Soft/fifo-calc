import { getArgValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import type { Usage } from '../../../model/common.ts'
import { importExchangeTransactions } from './transactions.ts'

export const TRANSACTIONS_IMPORT_TYPE = 'transactions'

export const usage: Usage = {
  option: `import --type ${TRANSACTIONS_IMPORT_TYPE}`,
  arguments: [
    '--exchange <exchange-name> : Name of the exchange being imported from',
    '--input <input-csv-file>   : A CSV file matching the fifo-calc format',
    '[--year-limit <year>]      : Limit imports to a specific year',
  ],
}

export const importTransactions = () => {
  setUsage(usage)
  const exchange = getArgValue('exchange')
  const yearLimit = getArgValue('year-limit')
  const csvFilePath = getArgValue('input')

  if (!exchange || !csvFilePath) {
    showUsageAndExit()
  }

  return importExchangeTransactions(exchange, csvFilePath, yearLimit)
}
