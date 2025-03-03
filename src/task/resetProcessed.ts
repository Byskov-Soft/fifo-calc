import { Collection } from '@bysk/jsonfile-db'
import { getOptValue, setUsage, showUsageAndExit } from '../cmdOptions.ts'
import { COLLECTION, DB_FIFO } from '../model/common.ts'
import { Transaction, TRANSACTION_TYPE } from '../model/transaction.ts'
import { getDataBase, persistDatabases, restoreDatabases } from '../persistence/database.ts'

export const resetProcessed = async () => {
  if (getOptValue('help')) {
    setUsage({ option: `reset-processed  : reverses cleared transactions`, arguments: [] })
    showUsageAndExit({ exitWithError: false })
  }

  await restoreDatabases()
  const db = getDataBase(DB_FIFO)
  const collection = db.getCollection(COLLECTION.TRANSACTION)
  const newCollection = new Collection(COLLECTION.TRANSACTION)
  const existing = collection.getByAttribute([]).map((item) => Transaction.parse(item.object()))

  existing.forEach((record) => {
    const isBuy = record.type === TRANSACTION_TYPE.B

    const tx: Transaction = {
      ...record,
      taxcur_remaining_cost: isBuy ? record.taxcur_cost : -1,
      remaining_item_count: isBuy ? record.item_count : -1,
      cleared: false,
    }

    newCollection.createDocument(tx)
  })

  db.addOrReplaceCollection(COLLECTION.TRANSACTION, newCollection)
  return persistDatabases()
}
