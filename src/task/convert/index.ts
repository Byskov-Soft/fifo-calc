import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import type { Usage } from '../../model/common.ts'
import { convertBybitSpotPreUnified } from './bybitSpotPreUnified.ts'
import { convertBybitSpotUnified } from './bybitSpotUnified.ts'
import { convertPionexTracker } from './pionexTracker.ts'
import { convertPionexTrading } from './pionexTrading.ts'

enum INPUT_TYPE {
  BYBIT_SPOT_PRE_UNIFIED = 'bybit-spot-pre-unified',
  BYBIT_SPOT_UNIFIED = 'bybit-spot-unified',
  PIONEX_TRADING = 'pionex-trading',
  PIONEX_COIN_TRACKER = 'pionex-coin-tracker',
}

const crashMessage =
  'If the operation crashes, check that the input file matches the correct type (see --type option).\n'

const currencyOption = [
  '--currency <taxable-currency> : For looking up the USD exchange rate (requires that rates are imported).\n',
  '                                  If currency is USD the rate lookup is skipped',
].join('')

export const usage: Usage = {
  option: 'convert',
  arguments: [
    `--type (\n      ${Object.values(INPUT_TYPE).join(' |\n      ')}\n    )`,
    currencyOption,
    '--input    <input-csv-file>   : A CSV file matching the specified type',
    '--output   <output-csv-file>  : fifo-calc compatible output file',
  ],
}

export const convertTasks = async () => {
  setUsage(usage)
  const inputType = getOptValue('type') as string
  const currency = getOptValue('currency') as string
  const inputFilePath = getOptValue('input') as string
  const outputFilePath = getOptValue('output') as string

  if (!currency || !inputType || !inputFilePath || !outputFilePath) {
    showUsageAndExit({
      extras: [crashMessage].join('\n'),
      exitWithError: true,
    })
  }

  switch (inputType) {
    case INPUT_TYPE.PIONEX_TRADING: {
      await convertPionexTrading(currency.toUpperCase(), inputFilePath, outputFilePath)
      break
    }
    case INPUT_TYPE.PIONEX_COIN_TRACKER: {
      await convertPionexTracker(currency.toUpperCase(), inputFilePath, outputFilePath)
      break
    }
    case INPUT_TYPE.BYBIT_SPOT_PRE_UNIFIED: {
      await convertBybitSpotPreUnified(currency.toUpperCase(), inputFilePath, outputFilePath)
      break
    }
    case INPUT_TYPE.BYBIT_SPOT_UNIFIED: {
      await convertBybitSpotUnified(currency.toUpperCase(), inputFilePath, outputFilePath)
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
