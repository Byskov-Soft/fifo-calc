import { Database } from '@bysk/jsonfile-db'
import type { DatabaseMap } from './model/common.ts'

const databases: DatabaseMap = {}

export const getDatabasePath = () => {
    return `${Deno.env.get('HOME')}/.fifo-calc/data`
}

export const getDatabaseFilePath = (dbName: string) => {
    return `${getDatabasePath()}/${dbName}.json`
}

export const getDatabaseFileNames = async () => {
    const files: string[] = []

    for await (const f of Deno.readDir(getDatabasePath())) {
        if (f.isFile && f.name.endsWith('.json')) {
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
    const dbDir = getDatabasePath()

    try {
        const dirInfo = await Deno.stat(dbDir)

        if (!dirInfo.isDirectory) {
            throw new Error(`Path "${dbDir}" is not a directory`)
        }
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            await Deno.mkdir(dbDir, { recursive: true })
        } else {
            throw error
        }
    }

    await Promise.all(
        Object.entries(databases).map(([dbName, db]) => db.persist(getDatabaseFilePath(dbName))),
    )
}

export const restoreDatabase = async (year: string): Promise<Database> => {
    const path = `${getDatabasePath()}/${year}.json`

    try {
        const fileInfo = await Deno.stat(path)

        if (!fileInfo.isFile) {
            throw new Error(`Path ${path} is not a file`)
        }
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            throw new Error(
                `Database for ${year} not found. Make sure to import USD transactions first.`,
            )
        } else {
            throw error
        }
    }

    const db = new Database()
    await db.restore(path)
    databases[year] = db
    return db
}

export const restoreDatabases = async () => {
    const fileNames = await getDatabaseFileNames()

    await Promise.all(fileNames.map((fileName) => {
        const year = fileName.split('.')[0]
        return restoreDatabase(year)
    }))
}

export const reset = async () => {
    console.log(`Removing all databases...`)
    const fileNames = await getDatabaseFileNames()

    await Promise.all(fileNames.map((fileName) => {
        const filePath = `${getDatabasePath()}/${fileName}`
        console.log(`Removing ${filePath} ...`)
        return Deno.remove(filePath)
    }))
}
