# Exchange Data Files

## Bybit

### Spot Trade History - Unified account

- Example file name:

  `Bybit-Spot-OrderHistory-1731880800-1732571999.csv`

- Site location:

  `Orders -> Unified Trading Order -> Unified Trading Account -> Spot Orders -> Order History`

- Example data:

  ```
  Spot Pairs,Order Type,Direction,Filled Value,Filled Price,Filled Quantity,Fees,Transaction ID,Order No.,Timestamp (UTC)
  ICPUSDT,MARKET,SELL,49.97342400000000000000,9.32340000000000000000,5.36000000000000000000,0.04997342400000000000,2200000000355489633, 53982208,14:35 2024-11-16
  ICPUSDT,LIMIT,BUY,80.20300000000000000000,8.02030000000000000000,10.00000000000000000000,0.01000000000000000000,2200000000351556764, 87307520,03:18 2024-11-15
  ```

### Spot Trade History - Pre-unified account

- Example file name:

  `Bybit-Spot-TradeHistory-2024-06-30-2024-10-31.xls`

  (export the XLS file to CSV before using it with the fifo-calc converter)

- Site location:

  `Orders -> Unified Trading Order -> Unified Trading Account -> Spot (Pre-UTA) -> Order History`

- Example data
  ```
  Filled Time (Local Time),Spot Pairs,Order Type,Direction,Filled Value,Filled Price,Filled Quantity,Fees,Transaction ID,Order No.,Timestamp (UTC)
  2024-09-27 23:52:04,NEIRO/USDT,Market,Sell,99.687126000000000000 USDT,0.088900000000000000 USDT,1121.340000000000000000 NEIRO,0.199374252000000000 USDT,67006208,50228992,2024-09-27 21:52:04
  2024-09-27 23:02:35,NEIRO/USDT,Market,Buy,99.999510000000000000 USDT,0.089000000000000000 USDT,1123.590000000000000000 NEIRO,2.247180000000000000 NEIRO,98282240,89893632,2024-09-27 21:02:35
  ```
