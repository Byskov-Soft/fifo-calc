import { getArgValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import { COLLECTION, type Usage } from '../../model/common.ts'
import { Transaction } from '../../model/transaction.ts'
import { getDataBase, restoreDatabases } from '../../persistence/database.ts'

export const TRANSACTIONS_REPORT_TYPE = 'transactions'

export const usage: Usage = {
    option: `report --type ${TRANSACTIONS_REPORT_TYPE}`,
    arguments: [
        '--currency <taxable-currency>',
        '--year <year>',
        '[--symbol <symbol>]',
    ],
}

export const reportTransactions = async () => {
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

    const transactions = dbItems.map((t) => Transaction.parse(t.object()))
    const cur = currency.toUpperCase()

    console.log([
        'Date',
        'Exchange',
        'Type',
        'Symbol',
        'Cost (USD)',
        'Number of items',
        'Rate (USD)',
        'Symbol Fee',
        'USD Fee',
        `Cost (${cur})`,
        `Price per item (${cur})`,
        `Fee (${cur})`,
    ].join(','))

    transactions.forEach((t) => {
        console.log([
            t.date,
            t.exchange,
            t.type,
            t.symbol,
            t.usd_cost,
            t.item_count,
            t.usd_conversion_rate,
            t.symbol_fee,
            t.usd_fee,
            t.cur_cost,
            t.cur_price_per_item,
            t.cur_fee,
        ].join(','))
    })
}
