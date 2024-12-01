const home = Deno.env.get('HOME')

export const fifoCalcDir = `${home}/FIFOCalc`
export const fifoCalcDbDir = `${fifoCalcDir}/.data`
export const fifoCalcReportDir = `${fifoCalcDir}/Reports`

// DATABASE
export const dbFileExtension = 'db.json'
export const rateFileExtension = 'rate.json'

export const getDatabaseFilePath = (dbName: string) =>
  [`${fifoCalcDbDir}/${dbName}`, dbFileExtension].join('.')

export const getRateFilePath = (currency: string, year: number) =>
  [`${fifoCalcDbDir}/${currency}-usd-${year}`, rateFileExtension].join('.')

// FIFO REPORT
const fifoReportFileExtension = 'csv'
const fifoMismatchFileExtension = 'info'

export const fifoReportName = 'profit_and_loss_fifo'
export const fifoMismatchName = 'mismatch_fifo'

export const getFifoReportFilePath = (symbol: string, fileId: string) =>
  [`${fifoCalcReportDir}/${symbol}`, fifoReportName, fileId, fifoReportFileExtension].join('.')

export const getFifoMismatchFilePath = (symbol: string, fileId: string) =>
  [`${fifoCalcReportDir}/${symbol}`, fifoMismatchName, fileId, fifoMismatchFileExtension].join('.')
