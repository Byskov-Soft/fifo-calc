import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import type { Usage } from '../../model/common.ts'
import { FIFO_REPORT_TYPE, reportFifo } from './fifo/index.ts'
import { reportSymbols, SYMBOLS_REPORT_TYPE } from './symbols.ts'

export const usage: Usage = {
  option: 'report',
  arguments: [
    `--type (${FIFO_REPORT_TYPE} | ${SYMBOLS_REPORT_TYPE}`,
  ],
}

export const report = async () => {
  setUsage(usage)
  const reportType = getOptValue('type') || ''

  switch (reportType) {
    case FIFO_REPORT_TYPE: {
      await reportFifo()
      break
    }
    case SYMBOLS_REPORT_TYPE: {
      await reportSymbols()
      break
    }
    default: {
      showUsageAndExit()
    }
  }
}
