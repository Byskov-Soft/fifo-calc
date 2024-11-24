import { reset } from './src/persistence/database.ts'
import { convert, convertTasks } from './src/task/convert/index.ts'
import { importData, importTasks } from './src/task/import/index.ts'
import { report, reportTasks } from './src/task/report/index.ts'

enum TASK {
    CONVERT = 'convert',
    IMPORT = 'import',
    REPORT = 'report',
    RESET = 'reset',
    HELP = 'help',
}

const fifoUsage = [
    'fifo-calc <task> <options>',
    '',
    'Tasks:',
    ...Object.values(convertTasks).map((task) => `  ${task}`),
    ...Object.values(importTasks).map((task) => `  ${task}`),
    ...Object.values(reportTasks).map((task) => `  ${task}`),
    '  reset',
].join('\n')

if (!Deno.env.get('HOME')) {
    console.error('HOME environment variable not found')
    Deno.exit(1)
}

switch (Deno.args[0]) {
    case TASK.CONVERT: {
        await convert()
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
        console.log(`\n${fifoUsage}\n`)
        break
    }
    default:
        console.error('\nInvalid task')
        console.log(`Usage: ${fifoUsage}\n`)
}
