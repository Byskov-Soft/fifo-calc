# Fifo-calc

## About

Fico-calc is a commandline tool that can be used to generate FIFO reports from **buy and sell
transactions**. The idea is to use these reports when **declaring capital gains to tax athorities**.
It is primarily made with **crypto transactions** in mind but may be compatible with other kinds of
trading.

Here are some example rows from a report:

| Sell Date           | Buy Date            | Exchange | Symbol | Item Count | Sell cost (EUR) | Original buy cost (EUR) | Profit (EUR) | Cost per item (EUR) | Buying fee (EUR) | Selling fee (EUR) | Total fee (EUR) |
| ------------------- | ------------------- | -------- | ------ | ---------- | --------------- | ----------------------- | ------------ | ------------------- | ---------------- | ----------------- | --------------- |
| 2024-11-08 07:47:00 | 2024-12-03 07:47:00 | Bybit    | SUI    | 22.14      | 47.3281         | 42.1976                 | 5.1304       | 2.1377              | 0.0473           | 0.0473            | 0.0946          |
| 2024-11-08 07:47:00 | 2024-12-14 06:55:00 | Bybit    | SUI    | 22.46      | 47.5805         | 42.8075                 | 4.773        | 2.1185              | 0.0476           | 0.0476            | 0.0952          |

The FIFO report is in CSV format (comma separated values), that can be imported to Google Sheets,
Excel and other similar apps.

This should get you a long way when doing your taxes, but whether or not this is enough to satisfy
the tax authorieties in your specific country is something to figure out before relying on the tool.

**DISCLAIMER: It should be noted that the author of this tool is not financial savy or or math
genius. It was made with personal use in mind and provided as-is. No responsibility for wrong
calculations or other issues will be taken. Use the tool at your own risk. That said, feedback about
bugs and features are welcome.**

## What exactly is a FIFO report?

FIFO means first-in-first-out, and is an accounting principle commonly used when calculating profits
and losses from transactions. Lets illustrate this with an example.

- You buy 10 apples for $2 each, total costs $20
- You buy 10 apples for $4 each, total costs $40
- You sell 15 apples for $3 each

What is you profit or loss?

With the FIFO method you would do multiple calculations to get the difference between the selling
and buyng prices in the order the apples were bought and sold.

- We sell all of the 10 apples we bought first:
  - `10*$3 - 10*$2 = $30 - $20 = $10 profit`

- Then we sell 5 of the 10 apples that were bought later
  - `5*$3 - 5*$4 = $15 - $20 = -$5 loss`

- So we earned $5 of profit and still have 5 unsold apples.

Another accounting principle is LIFO (last-in-first-out) which picks transactions in the reverse
order. It is less used, although still accepted by many tax authorities.

## Transactions in USD and taxation in another currency

Foremost this tool is made for the case where trading is done using USD, but taxation is in another
currency. This also means, that USD rates for the secondary currency must be provided.

A USD only scenario is also supported. For that we simply set the exchange rate to 1. In principle,
this will also work where transactions and taxation is in the same non-USD currency, although some
changes to the output headers must be made. It should, however be easy to fix in a text editor or a
sheet app (e.g. Excel). Anyway, a better solution for this scenario is currently in the works.

## Fractional transactions

As crypto is often bought in fractions (you partly buy items) , numbers are not rounded before it is
really necessary. Up to 10 decimals are used (depending on the situation). The number of bought and
sold items are, however, not rounded as that cannot always be shown properly. Take Bitcoin (BTC) as
the example. If you buy $10 of BTC you will own a fraction that could have four or five zero
decimals (e.g. `0.000015831`).

# Installation

- Install the [Deno runtime](https://deno.com/)
  - If you are on Linux or Mac, using [DVM](https://deno.land/x/dvm@v1.9.1) (Deno version manager)
    is recommended
- Clone the [GitHub repository](https://github.com/Byskov-Soft/fifo-calc):

  `git clone https://github.com/Byskov-Soft/fifo-calc.git`

- Compile the binary:
  ```
  cd fifo calc
  deno task compile
  ```
- Copy the compiled app to a directory in your path

  E.g. `sudo cp ./fifo-calc /usr/local/bin/`

# Usage

If your transactions are available in the supported format, creating FIFO reports takes 2 steps:

1. [Import transactions](#importing-transactions) from a CSV file
   - Transactions are saved to a JSON file DB located at `<HOME-DIR>/.fifo-calc/fifo.db.json`

1. [Create FIFO reports](#creating-fifo-reports) per symbol (BTC, ETH, etc.)
   - Reports are saved to a user defined or default output directory

**Please note**:

> The database is not meant for any long-term storage. The idea is that when it is time to report on
> capital gains for the past year, you will have a session where you import the relevant records,
> create the FIFO reports (one per symbol) and then empty the database.
>
> The database is not very efficient or safe, and keeping records spanning multiple years may result
> in very slow performance or cause other issues.
>
> Instead of keeping the database intact, it is better to use the
> [backup - save and restore](docs/BACKUPS.md) commands.

## Importing transactions

### Import command

```
Usage: fifo-calc import --type transactions <options> [--debug]

Options:
  --exchange <exchange-name> : Name of the exchange transactions originate from

  --input <input-csv-file>   : A CSV file matching the fifo-calc input format

  [--year-limit <year>]      : Limit imports to a specific year
```

Example: `fifo-calc import --type transactions --exchange Binance --input ./binanceTransactions.csv`

## About importing

- Transactions should be available in CSV files

- Typically you would create those by exporting from Excel or other "sheet" apps.

- If your taxable currency is not USD, a lot of work may go into finding the conversion rate for
  specific dates.

  - Some countries allow picking the conversion rate on the date of the report creation. This would
    be easy to copy-paste into multiple columns.

  - It is not necessarily advantageous to use the same rate for all transactions, especially if
    there has been big movements in price between USD and "your" currency.

  - You need to investigate what is acceptable in your specific country in regards to trades in a
    foreign currency.

Here are a few example lines from a Fifo-calc compatible input CSV file.

```c
date,type,symbol,usd_cost,item_count,usd_conversion_rate,symbol_fee,usd_fee
2024-10-17 15:51:00,B,BTC,169.6449177,0.002511,1.0866,0.000002511,0
2024-10-17 15:57:00,B,BTC,8.7828832,0.00013,1.0866,1.3e-7,0
2024-10-21 06:37:00,S,SOL,247.08672,1.448,1.0853,0,0.24708672
```

The following columns are mandatory (others will be ignored):

| Column              | Description                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| date                | When did you buy or sell? Different date formats will work as long as they can be parsed by JavaScript. Preferably use an ISO format such as `YYYY-MM-DD HH:mm:ss`                  |
| symbol              | What did you buy? BTC, SOL, etc                                                                                                                                                     |
| usd_cost            | What was the USD price (fee excluded) of the purchase?                                                                                                                              |
| item_count          | How many did you buy (this may be fractional)?                                                                                                                                      |
| usd_conversion_rate | How much did the taxable current cost in USD on the transaction date? Example: on `October 17th 2024` the cost of `1 EUR` was `1.0866 USD`. If the taxable currency is USD put `1`. |
| symbol_fee          | Eventual fee in the "symbol" currency or "0"                                                                                                                                        |
| usd_fee             | Eventual fee in USD or "0"                                                                                                                                                          |

### Fixing mistakes and re-importing

Sometimes you have made mistakes or simply want to re-import updated files. As there is no overwrite
or duplicate check functionality (you can import the same file twice and double the amount of
records) you need to empty the Fifo DB by running `fifo-calc reset`

### Exchange CSV files

If you already have CSV files from an exchange, you could convert the data to a Fifo-calc compatible
format.

- If your files are not too big, this could be an obvious job for ChatGTP or other AI.
- Fifo-calc provide converters for some record types from a few exchanges such as **Bybit** and
  **Pionex** (see [Conversion of exchange CSV files](docs/CSV_CONVERSION.md)

## Create FIFO reports

### Report command

```
Usage: fifo-calc report --type fifo <options> [--debug]

Options:
  --currency <taxable-currency> : Some columns show values in this currency (converted from USD)

  --symbol <symbol>             : The symbol to report on

  [--output-dir <output-dir>]   : Output directory - defaults to the ./report
```

Example: `fifo-calc report --type fifo --currency EUR --symbol BTC --output-dir ./`

### About FIFO reports

A FIFO report is always covering transactions of a single symbol. This means you must run the report
command for every single currency you have traded and want to report on.

To see traded symbols, from imported transactions, within a year you can run the symbols report
command.

Example: `fifo-calc report --type symbols --year 2024`

**Note:** A feature to easily report on multiple symbols (or all) is planned.

The FIFO report command will...

- include transactions from any year. This is necessary as what you are selling in one year may have
  been bought in another.

  - If you need a report for a specific year, you need to make sure you have

    1. only imported sell transactions for that year (support for a --year-limit option is planned)
    1. imported all previous buy transactions (that have not yet been cleared [^1] )

- skip sell transactions that don't have corresponding buy transactions. Partially covered sell
  transactions will also be skipped.

  - An additional **info** file will be created for sell transactions that were skipped. The file
    will list each skipped transaction.

- Will tag each buy and sell transaction in the report as cleared [^1] (in the database)

  - As buy transaction will not be cleared before all bought items are matched with sold items. The
    database will keep track on how much there is still to sell.

  - If you need to start over (e.g. if you forgot to import some transactions) You can reset the
    cleared flags and number of items tracking by running: `fifo reset-processed'

[^1]: A cleared transaction, is a transaction that has been accounted for. It is tagged so that it
    is not included in future reports.

Sample output:

```
Sell date,Buy date,Exchange,Symbol,Item count,Sell cost (EUR),Buy cost (EUR),Profit (EUR),Sell cost per item (EUR),Buy fee (EUR),Sell fee (EUR),Total fee (EUR)
2024-10-12 13:16:00,2024-08-11 19:41:07,Bybit,SUI,34.87,71.0248,29.4017,41.6231,2.03684403,0.07102475132565367,0.07102475132565367,0.142
2024-10-12 13:16:14,2024-08-11 19:41:07,Bybit,SUI,86.85,176.9078,73.2223,103.6856,2.0369354544,0.17690784421283598,0.17690784421283598,0.3538
```

Description of the output columns:

| Column                            | Description                                                 |
| --------------------------------- | ----------------------------------------------------------- |
| Sell date                         | When did you sell?                                          |
| Buy data                          | When did you buy?                                           |
| Exchange                          | The name of the exchange provided during transaction import |
| Symbol                            | What did you sell?                                          |
| item count                        | How many did you sell                                       |
| Sell cost (`<currency>`)          | The total sell price in the taxable currency                |
| Buy cost (`<currency>`)           | The total buy price in the taxable currency                 |
| Profit (`<currency>`)             | Profit/loss in the taxable currency                         |
| Sell cost per item (`<currency>`) | The sell price calculated per item                          |
| Buy fee (`<currency>`)            | The buy fee in the taxable currency                         |
| Sell fee (`<currency>`)           | The sell fee in the taxable currency                        |
| Total fee (`<currency>`)          | The total fee (buy fee + sell fee) in the taxable currency  |

# More documumentation

(All of these docs are currently empty... content is being written)

- [Fifo command overview](docs/COMMANDS.md)
- [Database backups - Save and Restore](docs/BACKUPS.md)
- [Conversion of exchange CSV files](docs/CSV_CONVERSION.md)
- [Exchange rate import (for CSV conversion)](docs/RATE_IMPORT.md)

# Planned features

- Better help provided by `fifo --help`

- Use `--year-limit` flag with the `report --type fifo` command, to skip sell transactions that are
  not in the provided year (buy transactions will never be skipped)
- Release converters (from Exchange CSV to Fifo-calc input format) as separate binaries
  - This will make it easier to copy existing converters and modify them for your own purpose
- Support for a single currency (if transaction and taxation currency is the same) that is not USD
