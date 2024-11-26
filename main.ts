import { parseAppOptions, setUsage, showUsageAndExit } from './src/cmdOptions.ts'
import { fifoCalcDir, fifoCalcReportDir, type Usage } from './src/model/common.ts'
import { createDbDir, reset } from './src/persistence/database.ts'
import { convertTasks } from './src/task/convert/index.ts'
import { importData } from './src/task/import/index.ts'
import { report } from './src/task/report/index.ts'
import { createDirectory } from './src/util/file.ts'

enum TASK {
  CONVERT = 'convert',
  IMPORT = 'import',
  REPORT = 'report',
  RESET = 'reset',
  HELP = 'help',
}

const usage: Usage = {
  option: '(convert | import | report | reset) <options>',
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

await createDirectory({
  dirPath: fifoCalcReportDir,
  creationMessage: 'Created fifo-calc report directory at',
  printDirPath: true,
})

await createDbDir()

setUsage(usage)

switch (Deno.args[0]) {
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
  case TASK.RESET: {
    await reset()
    break
  }
  case TASK.HELP: {
    break
  }
  default: {
    showUsageAndExit()
  }
}
