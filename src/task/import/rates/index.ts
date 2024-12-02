import { getOptValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
import type { Usage } from '../../../model/common.ts'
import { createEcbEurUsdRates } from './ecb_eur_usd_xml_to_json.ts'

export const RATES_IMPORT_TYPE = 'rates'

enum SOURCE_TYPE {
  ECB_EUR = 'ecb-eur',
}

const ecbExample = [
  'Example: fifo-calc import --type rates --source ecb-eur --year 2024 --input ./eur-usd-rates.xml',
  '',
  '- Note that the second currency in any source should always be USD.',
  '- Run the command multiple times if you wan to create rates for multiple years.',
  '',
  'Sources:',
  '',
  '  ecb-eur:',
  '    European Central Bank EUR/USD rates. This source is an XML file.',
  '    Download the file from https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html\n',
].join('\n')

export const usage: Usage = {
  option: `import --type ${RATES_IMPORT_TYPE}`,
  arguments: [
    `--source ${SOURCE_TYPE.ECB_EUR}           : Source of the rates (currently only ECB EUR/USD)`, // Dont remove gap
    '--year   <year>            : Year for which the rates are being imported',
    '--input  <input-file-path> : An input file matching the specified source',
  ],
}

export const importRates = async () => {
  setUsage(usage)
  const source = getOptValue('source')
  const year = getOptValue('year')
  const xmlFilePath = getOptValue('input')

  switch (source) {
    case SOURCE_TYPE.ECB_EUR: {
      await createEcbEurUsdRates(xmlFilePath, year)
      break
    }
    default: {
      showUsageAndExit({
        extras: [
          `Invalid source "${source}"`,
          `Supported sources: ${SOURCE_TYPE.ECB_EUR}\n`,
          ecbExample,
        ].join('\n'),
        exitWithError: true,
      })
    }
  }
}
