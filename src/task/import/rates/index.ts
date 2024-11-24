import { getArgValue, setUsage, showUsageAndExit } from '../../../cmdOptions.ts'
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
    '- Run the command multiple time if you wan to create rates for multiple years.',
    '',
    'Sources:',
    '',
    '  ecb-eur-usd:',
    '    European Central Bank EUR/USD rates. This source is an XML file.',
    '    Download the file from https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html\n',
].join('\n')

export const usage: Usage = {
    option: `import --type ${RATES_IMPORT_TYPE}`,
    arguments: [
        `--source ${SOURCE_TYPE.ECB_EUR} (only source available)`,
        '--year <year>',
        '--input <input-file-path>',
    ],
}

export const importRates = async () => {
    setUsage(usage)
    const source = getArgValue('source')
    const year = getArgValue('year')
    const xmlFilePath = getArgValue('input')

    if (!source || !year || !xmlFilePath) {
        showUsageAndExit({ exitWithError: true, extras: ecbExample })
    }

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
