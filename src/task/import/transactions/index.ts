import { getArgValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import type { Usage } from '../../../model/common.ts'
import { importExchangeTransactions } from './transactions.ts'

export const TRANSACTIONS_IMPORT_TYPE = 'transactions'

export const usage: Usage = {
  option: `import --type ${TRANSACTIONS_IMPORT_TYPE}`,
  arguments: [
    '--exchange <exchange-name>',
    '--input <input-csv-file>',
  ],
}

export const importTransactions = () => {
  setUsage(usage)
  const exchange = getArgValue('exchange')
  const csvFilePath = getArgValue('input')

  if (!exchange || !csvFilePath) {
    showUsageAndExit()
  }

  return importExchangeTransactions(exchange, csvFilePath)
}
