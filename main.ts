import { reset } from './src/database.ts'
import { importTransactions } from './src/import/index.ts'
import { Year } from './src/model/common.ts'
import { createFifoReport } from './src/report/fifo.ts'
import { getUniqueTransactionSymbols } from './src/report/symbols.ts'
import { reportTransactions } from './src/report/transaction.ts'

enum TASK {
    IMPORT = 'import',
    TRANS = 'trans-report',
    FIFO = 'fifo-report',
    SYMBOLS = 'symbols-report',
    RESET = 'reset',
}

const usage = `fifo-calc <import|trans-report|fifo-report|symbols-report> <options>`

if (!Deno.env.get('HOME')) {
    console.error('HOME environment variable not found')
    Deno.exit(1)
}

switch (Deno.args[0]) {
    case TASK.IMPORT: {
        const csvFilePath = Deno.args[1]
        const currency = Deno.args[2]

        if (!csvFilePath) {
            console.error('Missing CSV file path')
            console.log(`Usage: fifo-calc import <csv-file-path> <taxable-currency>`)
            Deno.exit(1)
        }

        await importTransactions(csvFilePath, currency)
        break
    }
    case TASK.TRANS: {
        const year = Deno.args[1]
        const currency = Deno.args[2]
        const symbol = Deno.args[3]

        if (!year || !currency) {
            console.error('Missing year or taxable-currency')
            console.log(`Usage: fifo-calc trans-report <year> <taxable-currency> [<symbol>]`)
            Deno.exit(1)
        }

        reportTransactions(Year.parse(year).toString(), currency, symbol)
        break
    }
    case TASK.FIFO: {
        const year = Deno.args[1]
        const currency = Deno.args[2]
        const symbol = Deno.args[3]

        if (!year || !currency) {
            console.error('Missing year, symbol or taxable-currency')
            console.log(`Usage: fifo-calc fifo-report <year> <taxable-currency> [<symbol>]`)
            Deno.exit(1)
        }

        await createFifoReport(Year.parse(year).toString(), currency, symbol)
        break
    }
    case TASK.SYMBOLS: {
        const year = Deno.args[1]

        if (!year) {
            console.error('Missing year')
            console.log(`Usage: fifo-calc symbols <year>`)
            Deno.exit(1)
        }

        await getUniqueTransactionSymbols(year)
        break
    }
    case TASK.RESET: {
        await reset()
        break
    }
    default:
        console.error('Invalid task')
        console.log(`Usage: ${usage}`)
}
