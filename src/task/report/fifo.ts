import { format, parseISO } from 'date-fns'
import { getArgValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { COLLECTION, type Usage } from '../../model/common.ts'
import { Transaction, TRANSACTION_TYPE, type TransactionProfit } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const FIFO_REPORT_TYPE = 'fifo'

function processSellTransactions(
    transactions: Transaction[],
): TransactionProfit[] {
    const buyQueue: Array<{ item_count: number; cost_per_item: number; total_cost: number }> = []
    const sellRecords: TransactionProfit[] = []

    transactions.forEach((tx) => {
        if (tx.type === TRANSACTION_TYPE.B) {
            buyQueue.push({
                item_count: tx.item_count,
                cost_per_item: tx.cur_price_per_item,
                total_cost: tx.cur_cost,
            })
        } else if (tx.type === TRANSACTION_TYPE.S) {
            let remainingcount = tx.item_count
            const feePerItem = tx.cur_fee / tx.item_count

            while (remainingcount > 0 && buyQueue.length > 0) {
                const currentBuy = buyQueue[0]

                if (currentBuy.item_count <= remainingcount) {
                    const sellCost = currentBuy.item_count * tx.cur_price_per_item
                    const profitOrLoss = sellCost - currentBuy.total_cost

                    const buyingFee = parseFloat(
                        (currentBuy.item_count * (tx.cur_fee / tx.item_count)).toFixed(4),
                    )

                    const sellingFee = parseFloat((currentBuy.item_count * feePerItem).toFixed(4))

                    sellRecords.push({
                        date: tx.date,
                        exchange: tx.exchange,
                        symbol: tx.symbol,
                        item_count: currentBuy.item_count,
                        sell_cost: parseFloat(sellCost.toFixed(4)),
                        cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(4)),
                        cur_original_buy_cost: parseFloat(currentBuy.total_cost.toFixed(4)),
                        cur_profit: parseFloat(profitOrLoss.toFixed(4)),
                        cur_buying_fee: buyingFee,
                        cur_selling_fee: sellingFee,
                        cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
                    })

                    remainingcount -= currentBuy.item_count
                    buyQueue.shift()
                } else {
                    const partialSellCost = remainingcount * tx.cur_price_per_item
                    const partialBuyCost = remainingcount * currentBuy.cost_per_item
                    const profitOrLoss = partialSellCost - partialBuyCost

                    const buyingFee = parseFloat(
                        (remainingcount * (tx.cur_fee / tx.item_count)).toFixed(4),
                    )

                    const sellingFee = parseFloat((remainingcount * feePerItem).toFixed(4))

                    sellRecords.push({
                        date: tx.date,
                        exchange: tx.exchange,
                        symbol: tx.symbol,
                        item_count: remainingcount,
                        sell_cost: parseFloat(partialSellCost.toFixed(4)),
                        cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(4)),
                        cur_original_buy_cost: parseFloat(partialBuyCost.toFixed(4)),
                        cur_profit: parseFloat(profitOrLoss.toFixed(4)),
                        cur_buying_fee: buyingFee,
                        cur_selling_fee: sellingFee,
                        cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
                    })

                    currentBuy.item_count -= remainingcount
                    currentBuy.total_cost -= partialBuyCost
                    remainingcount = 0
                }
            }

            if (remainingcount > 0) {
                console.error(
                    [
                        remainingcount.toFixed(2),
                        ` ${tx.symbol} were not matched with a buy transaction.\n`,
                        'Sell transaction:\n',
                        JSON.stringify(tx, null, 2),
                    ].join(''),
                    '\n',
                )
            }
        }
    })

    return sellRecords
}

export const usage: Usage = {
    option: `report --type ${FIFO_REPORT_TYPE}`,
    arguments: [
        '--currency <taxable-currency>',
        '--year <year>',
        '[--symbol <symbol>]',
    ],
}

export const reportFifo = async () => {
    setUsage(usage)
    const currency = getArgValue('currency')
    const _year = getArgValue('year')
    const symbol = getArgValue('symbol')

    if (!currency || !_year) {
        showUsageAndExit()
    }

    const year = parseInt(_year)
    await restoreDatabases()
    const db = getDataBase(year.toString())

    const dbItems = db.getCollection(COLLECTION.TRANSACTION).getByAttribute(
        symbol
            ? [{
                name: 'symbol',
                value: symbol.toUpperCase(),
            }]
            : [],
    )

    const transactions = dbItems.map((item) => Transaction.parse(item.object()))
    const cur = currency.toUpperCase()
    const sellRecords = processSellTransactions(transactions)

    console.log([
        'Date',
        'Exchange',
        'Symbol',
        'Item Count',
        `Sell cost (${cur})`,
        `Original buy cost (${cur})`,
        `Profit (${cur})`,
        `Cost per item (${cur})`,
        `Buying fee (${cur})`,
        `Selling fee (${cur})`,
        `Total fee (${cur})`,
    ].join(','))

    sellRecords.forEach((c) => {
        const dateIso = parseISO(c.date)
        const dateStr = format(dateIso, 'yyyy-MM-dd HH:mm:ss')

        console.log([
            dateStr,
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
        ].join(','))
    })
}
