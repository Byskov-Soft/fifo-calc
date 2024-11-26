import { Database } from '@bysk/jsonfile-db'
import type { DatabaseMap } from '../model/common.ts'
import { createDirectory } from '../util/file.ts'

export const dbFileExtension = '.db.json'
const dbDir = `${Deno.env.get('HOME')}/FIFOCalc/.data`
const databases: DatabaseMap = {}

export const getDatabasePath = () => dbDir

export const getDatabaseFilePath = (dbName: string) => {
  return `${dbDir}/${dbName}${dbFileExtension}`
}

export const getDatabaseFileNames = async () => {
  const files: string[] = []

  for await (const f of Deno.readDir(dbDir)) {
    if (f.isFile && f.name.endsWith(dbFileExtension)) {
      files.push(f.name)
    }
  }

  return files
}

export const createDbDir = async () => {
  return await createDirectory({
    dirPath: dbDir,
    creationMessage: `Created fifo-calc database directory at`,
    printDirPath: true,
  })
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
  id?: string,
) => {
  if (!databases[dbName]) {
    databases[dbName] = new Database()
  }

  const db = databases[dbName]
  const collection = db.collection(collectionName)
  collection.createDocument({ ...document, _id: id || undefined })
}

export const persistDatabases = async () => {
  await createDbDir()
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
  console.log(`Restoring database ${name}...`)

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
    const filePath = `${dbDir}/${fileName}`

    if (filePath.endsWith(dbFileExtension)) {
      console.log(`Removing ${filePath} ...`)
      return Deno.remove(filePath)
    }
  }))
}
