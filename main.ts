import { reset } from './src/database.ts'
import { createFifoByCurrency } from './src/fifo.ts'
import { importTransactions } from './src/import.ts'
import { Year } from './src/model/common.ts'
import { getUniqueTransactionSymbols } from './src/symbols.ts'
import { createTransactionsByCurrency } from './src/transactions.ts'

enum TASK {
    IMPORT = 'import',
    TRANS = 'trans',
    FIFO = 'fifo',
    SYMBOLS = 'symbols',
    RESET = 'reset',
}

const usage = `fifo-calc <import|trans|fifo|symbols> <options>`

if (!Deno.env.get('HOME')) {
    console.error('HOME environment variable not found')
    Deno.exit(1)
}

switch (Deno.args[0]) {
    case TASK.IMPORT: {
        const csvFilePath = Deno.args[1]

        if (!csvFilePath) {
            console.error('Missing CSV file path')
            console.log(`Usage: fifo-calc import <csv-file-path>`)
            Deno.exit(1)
        }

        await importTransactions(csvFilePath)
        break
    }
    case TASK.TRANS: {
        const year = Deno.args[1]
        const currency = Deno.args[2]

        if (!year || !currency) {
            console.error('Missing year or currency')
            console.log(`Usage: fifo-calc trans_cur <year> <currency> [csv]`)
            Deno.exit(1)
        }

        await createTransactionsByCurrency(
            Year.parse(year).toString(),
            currency,
        )
        break
    }
    case TASK.FIFO: {
        const year = Deno.args[1]
        const symbol = Deno.args[2]
        const currency = Deno.args[3]

        if (!year || !symbol || !currency) {
            console.error('Missing year, symbol or currency')
            console.log(`Usage: fifo-calc fifo <year> <symbol> <currency>`)
            Deno.exit(1)
        }

        await createFifoByCurrency(Year.parse(year).toString(), symbol, currency)
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
