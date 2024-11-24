import { Year } from '../../model/common.ts'
import { showUsageAndExit } from '../../util/usage.ts'
import { importRates } from './rates/index.ts'
import { importTransactions } from './transactions/index.ts'

enum IMPORT_TYPE {
    TRANSACTIONS = 'transactions',
    RATES = 'rates',
}

const importUsage = [
    '',
    'Usage: fifo-calc import <import-type> <options>',
    '',
    `Valid import types: ${Object.values(IMPORT_TYPE).join(', ')}\n`,
    '',
].join('\n')

export const importTasks = {
    'transactions': 'import transactions <exchange> <csv-file-path>',
    'rates': `import rates <taxable-currency> <source> <year> <input-file-path>`,
}

export const importData = async () => {
    const importType = Deno.args[1]

    if (!importType) {
        console.error('\nMissing import type')
        console.error(importUsage)
        Deno.exit(1)
    }

    switch (importType) {
        case IMPORT_TYPE.TRANSACTIONS: {
            const exchange = Deno.args[2]
            const csvFilePath = Deno.args[3]

            if (!csvFilePath) {
                console.error('\nMissing exchange or CSV file path\n')
                showUsageAndExit(importTasks['transactions'])
                Deno.exit(1)
            }

            await importTransactions(exchange, csvFilePath)
            break
        }
        case IMPORT_TYPE.RATES: {
            const source = Deno.args[2]
            const year = Deno.args[3]
            const xmlFilePath = Deno.args[4]

            if (!source || !year || !xmlFilePath) {
                console.error('\nMissing source, year or XML file path\n')
                showUsageAndExit(importTasks['rates'])
            }

            await importRates(source, Year.parse(year), xmlFilePath)
            break
        }
        default: {
            console.error(`Invalid import type "${importType}"`)
            Deno.exit(1)
        }
    }
}
