import { getOptValue, setUsage, showUsageAndExit } from '../../cmdOptions.ts'
import type { Usage } from '../../model/common.ts'
import { BACKUP_RESTORE_TYPE, restoreTransactions } from './restore.ts'
import { BACKUP_SAVE_TYPE, saveTransactions } from './save.ts'

export const usage: Usage = {
  option: 'backup',
  arguments: [
    `--type (${BACKUP_SAVE_TYPE} | ${BACKUP_RESTORE_TYPE})`,
  ],
}

export const backup = async () => {
  setUsage(usage)
  const reportType = getOptValue('type') || ''

  switch (reportType) {
    case BACKUP_SAVE_TYPE: {
      await saveTransactions()
      break
    }
    case BACKUP_RESTORE_TYPE: {
      await restoreTransactions()
      break
    }
    default: {
      showUsageAndExit({ exitWithError: getOptValue('help') === undefined })
    }
  }
}
