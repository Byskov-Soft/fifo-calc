import { format, parseISO } from 'date-fns'
import { getDataBase, restoreDatabases } from '../database.ts'
import { COLLECTION } from '../model/common.ts'
import { Transaction, TRANSACTION_TYPE, type TransactionProfit } from '../model/transaction.ts'

function processSellTransactions(
    transactions: Transaction[],
): TransactionProfit[] {
    const buyQueue: Array<{ amount: number; cost_per_item: number; total_cost: number }> = []
    const sellRecords: TransactionProfit[] = []

    transactions.forEach((tx) => {
        if (tx.type === TRANSACTION_TYPE.B) {
            buyQueue.push({
                amount: tx.amount,
                cost_per_item: tx.cur_price_per_item,
                total_cost: tx.cur_cost,
            })
        } else if (tx.type === TRANSACTION_TYPE.S) {
            let remainingAmount = tx.amount
            const feePerItem = tx.cur_fee / tx.amount

            while (remainingAmount > 0 && buyQueue.length > 0) {
                const currentBuy = buyQueue[0]

                if (currentBuy.amount <= remainingAmount) {
                    const sellCost = currentBuy.amount * tx.cur_price_per_item
                    const profitOrLoss = sellCost - currentBuy.total_cost

                    const buyingFee = parseFloat(
                        (currentBuy.amount * (tx.cur_fee / tx.amount)).toFixed(4),
                    )

                    const sellingFee = parseFloat((currentBuy.amount * feePerItem).toFixed(4))

                    sellRecords.push({
                        date: tx.date,
                        symbol: tx.symbol,
                        amount: currentBuy.amount,
                        sell_cost: parseFloat(sellCost.toFixed(4)),
                        cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(4)),
                        cur_original_buy_cost: parseFloat(currentBuy.total_cost.toFixed(4)),
                        cur_profit: parseFloat(profitOrLoss.toFixed(4)),
                        cur_buying_fee: buyingFee,
                        cur_selling_fee: sellingFee,
                        cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
                    })

                    remainingAmount -= currentBuy.amount
                    buyQueue.shift()
                } else {
                    const partialSellCost = remainingAmount * tx.cur_price_per_item // Exclude selling fees
                    const partialBuyCost = remainingAmount * currentBuy.cost_per_item // Exclude buying fees
                    const profitOrLoss = partialSellCost - partialBuyCost

                    const buyingFee = parseFloat(
                        (remainingAmount * (tx.cur_fee / tx.amount)).toFixed(4),
                    )

                    const sellingFee = parseFloat((remainingAmount * feePerItem).toFixed(4))

                    sellRecords.push({
                        date: tx.date,
                        symbol: tx.symbol,
                        amount: remainingAmount,
                        sell_cost: parseFloat(partialSellCost.toFixed(4)),
                        cur_cost_per_item: parseFloat(tx.cur_price_per_item.toFixed(4)),
                        cur_original_buy_cost: parseFloat(partialBuyCost.toFixed(4)),
                        cur_profit: parseFloat(profitOrLoss.toFixed(4)),
                        cur_buying_fee: buyingFee,
                        cur_selling_fee: sellingFee,
                        cur_total_fee: parseFloat((buyingFee + sellingFee).toFixed(4)),
                    })

                    currentBuy.amount -= remainingAmount
                    currentBuy.total_cost -= partialBuyCost
                    remainingAmount = 0
                }
            }
        }
    })

    return sellRecords
}

export const createFifoReport = async (year: string, currency: string, symbol?: string) => {
    await restoreDatabases()
    const db = getDataBase(year)

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
        'Symbol',
        'Amount',
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
            c.symbol,
            c.amount,
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
