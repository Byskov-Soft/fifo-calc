import { getFifoReportFilePath } from '../../../config.ts'
import type { TransactionProfitFifo } from '../../../model/index.ts'
import { utcDateStringToISOString } from '../../../util/date.ts'

export const reportprofitAndLossAsFifo = async (
  fifoRecords: TransactionProfitFifo[],
  symbol: string,
  currrency: string,
  fileId: string,
) => {
  if (fifoRecords.length > 0) {
    const fifoFile = getFifoReportFilePath(symbol, fileId)

    const headers = [
      'Date',
      'Exchange',
      'Symbol',
      'Item Count',
      `Sell cost (${currrency})`,
      `Original buy cost (${currrency})`,
      `Profit (${currrency})`,
      `Cost per item (${currrency})`,
      `Buying fee (${currrency})`,
      `Selling fee (${currrency})`,
      `Total fee (${currrency})`,
    ].join(',')

    const records = fifoRecords.map((c) =>
      [
        utcDateStringToISOString(c.date),
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
    )

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
