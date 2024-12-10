import { getFileId } from './util/file.ts'

const home = Deno.env.get('HOME')

export const fifoCalcDir = `${home}/.fifo-calc`

// DATABASE
export const dbFileExtension = 'db.json'
export const rateFileExtension = 'rate.json'

export const getDatabaseFilePath = (dbName: string) =>
  [`${fifoCalcDir}/${dbName}`, dbFileExtension].join('.')

export const getRateFilePath = (currency: string, year: number) =>
  [`${fifoCalcDir}/${currency}-usd-${year}`, rateFileExtension].join('.')

// FIFO REPORT
const fifoReportFileExtension = 'csv'
const fifoMismatchFileExtension = 'info'

export const fifoReportName = 'profit_and_loss'
export const fifoMismatchName = 'mismatch'

export const getFifoReportFilePath = (dir: string, symbol: string, fileId: string) =>
  [`${dir}/${symbol}`, 'fifo', fifoReportName, fileId, fifoReportFileExtension].join('.')

export const getFifoMismatchFilePath = (dir: string, symbol: string, fileId: string) =>
  [`${dir}/${symbol}`, 'fifo', fifoMismatchName, fileId, fifoMismatchFileExtension].join('.')

// TRANSACTION BACKUP
const transactionBackupFileExtension = 'csv'
export const transactionReportName = 'transaction-backup'

export const getTransactionBackupFilePath = (dir: string, symbol: string, year?: string) =>
  [
    `${dir}/${symbol}${year ? `.${year}` : ''}`,
    transactionReportName,
    getFileId(),
    transactionBackupFileExtension,
  ].join('.')
