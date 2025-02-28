# Fifo-calc Commands

## Symbols

Get a list of symbols used in imported transactions

```
fifo-calc report --type symbols <options> [--help] [--debug]

Options:
  [--year <year>] : Year for which the symbols are being reported
  [--as-json]     : Output as JSON
```

## Exchanges

Get a list of exchanges used in imported transactions

```
fifo-calc report --type exchanges <options> [--help] [--debug]

Options:
  [--year <year>] : Year for which the exchanges are being reported
  [--as-json]     : Output as JSON
```

## Fifo

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

## Database backup

### Save

Save the database content to a file

```
fifo-calc report --type save <options> [--help] [--debug]

Options:
  [--symbol <symbol>]        : Limit to a specific symbol
  [--year <year>]            : Limit to a specific year
  [--oput-dir <output-dir>]  : Output directory - defaults to ./backup
```

### Restore

Restore transaction to an existing or new database (be aware that duplicates are NOT checked).

```
fifo-calc report --type restore <options> [--help] [--debug]

Options:
  --input <csv-file>   : Input CSV file
  [--symbol <symbol>]  : Limit to a specific symbol
  [--year <year>]      : Limit to a specific year
```
