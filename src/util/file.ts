import { format } from 'date-fns'

const ReportIdFormat = 'yyyy-MM-dd_HH-mm-ss'

export const getFileId = () => format(new Date(), ReportIdFormat)

interface CreateDirectoryOptions {
  dirPath: string
  creationMessage?: string
  printDirPath?: boolean
}

export const createDirectory = async (opts: CreateDirectoryOptions, recursive = true) => {
  try {
    const dirInfo = await Deno.stat(opts.dirPath)

    if (!dirInfo.isDirectory) {
      throw new Error(`Found path "${opts.dirPath}", but it is not a directory`)
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(opts.dirPath, { recursive })

      if (opts.creationMessage) {
        console.log(opts.creationMessage)
      }

      if (opts.printDirPath) {
        console.log(opts.dirPath, '\n')
      }
    } else {
      Deno.exit(1)
    }
  }
}
