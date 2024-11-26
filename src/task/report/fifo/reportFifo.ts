import type { TransactionProfitFifo } from '../../../model/index.ts'
import { utcDateStringToISOString } from '../../../util/date.ts'

export const reportprofitAndLossAsFifo = async (
  fifoRecords: TransactionProfitFifo[],
  outDir: string,
  symbol: string,
  currrency: string,
  prefix: string,
) => {
  if (fifoRecords.length > 0) {
    const fifoFile = `${outDir}/profit_and_loss_fifo_${symbol}.${prefix}.csv`

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
  }
}
