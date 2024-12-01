import { getFifoMismatchFilePath } from '../../../config.ts'
import type { Transaction } from '../../../model/index.ts'

const message = [
  '',
  'Some sell transactions were only partially or not at all matched with buy',
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
  'The following sell transactions are excluded from the report:',
  '',
].join('\n')

export const reportMismatches = (
  mismatches: Transaction[],
  symbol: string,
  fileId: string,
) => {
  if (mismatches.length === 0) {
    return
  }

  // Output to console
  console.log(
    `\n${mismatches.length} sell transactions were not matched with buy transactions. See details from`,
  )

  const mismatchFile = getFifoMismatchFilePath(symbol, fileId)
  console.log(`${mismatchFile}\n`)

  // Output to mismatch file
  const info: string[] = [message]

  mismatches.forEach((transaction) => {
    info.push(JSON.stringify(transaction, null, 2))
  })

  return Deno.writeTextFile(mismatchFile, info.join('\n') + '\n')
}
