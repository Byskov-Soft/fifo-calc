import { parseISO } from 'date-fns'
import { getFifoReportFilePath } from '../../../config.ts'
import type { TransactionProfitFifo } from '../../../model/index.ts'
import { getUtcDateString } from '../../../util/date.ts'

export const reportprofitAndLossAsFifo = async (
  fifoRecords: TransactionProfitFifo[],
  symbol: string,
  currrency: string,
  fileId: string,
  outputDir: string,
) => {
  if (fifoRecords.length > 0) {
    const fifoFile = getFifoReportFilePath(outputDir, symbol, fileId)

    const headers = [
      'Sell date',
      'Buy date',
      'Exchange',
      'Symbol',
      'Item count',
      `Sell cost (${currrency})`,
      `Buy cost (${currrency})`,
      `Profit (${currrency})`,
      `Sell cost per item (${currrency})`,
      `Buy fee (${currrency})`,
      `Sell fee (${currrency})`,
      `Total fee (${currrency})`,
    ].join(',')

    const records = fifoRecords.map((c) => {
      const utcSellDate = parseISO(c.sell_date)
      const sellDateStr = getUtcDateString(utcSellDate)
      const utcBuyDate = parseISO(c.buy_date)
      const buyDateStr = getUtcDateString(utcBuyDate)

      return [
        sellDateStr,
        buyDateStr,
        c.exchange,
        c.symbol,
        c.item_count,
        c.sell_cost,
        c.cur_original_buy_cost,
        c.cur_profit,
        c.cur_cost_per_item,
        c.cur_buying_fee,
        c.cur_selling_fee,
        c.cur_total_fee,
      ].join(',')
    })

    const outputData = [headers, ...records].join('\n')
    await Deno.writeTextFile(fifoFile, outputData)
    console.log(`${symbol} FIFO report was written to\n${fifoFile}\n`)

    console.log([
      'Note that buy and sell transactions included in the report are flagged',
      'as processed and will not be included in future FIFO reports. If you',
      'need to start over, you can reset the processed flag by running',
      '"fifo-calc clear-processed"\n',
    ].join('\n'))
  }
}
