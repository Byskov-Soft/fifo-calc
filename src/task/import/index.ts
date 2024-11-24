import { getArgValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import type { Usage } from '../../model/common.ts'
import { importRates, RATES_IMPORT_TYPE } from './rates/index.ts'
import { importTransactions, TRANSACTIONS_IMPORT_TYPE } from './transactions/index.ts'

export const usage: Usage = {
    option: 'import',
    arguments: [
        `--type (${TRANSACTIONS_IMPORT_TYPE} | ${RATES_IMPORT_TYPE})`,
    ],
}

export const importData = async () => {
    setUsage(usage)
    const importType = getArgValue('type') || ''

    switch (importType) {
        case TRANSACTIONS_IMPORT_TYPE: {
            await importTransactions()
            break
        }
        case RATES_IMPORT_TYPE: {
            await importRates()
            break
        }
        default: {
            showUsageAndExit()
        }
    }
}
