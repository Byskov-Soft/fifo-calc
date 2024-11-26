import type { TransactionMismatch } from './common.ts'

const message = [
  '',
  'The sell transactions below were partially or not at all matched with buy',
  'transactions. To remedy the situation you need to import the missing transactions.',
  '',
  'Why did this happen?',
  'Maybe you have not imported all the transactions from the exchange or account.',
  '',
  'A typical reason is that the sold items were not bought on the same exchange',
  'or account. If that is the case, please obtain the missing transactions from',
  'where they were bought, then import and run the report again.',
  '',
  'Alternatively you can manually create and import one or more buy transactions.',
  'This is, however, not an encouragement to create fake transactions. You should',
  'always strive to have a complete and accurate transaction history.',
  '',
].join('\n')

export const reportMismatches = (
  mismatches: TransactionMismatch[],
  outDir: string,
  symbol: string,
  prefix: string,
) => {
  if (mismatches.length > 0) {
    console.log(
      `${mismatches.length} sell transactions were not fully matched with buy transactions`,
    )

    const mismatchFile = `${outDir}/mismatch_${symbol}.${prefix}.info`
    console.log(`See details from ${mismatchFile}\n`)
    const info: string[] = [message]

    mismatches.forEach((m) => {
      info.push(`${m.remaining} items were not matched with buy transactions`)
      info.push(JSON.stringify(m.transaction, null, 2), '\n')
    })

    return Deno.writeTextFile(mismatchFile, info.join('\n'))
  }
}
