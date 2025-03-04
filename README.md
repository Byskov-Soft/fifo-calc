# Fifo-calc

## Table of Contents
1. [About](#about)
2. [What does FIFO mean?](#what-does-fifo-mean)
3. [Is this tool for me?](#is-this-tool-for-me)
4. [Fifo-calc crypto suite](#fifo-calc-crypto-suite)
5. [Installation](#installation)
6. [Usage](#usage)
   - [Importing transactions](#importing-transactions)
   - [Creating FIFO reports](#creating-fifo-reports)
7. [More Documentation](#more-documentation)

## About

**Note:** If you want to quickly assess if `fifo-calc` is useful to you, please read the [is this tool for me?](#is-this-tool-for-me) section.

Fifo-calc is a commandline tool that can be used to generate FIFO reports from **buy and sell
transactions**. These reports are designed to assist with **capital gains declarations to tax
authorities**. It is primarily made with **crypto transactions** in mind but may be compatible with
other kinds of trading.

Here are some example rows from a report:

| Sell Date           | Buy Date            | Exchange | Symbol | Item Count | Sell cost (EUR) | Buy cost (EUR) | Profit (EUR) | Sell cost per item (EUR) | Buy fee (EUR) | Sell fee (EUR) | Total fee (EUR) |
| ------------------- | ------------------- | -------- | ------ | ---------- | --------------- | -------------- | ------------ | ------------------------ | ------------- | -------------- | --------------- |
| 2024-11-08 07:47:00 | 2024-12-03 07:47:00 | BYBIT    | SUI    | 22.14      | 47.3281         | 42.1976        | 5.1304       | 2.1377                   | 0.0473        | 0.0473         | 0.0946          |
| 2024-11-08 07:47:00 | 2024-12-14 06:55:00 | BYBIT    | SUI    | 22.46      | 47.5805         | 42.8075        | 4.773        | 2.1185                   | 0.0476        | 0.0476         | 0.0952          |

The FIFO report is in CSV format (comma separated values), that can be imported to Google Sheets,
Excel and other similar apps.

This should get you a long way when doing your taxes, but whether or not this is enough to satisfy
the tax authorities in your specific country is something you should verify before relying on the
tool.

**DISCLAIMER:** Please note that the author of this tool is not a financial expert or mathematician.
This tool was created for personal use and is provided as-is. The author takes no responsibility for
any incorrect calculations or other issues that may arise. Use this tool at your own risk. However,
feedback regarding bugs and feature requests is welcome.

## What does FIFO mean?

FIFO means first-in-first-out, and is an accounting principle commonly used when calculating profits
and losses from transactions. Let's illustrate this with an example:

- You buy 10 apples for $2 each, total costs $20
- You buy 10 apples for $4 each, total costs $40
- You sell 15 apples for $3 each

What is your profit or loss?

The FIFO method requires performing multiple calculations to determine the difference between
selling and buying prices, following the order in which the apples were bought and sold.

- We sell all of the 10 apples we bought first:
  - `10*$3 - 10*$2 = $30 - $20 = $10 profit`

- Then we sell 5 of the 10 apples that were bought later
  - `5*$3 - 5*$4 = $15 - $20 = -$5 loss`

- So we earned $5 of profit and still have 5 unsold apples.

Another accounting principle is LIFO (last-in-first-out) which picks transactions in the reverse
order. It is less used, although still accepted by many tax authorities.

## Is this tool for me?

This tool is designed for people who need to calculate capital gains from crypto transactions using the FIFO (First-In-First-Out) method. Here's what you need to know:

### Easy to use if:
- Your transactions are in USD and you need to report in EUR, or

  you can use a fixed conversion rate for all transactions, or

  your transaction and taxable currencies are the same (use rate = 1)
- You can get your transaction data in the required format

### Requires more work if:
- You need specific exchange rates for each transaction date
- Your exchange isn't supported by the converter tool
- You need to manually convert your transaction data

### Requires programming skills if:
- You need to create your own converter for an unsupported exchange
- You need to automate exchange rate lookups for specific dates

## Fifo-calc crypto suite

`fifo-calc` is part of a "crypto suite", consisting of the following tools:

| Tool                                                                      | Description                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [fifo-calc](https://github.com/Byskov-Soft/fifo-calc)                     | Creates FIFO reports based on buy and sell transactions to be used for reporting capital gains.                  |
| [fifo-calc-converter](https://github.com/Byskov-Soft/fifo-calc-converter) | Converts transaction (CSV) files from various crypto exchanges, to a format that can be imported by `fifo-calc`. |
| [fifo-calc-rates](https://github.com/Byskov-Soft/fifo-calc-rates)         | Creates currency rate files to be used with `fifo-calc-converter`.                                               |

Here's how the tools work together:

1. **fifo-calc-rates** creates a JSON file of daily conversion rates for a full year.
   - It currently supports USD to EUR.
2. **fifo-calc-converter** converts exchange records using:
   - A fixed conversion rate, or
   - A rate list (from `fifo-calc-rates` or manually created) having a rate for each day in the year
   to convert exchange-specific CSV files into fifo-calc compatible format
3. **fifo-calc** imports either:
   - The converted files from fifo-calc-converter, or
   - Manually created records

You can use these tools independently or as part of a complete workflow, depending on your needs.

**Note:** When we talk about rates we are referring to the `tcur_conversion_rate` column of the input records imported by `fifo-calc`. See [Importing overview](#importing-overview) section for details.

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

1. **Import transactions** from a CSV file
   - Transactions are saved to a JSON file DB located at `<HOME>/.fifo-calc/fifo.db.json`
   - Please read the **MUST READ** note below
   - [Learn more about importing transactions](./docs/IMPORTING.md)
   - Example:

     ```
     fifo-calc import --exchange Binance --input ./binanceTransactions.csv
     ```

2. **Create FIFO reports** per symbol (BTC, ETH, etc.)
   - Reports are saved to a user defined or default output directory
   - [Learn more about creating reports](./docs/REPORTING.md)
   - Example:

     ```
     fifo-calc report --type fifo --currency EUR --symbol BTC --output-dir ./
     ```

**IMPORTANT - MUST READ**:

> The database is not meant for any long-term storage. The idea is that when it is time to report on
> capital gains for the past year, you will have a session where you import the relevant records,
> create the FIFO reports (one per symbol) and then empty the database.
>
> The database is not very efficient or safe, and keeping records spanning multiple years may result
> in very slow performance or cause other issues.
>
> We use a lightweight JSON-based database to keep the tool easy to use without requiring additional
> database software. While a more permanent database solution might be considered in the future, the
> current approach ensures a low barrier to entry for users.
>
> An save/restore feature is available (see
> [Database backup](./docs/COMMANDS.md#database-backup)). Use it for saving or restoring the
> database records. Alternatively, keep your original (pre-import) files. Either way is good.

# More Documentation

- [Importing transactions](docs/IMPORTING.md)
- [Creating FIFO reports](docs/REPORTING.md)
- [Fifo-calc command overview](docs/COMMANDS.md)
