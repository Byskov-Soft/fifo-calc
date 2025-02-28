import {
  getArgAt,
  getOptValue,
  parseAppOptions,
  setUsage,
  showUsageAndExit,
} from './src/cmdOptions.ts'
import { fifoCalcDir } from './src/config.ts'
import type { Usage } from './src/model/common.ts'
import { reset } from './src/persistence/database.ts'
import { backup } from './src/task/backup/index.ts'
import { importTransactions } from './src/task/import/index.ts'
import { report } from './src/task/report/index.ts'
import { resetProcessed } from './src/task/resetProcessed.ts'
import { createDirectory } from './src/util/file.ts'

enum TASK {
  IMPORT = 'import',
  REPORT = 'report',
  BACKUP = 'backup',
  RESET_PROCESSED = 'reset-processed',
  RESET = 'reset',
}

const usage: Usage = {
  option: '(import | report | backup | reset-processed | reset)',
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
  case TASK.IMPORT: {
    await importTransactions()
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
  default: {
    showUsageAndExit({ exitWithError: getOptValue('help') === undefined })
  }
}
