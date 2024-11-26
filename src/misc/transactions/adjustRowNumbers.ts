import { Collection } from '@bysk/jsonfile-db'
import { COLLECTION } from '../../model/common.ts'
import { Transaction, TRANSACTION_TYPE } from '../../model/transaction.ts'
import { persistDatabases } from '../../persistence/database.ts'
import { getDataBase } from '../../persistence/index.ts'
import { generateUUID } from '../../util/uuid.ts'

/*
  This function adjusts the row numbers of transactions based on the sorted order.
  The row number is assigned based on the date and type ('buy' before 'sell').
  The row number starts from 0 and increments by 1 for each record.

  Example input records:

  [
    { date: '2024-11-25T00:11:11.000Z', type: 'S', row_num: 0 },
    { date: '2024-11-26T00:00:00.000Z', type: 'S', row_num: 0 },
    { date: '2024-11-26T00:00:00.000Z', type: 'B', row_num: 0 },
    { date: '2024-11-26T00:00:00.000Z', type: 'S', row_num: 0 },
    { date: '2024-11-26T00:00:01.000Z', type: 'B', row_num: 0 },
    { date: '2024-11-26T00:55:55.000Z', type: 'B', row_num: 0 },
  ]

  After sorting and assigning row numbers:

  [
    { date: '2024-11-25T00:11:11.000Z', type: 'S', row_num: 0 },
    { date: '2024-11-26T00:00:00.000Z', type: 'B', row_num: 1 }, <-- 'buy' before 'sell'
    { date: '2024-11-26T00:00:00.000Z', type: 'S', row_num: 2 },
    { date: '2024-11-26T00:00:00.000Z', type: 'S', row_num: 3 },
    { date: '2024-11-26T00:00:01.000Z', type: 'B', row_num: 4 },
    { date: '2024-11-26T00:55:55.000Z', type: 'B', row_num: 5 },
  ]
 */

export function adjustRowNumbers(dbName: string): Promise<number> {
  const db = getDataBase(dbName)
  const collection = db.getCollection(COLLECTION.TRANSACTION)
  const transactions = collection.getByAttribute([]).map((t) => Transaction.parse(t.object()))

  // Sort records by date and type ('buy' before 'sell')
  const sortedRecords = transactions.sort((a, b) => {
    if (a.date === b.date) {
      return a.type === TRANSACTION_TYPE.B && b.type === TRANSACTION_TYPE.S ? -1 : 1
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Assign row_num based on the sorted order
  const updatedRecords = sortedRecords.map((record, index) => ({
    ...record,
    row_num: index, // Assign a unique row_num starting from 0
  }))

  const newCollection = new Collection(COLLECTION.TRANSACTION, db)

  updatedRecords.forEach((record) => {
    newCollection.createDocument({ ...record, _id: generateUUID() })
  })

  db.addOrReplaceCollection(COLLECTION.TRANSACTION, newCollection)
  return persistDatabases()
}
