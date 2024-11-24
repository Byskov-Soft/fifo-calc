import { showUsageAndExit } from '../../util/usage.ts'
import { convertPionexTrackerCsv } from './fromPionexTracker.ts'
import { convertPionexTradingCsv } from './fromPionexTrading.ts'

enum EXCHANGE {
    PIONEX_TRADING = 'pionex-trading', // trading.csv
    PIONEX_TRACKER = 'pionex-tracker', // for-cointracker.csv
    BYBIT = 'bybit',
}

export const convertTasks = {
    'convert': 'convert <taxable-currency> <exchange> <input-csv-file> <output-csv-file>',
}

export const convert = async () => {
    const currency = Deno.args[1]
    const exchange = Deno.args[2]
    const inputFilePath = Deno.args[3]
    const outputFilePath = Deno.args[4]

    if (!currency || !exchange || !inputFilePath || !outputFilePath) {
        console.error('\nMissing currency, exchange, input-csv-file or output-csv-file\n')
        showUsageAndExit(convertTasks['convert'])
    }

    switch (exchange) {
        case EXCHANGE.PIONEX_TRADING: {
            await convertPionexTradingCsv(currency, inputFilePath, outputFilePath)
            break
        }
        case EXCHANGE.PIONEX_TRACKER: {
            convertPionexTrackerCsv(currency, inputFilePath, outputFilePath)
            break
        }
        case EXCHANGE.BYBIT: {
            break
        }
        default: {
            console.error(`\nInvalid exchange "${exchange}"`)
            console.log(`Supported exchanges: ${Object.values(EXCHANGE).join(', ')}\n`)
            showUsageAndExit(convertTasks['convert'])
        }
    }
}
