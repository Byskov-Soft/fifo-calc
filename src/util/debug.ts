import { hasOption } from '../cmdOptions.ts'

export const debug = (args: string | string[]) => {
  if (hasOption('debug')) {
    const message = Array.isArray(args) ? args.join('\n') : args
    console.log(`${message}`)
  }
}
