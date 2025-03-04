# Importing Transactions

## Import Command

```
Usage: fifo-calc import <options> [--help] [--debug]

Options:
  --exchange <exchange-name> : Name of the exchange transactions originate from
  --input <input-csv-file>   : A CSV file matching the fifo-calc input format
  [--year <year>]            : Limit imports to a specific year
```

Example: `fifo-calc import --exchange Binance --input ./binanceTransactions.csv`

## Importing Overview

- Transactions should be available in CSV files
- You can create those by exporting from Excel or other "sheet" apps
- If you already have CSV files from an exchange, you need to convert those to a format compatible with fifo-calc

### CSV File Format

Here are a few example lines from a Fifo-calc compatible input CSV file:

```c
t_currency,tax_currency,date,type,symbol,tcur_cost,item_count,tcur_conversion_rate,symbol_fee,tcur_fee
USD,EUR,2024-09-23T12:30:32.000Z,B,RENDER,105.31035,16.35,1.1119,0.01635,0
USD,EUR,2024-09-25T05:41:22.000Z,S,RENDER,49.059,7.9,1.1194,0,0.049059
```

### Mandatory Columns

| Column               | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| t_currency           | Transaction currency                                                        |
| tax_currency         | Taxable currency                                                            |
| date                 | Transaction date (preferably in ISO format)                                |
| symbol               | Traded symbol (e.g., BTC, ETH)                                              |
| tcur_cost            | Transaction price in transaction currency (fee excluded)                    |
| item_count           | Number of items bought/sold (can be fractional)                             |
| tcur_conversion_rate | Conversion rate between transaction and taxable currency                    |
| symbol_fee           | Fee in the symbol currency (0 if none)                                      |
| tcur_fee             | Fee in the transaction currency (0 if none)                                 |

## Fixing Mistakes and Re-importing

To correct mistakes or re-import updated files:
1. Empty the Fifo DB by running `fifo-calc reset`
2. Re-import your corrected files

**Note:** There is no duplicate check, so importing the same file twice will double the records.