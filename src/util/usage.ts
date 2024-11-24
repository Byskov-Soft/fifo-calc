export const showUsageAndExit = (options: string, exitWithError = true) => {
    const message = `Usage: fifo-calc ${options}\n`

    if (exitWithError) {
        console.error(message)
    } else {
        console.log(message)
    }

    Deno.exit(exitWithError ? 1 : 0)
}
