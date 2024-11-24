import { getArgValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import type { Usage } from '../../model/common.ts'
import { convertPionexTrackerCsv } from './fromPionexTracker.ts'
import { convertPionexTradingCsv } from './fromPionexTrading.ts'

enum INPUT_TYPE {
    PIONEX_TRADING = 'pionex-trading', // trading.csv
    PIONEX_TRACKER = 'pionex-tracker', // for-cointracker.csv
    BYBIT = 'bybit',
}

const crashMessage =
    'If the operation crashes, check that the input file matches the correct type (see --type option).\n'

export const usage: Usage = {
    option: 'convert',
    arguments: [
        '--type (pionex-trading | pionex-tracker | bybit)',
        '--currency <taxable-currency>',
        '--input <input-csv-file>',
        '--output <output-csv-file>',
    ],
}

export const convertTasks = async () => {
    setUsage(usage)
    const inputType = getArgValue('type')
    const currency = getArgValue('currency')
    const inputFilePath = getArgValue('input')
    const outputFilePath = getArgValue('output')

    if (!currency || !inputType || !inputFilePath || !outputFilePath) {
        showUsageAndExit({
            extras: [crashMessage].join('\n'),
            exitWithError: true,
        })
    }

    switch (inputType) {
        case INPUT_TYPE.PIONEX_TRADING: {
            await convertPionexTradingCsv(currency, inputFilePath, outputFilePath)
            break
        }
        case INPUT_TYPE.PIONEX_TRACKER: {
            convertPionexTrackerCsv(currency, inputFilePath, outputFilePath)
            break
        }
        case INPUT_TYPE.BYBIT: {
            break
        }
        default: {
            showUsageAndExit({
                extras: [
                    `Invalid conversion type "${inputType}"`,
                    `Supported types: ${Object.values(INPUT_TYPE).join(', ')}\n`,
                    crashMessage,
                ].join('\n'),
                exitWithError: true,
            })
        }
    }
}
