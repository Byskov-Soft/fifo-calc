import { type Args, parseArgs } from '@std/cli/parse-args'
import type { Usage } from './model/common.ts'

let args: Args
let usageString: string = 'ERROR: Usage not set'

export const parseAppOptions = () => {
    args = parseArgs(Deno.args)
}

export const getArgValue = (option: string) => {
    if (!args) {
        throw new Error('parseAppArgs() must be called before getArg()')
    }

    return args[option]
}

export const hasOption = (option: string) => {
    if (!args) {
        throw new Error('parseAppArgs() must be called before getArg()')
    }

    return args._.includes(option)
}

export const setUsage = (usage: Usage) => {
    if (usage.arguments.length) {
        usageString = [
            `Usage: fifo-calc ${usage.option} <options>`,
            '',
            'Options:',
            ...usage.arguments.map((arg) => `  ${arg}\n`),
        ].join('\n')
    } else {
        usageString = `\nUsage: fifo-calc ${usage.option}\n`
    }
}

interface UsageParams {
    extras?: string | null
    exitWithError: boolean
}

export const showUsageAndExit = (params: UsageParams = { extras: null, exitWithError: true }) => {
    const { extras, exitWithError } = params
    console.log('---------------------------------')

    if (exitWithError) {
        console.error(`\nInvalid commandline options or arguments`)
    }

    console.log(usageString)

    if (extras) {
        console.log(extras)
    }

    console.log('---------------------------------')
    Deno.exit(exitWithError ? 1 : 0)
}
