import { Database } from '@bysk/jsonfile-db'
import { dbFileExtension, fifoCalcDbDir, getDatabaseFilePath } from '../config.ts'
import type { DatabaseMap } from '../model/common.ts'

const databases: DatabaseMap = {}

export const getDatabaseFileNames = async () => {
  const files: string[] = []

  for await (const f of Deno.readDir(fifoCalcDbDir)) {
    if (f.isFile && f.name.endsWith(dbFileExtension)) {
      files.push(f.name)
    }
  }

  return files
}

export const getDataBase = (dbName: string) => {
  if (!databases[dbName]) {
    throw new Error(`Database ${dbName} not found`)
  }

  return databases[dbName]
}

export const addDocument = (
  dbName: string,
  collectionName: string,
  document: Record<string, unknown>,
  id: string,
) => {
  if (!databases[dbName]) {
    databases[dbName] = new Database()
  }

  const db = databases[dbName]
  const collection = db.collection(collectionName)
  collection.createDocument({ ...document, _id: id })
}

export const persistDatabases = async () => {
  let persistCount = 0

  await Promise.all(
    Object.entries(databases).map(([dbName, db]) => {
      db.persist(getDatabaseFilePath(dbName))
      persistCount++
    }),
  )

  return persistCount
}

export const restoreDatabase = async (name: string): Promise<Database> => {
  const path = getDatabaseFilePath(name)

  try {
    const fileInfo = await Deno.stat(path)

    if (!fileInfo.isFile) {
      throw new Error(`Path ${path} is not a file`)
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(
        `Database for ${name} not found. Make sure to import USD transactions first.`,
      )
    } else {
      throw error
    }
  }

  const db = new Database()
  await db.restore(path)
  databases[name] = db
  return db
}

export const restoreDatabases = async () => {
  const fileNames = await getDatabaseFileNames()

  await Promise.all(fileNames.map((fileName) => {
    const name = fileName.split('.')[0]
    return restoreDatabase(name)
  }))
}

export const reset = async () => {
  console.log(`Removing all databases...`)
  const fileNames = await getDatabaseFileNames()

  await Promise.all(fileNames.map((fileName) => {
    const filePath = `${fifoCalcDbDir}/${fileName}`

    if (filePath.endsWith(dbFileExtension)) {
      console.log(`Removing ${filePath} ...`)
      return Deno.remove(filePath)
    }
  }))
}
