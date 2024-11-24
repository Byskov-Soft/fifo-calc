import { Year } from '../../model/common.ts'
import { showUsageAndExit } from '../../util/usage.ts'
import { reportFifo } from './fifo.ts'
import { reportSymbols } from './symbols.ts'
import { reportTransactions } from './transaction.ts'

enum REPORT_TYPE {
    TRANSACTIONS = 'transactions',
    FIFO = 'fifo',
    SYMBOLS = 'symbols',
}

const reportUsage = [
    '',
    'Usage: fifo-calc report <report-type> <options>',
    '',
    `Valid report types: ${Object.values(REPORT_TYPE).join(', ')}\n`,
    '',
].join('\n')

export const reportTasks = {
    'transactions': 'report transactions <taxable-currency> <year> [<symbol>]',
    'fifo': 'report fifo <taxable-currency> <year> [<symbol>]',
    'symbols': 'report symbols <year>',
}

export const report = async () => {
    const reportType = Deno.args[1]

    if (!reportType) {
        console.error('\nMissing report type')
        console.error(reportUsage)
        Deno.exit(1)
    }

    switch (reportType) {
        case REPORT_TYPE.TRANSACTIONS: {
            const currency = Deno.args[2]
            const year = Deno.args[3]
            const symbol = Deno.args[4]

            if (!currency || !year) {
                console.error('\nMissing taxable-currency or year\n')
                showUsageAndExit(reportTasks['transactions'])
            }

            await reportTransactions(currency, Year.parse(year), symbol)
            break
        }
        case REPORT_TYPE.FIFO: {
            const currency = Deno.args[2]
            const year = Deno.args[3]
            const symbol = Deno.args[4]

            if (!currency || !year) {
                console.error('\nMissing taxable-currency or year\n')
                showUsageAndExit(reportTasks['fifo'])
            }

            await reportFifo(currency, Year.parse(year), symbol)
            break
        }
        case REPORT_TYPE.SYMBOLS: {
            const year = Deno.args[2]

            if (!year) {
                console.error('\nMissing year\n')
                showUsageAndExit(reportTasks['symbols'])
            }

            await reportSymbols(Year.parse(year))
            break
        }
        default: {
            console.error(`\nInvalid report type "${reportType}"\n`)
            Deno.exit(1)
        }
    }
}
