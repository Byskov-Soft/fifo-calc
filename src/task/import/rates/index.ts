import type { Year } from '../../../model/common.ts'
import { createEcbEurUsdRates } from './ecb_eur_usd_xml_to_json.ts'

enum SOURCE_TYPE {
    ECB_EUR = 'ecb-eur',
}

// const ecbExample = [
//     '',
//     'Example: fifo-calc import rates eur ecb-eur-usd 2024 ./eur-usd-rates.xml',
//     '',
//     'Run the command multiple time if you wan to create rates for multiple years.',
//     '',
//     'Sources:',
//     '',
//     '  ecb-eur-usd:',
//     '    European Central Bank EUR/USD rates. This source is an XML file.',
//     '    Download the file from https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html',
// ].join('\n')

export const importRates = async (
    source: string,
    year: Year,
    xmlFilePath: string,
) => {
    switch (source) {
        case SOURCE_TYPE.ECB_EUR: {
            await createEcbEurUsdRates(xmlFilePath, year)
            break
        }
        default: {
            console.error(`\nInvalid source "${source}"\n`)
            console.log(`Valid sources: ${Object.values(SOURCE_TYPE).join(', ')}\n`)
            Deno.exit(1)
        }
    }
}
