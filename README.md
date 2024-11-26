# Fifo-calc

## About

Fico-calc is a commandline tool that can be used to generate FIFO reports from buy and sell
transactions. It is primarily made with crypto transactions in mind but may be compatible with other
scenarios.

## What is a FIFO report and what is in it?

FIFO means first-in-first-out, and that principle is used when calculating profits and losses from
your transactions. Lets illustrate this with an example.

- You buy 10 apples for $2 each, total costs $20
- You buy 10 apples for $4 each, total costs $40
- You sell 15 apples for $3 each

What is you profit or loss?

With the FIFO method you would do multiple calculations to get the difference between the selling
and buyng prices in the order the apples were bought.

```
We sell all of the 10 apples we bought first
10*$3 - 10*$2 = $30 - $20 = $10 profit

Then  we sell 5 of the 10 apples that  were bought later
5*$3 - 5*$4  = $15 - $20 = -$5 loss

We still have 5 unsold apples.
```

The FIFO report is in CSV format (comma separated values). This can be importes to Google Sheets,
Excel and other programs.

Here is some sample output:

```
Date,Exchange,Symbol,Item Count,Sell cost (EUR),Original buy cost (EUR),Profit (EUR),Cost per item (EUR),Buying fee (EUR),Selling fee (EUR),Total fee (EUR)
2024-11-08 07:47:00,Bybit,SUI,22.14,47.3281,42.1976,5.1304,2.1377,0.0473,0.0473,0.0946
2024-11-09 06:55:00,Bybit,SUI,22.46,47.5805,42.8075,4.773,2.1185,0.0476,0.0476,0.0952
```

After opening the file with Sheets, Excel, etc. It should look something like this:

| Date                | Exchange | Symbol | Item Count | Sell cost (EUR) | Original buy cost (EUR) | Profit (EUR) | Cost per item (EUR) | Buying fee (EUR) | Selling fee (EUR) | Total fee (EUR) |
| ------------------- | -------- | ------ | ---------- | --------------- | ----------------------- | ------------ | ------------------- | ---------------- | ----------------- | --------------- |
| 2024-11-08 07:47:00 | Bybit    | SUI    | 22.14      | 47.3281         | 42.1976                 | 5.1304       | 2.1377              | 0.0473           | 0.0473            | 0.0946          |
| 2024-11-09 06:55:00 | Bybit    | SUI    | 22.46      | 47.5805         | 42.8075                 | 4.773        | 2.1185              | 0.0476           | 0.0476            | 0.0952          |

Note that dates presented as `year-month-day hour:minute:second`. This make it possible to
alphabetically sort the rows by date and still main proper order.

## Transactions in USD, taxation in another currency

Foremost this tool is made for the case where trading is done using USD, but taxation needs to be in
another currency. This also means, that one of the requirements is that the USD rates for the
secondary currency is provided.

A USD only scenario is also supported, as the exchange rate is always 1. If you only operate with a
single non-USD currency, this will in principle work, but some changes must be made to the headers
of the FIFO reports. Some work to make this more flexible is planned for the future.

## Fractional transactions

As crypto is often bought in fractions, numbers are not rounded before it is really necessary (on
the FIFO report). Up to four decimals are used. The number of bought and sold items are, however,
never rounded as that cannot always be shown properly. Take Bitcoin (BTC) as the example. If you buy
$10 of BTC you will own a fraction that could start with four or five zero decimals (0.0000).

# Documentation

In progress...
