import { Database } from '@bysk/jsonfile-db'
import { getOptValue, setUsage, showUsageAndExit } from '../cmdOptions.ts'
import { dbFileExtension, fifoCalcDir, getDatabaseFilePath } from '../config.ts'
import type { DatabaseMap } from '../model/common.ts'

const databases: DatabaseMap = {}

export const getDatabaseFileNames = async () => {
  const files: string[] = []

  for await (const f of Deno.readDir(fifoCalcDir)) {
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
      persistCount++
      return db.persist(getDatabaseFilePath(dbName))
    }),
  )

  return persistCount
}

export const restoreDatabase = async (
  name: string,
  createIfNotExists = false,
): Promise<Database> => {
  const path = getDatabaseFilePath(name)

  try {
    const fileInfo = await Deno.stat(path)

    if (!fileInfo.isFile) {
      throw new Error(`Path ${path} is not a file`)
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      if (createIfNotExists) {
        const db = new Database()
        databases[name] = db
        return db
      }

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
  if (getOptValue('help')) {
    setUsage({ option: `reset  : Clears the database`, arguments: [] })
    showUsageAndExit({ exitWithError: false })
  }

  console.log(`\nRemoving all databases...\n`)
  const fileNames = await getDatabaseFileNames()

  await Promise.all(fileNames.map((fileName) => {
    const filePath = `${fifoCalcDir}/${fileName}`

    if (filePath.endsWith(dbFileExtension)) {
      console.log(`Removing ${filePath} ...\n`)
      return Deno.remove(filePath)
    }
  }))
}
