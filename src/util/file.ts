import { format } from 'date-fns'
import { fifoCalcReportDir } from '../model/common.ts'

const ReportPrefixFormat = 'yyyy-MM-dd_HH-mm-ss'

const getPrefix = () => format(new Date(), ReportPrefixFormat)

interface CreateDirectoryOptions {
  dirPath: string
  creationMessage?: string
  printDirPath?: boolean
}

export const createDirectory = async (opts: CreateDirectoryOptions) => {
  try {
    const dirInfo = await Deno.stat(opts.dirPath)

    if (!dirInfo.isDirectory) {
      throw new Error(`Found path "${opts.dirPath}", but it is not a directory`)
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(opts.dirPath, { recursive: true })

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

export const createMultiFileReportDir = async (): Promise<{ dir: string; prefix: string }> => {
  const prefix = getPrefix()
  const dir = [fifoCalcReportDir, prefix].join('/')

  await createDirectory({
    dirPath: dir,
    creationMessage: '\nCreated FIFO report directory',
    printDirPath: true,
  })

  return { dir, prefix }
}

export const getReportFilename = (id: string, extension: string) =>
  `${getPrefix()}_${id}.${extension}`
