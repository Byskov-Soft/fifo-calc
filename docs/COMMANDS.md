# Fifo-calc Commands

## Symbols Report

Get a list of symbols used in imported transactions

```
fifo-calc report --type symbols <options> [--help] [--debug]

Options:
  [--year <year>] : Year for which the symbols are being reported
  [--as-json]     : Output as JSON
```

## Exchanges Report

Get a list of exchanges used in imported transactions

```
fifo-calc report --type exchanges <options> [--help] [--debug]

Options:
  [--year <year>] : Year for which the exchanges are being reported
  [--as-json]     : Output as JSON
```

## Import Transactions

Import transactions from a CSV file

```
fifo-calc import <options> [--help] [--debug]

Options:
  --exchange <exchange-name> : Name of the exchange transactions originate from
  --input <input-csv-file>   : A CSV file matching the fifo-calc input format
  [--year <year>]            : Limit imports to a specific year
```

Example: `fifo-calc import --exchange Binance --input ./binanceTransactions.csv`

## Fifo Report

Generate a fifo report based on imported transactions.

Processed buy/sell records will be maintained as follows:

- Balanced buy and sell records will be marked as processed.
- Partly balanced buy records will maintain the remaining number of unsold items.

```
fifo-calc report --type fifo <options> [--help] [--debug]

Options:
  --symbol <symbol>             : The symbol to report on
  [--exchange <exchange>]       : The exchange to report on
  [--output-dir <output-dir>]   : Output directory - defaults to the ./report
```

## Database Backup

### Save

Save the database content to a file

```
fifo-calc backup --type save <options> [--help] [--debug]

Options:
  [--symbol <symbol>]        : Limit to a specific symbol
  [--year <year>]            : Limit to a specific year
  [--oput-dir <output-dir>]  : Output directory - defaults to ./backup
```

### Restore

Restore transaction to an existing or new database (be aware that duplicates are NOT checked).

```
fifo-calc backup --type restore <options> [--help] [--debug]

Options:
  --input <csv-file>   : Input CSV file
  [--symbol <symbol>]  : Limit to a specific symbol
  [--year <year>]      : Limit to a specific year
```
