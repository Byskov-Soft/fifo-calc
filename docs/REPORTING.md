# Creating FIFO Reports

**Prerequisite:** Before creating reports, you must [import your transactions](./IMPORTING.md).

## Report Command

```
Usage: fifo-calc report --type fifo <options> [--help] [--debug]

Options:
  --currency <taxable-currency> : Currency for report values
  --symbol <symbol>             : The symbol to report on
  [--output-dir <output-dir>]   : Output directory (defaults to ./report)
```

Example: `fifo-calc report --type fifo --currency EUR --symbol BTC --output-dir ./`

## About FIFO Reports

- Reports cover transactions for a single symbol
- Include transactions from any year (necessary for matching buys and sells)
- Skip sell transactions without corresponding buy transactions
- Create info files for skipped transactions

### Report Output

Sample output:

```
Sell date,Buy date,Exchange,Symbol,Item count,Sell cost (EUR),Buy cost (EUR),Profit (EUR),Sell cost per item (EUR),Buy fee (EUR),Sell fee (EUR),Total fee (EUR)
2024-10-12 13:16:00,2024-08-11 19:41:07,Bybit,SUI,34.87,71.0248,29.4017,41.6231,2.03684403,0.07102475132565367,0.07102475132565367,0.142
```

### Output Columns

| Column                            | Description                                                 |
| --------------------------------- | ----------------------------------------------------------- |
| Sell date                         | Transaction sell date                                       |
| Buy date                          | Corresponding buy date                                      |
| Exchange                          | Exchange name                                               |
| Symbol                            | Traded symbol                                               |
| Item count                        | Number of items sold                                        |
| Sell cost (`<currency>`)          | Total sell price in taxable currency                        |
| Buy cost (`<currency>`)           | Total buy price in taxable currency                         |
| Profit (`<currency>`)             | Profit/loss in taxable currency                             |
| Sell cost per item (`<currency>`) | Sell price per item                                         |
| Buy fee (`<currency>`)            | Buy fee in taxable currency                                 |
| Sell fee (`<currency>`)           | Sell fee in taxable currency                                |
| Total fee (`<currency>`)          | Total fee (buy + sell) in taxable currency                  |

## Viewing Traded Symbols

To see symbols from imported transactions:
```
fifo-calc report --type symbols --year 2024
```