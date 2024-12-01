import { Collection } from '@bysk/jsonfile-db'
import { COLLECTION, DB_FIFO, Transaction } from '../../../model/index.ts'
import { getDataBase, persistDatabases } from '../../../persistence/index.ts'

export const persistProcessed = (processed: Transaction[]) => {
  const db = getDataBase(DB_FIFO)
  const collection = db.getCollection(COLLECTION.TRANSACTION)
  const newCollection = new Collection(COLLECTION.TRANSACTION, db)

  const processedById = processed.reduce((acc: { [id: string]: Transaction }, tx) => {
    acc[tx._id] = tx
    return acc
  }, {})

  const existing = collection.getByAttribute([]).map((item) => Transaction.parse(item.object()))

  existing.forEach((record) => {
    if (processedById[record._id]) {
      const rec = processedById[record._id]

      const tx: Transaction = {
        ...record,
        remaining_cost: rec.remaining_cost,
        remaining_item_count: rec.remaining_item_count,
        cleared: rec.cleared,
      }

      newCollection.createDocument(tx)
    } else {
      newCollection.createDocument(record)
    }
  })

  db.addOrReplaceCollection(COLLECTION.TRANSACTION, newCollection)
  return persistDatabases()
}
