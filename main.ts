import { getArgAt, parseAppOptions, setUsage, showUsageAndExit } from './src/cmdOptions.ts'
import { fifoCalcDir } from './src/config.ts'
import type { Usage } from './src/model/common.ts'
import { reset } from './src/persistence/database.ts'
import { backup } from './src/task/backup/index.ts'
import { convertTasks } from './src/task/convert/index.ts'
import { importData } from './src/task/import/index.ts'
import { report } from './src/task/report/index.ts'
import { resetProcessed } from './src/task/resetProcessed.ts'
import { createDirectory } from './src/util/file.ts'

enum TASK {
  CONVERT = 'convert',
  IMPORT = 'import',
  REPORT = 'report',
  BACKUP = 'backup',
  RESET_PROCESSED = 'reset-processed',
  RESET = 'reset',
  HELP = 'help',
}

const usage: Usage = {
  option: '(convert | import | report | backup | reset-processed | reset) <options>',
  arguments: [],
}

parseAppOptions()

if (!Deno.env.get('HOME')) {
  console.error('HOME environment variable not found')
  Deno.exit(1)
}

await createDirectory({
  dirPath: fifoCalcDir,
  creationMessage: 'Created fifo-calc home directory at',
  printDirPath: true,
})

setUsage(usage)

switch (getArgAt(0)) {
  case TASK.CONVERT: {
    await convertTasks()
    break
  }
  case TASK.IMPORT: {
    await importData()
    break
  }
  case TASK.REPORT: {
    await report()
    break
  }
  case TASK.BACKUP: {
    await backup()
    break
  }
  case TASK.RESET_PROCESSED: {
    await resetProcessed()
    break
  }
  case TASK.RESET: {
    await reset()
    break
  }
  case TASK.HELP: {
    showUsageAndExit({ exitWithError: false })
    break
  }
  default: {
    showUsageAndExit()
  }
}
