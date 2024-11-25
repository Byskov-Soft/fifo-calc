import { parseAppOptions, setUsage, showUsageAndExit } from './src/cmdOptions.ts'
import type { Usage } from './src/model/common.ts'
import { reset } from './src/persistence/database.ts'
import { convertTasks } from './src/task/convert/index.ts'
import { importData } from './src/task/import/index.ts'
import { report } from './src/task/report/index.ts'

enum TASK {
  CONVERT = 'convert',
  IMPORT = 'import',
  REPORT = 'report',
  RESET = 'reset',
  HELP = 'help',
}

parseAppOptions()

if (!Deno.env.get('HOME')) {
  console.error('HOME environment variable not found')
  Deno.exit(1)
}

export const usage: Usage = {
  option: '(convert | import | report | reset) <options>',
  arguments: [],
}

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
