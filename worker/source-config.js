const ogl = 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/';
export const sources = [
  { id: 'wikirate-bcorp', name: 'Wikirate B Corp certification reports', status: 'credentials_required', refreshDays: 7,
    licence: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Wikirate; metric designer: B Lab.',
    coverage: '2022 snapshot: 4,712 companies. One reviewed match in our registry: Tony\'s Chocolonely. Current import is limited to that reviewed provider ID.',
    limitation: 'Historical 2022 observations, not current certification checks. A fresh API fetch does not renew the observation year. Patagonia has no answer in this metric; missing records remain unknown.' },
  { id: 'b-lab', name: 'B Lab', status: 'manual', refreshDays: 30,
    licence: 'Reviewed factual certification records with links; no bulk B Lab data licence assumed.',
    attribution: 'B Lab directory', coverage: 'Two manually reviewed companies.',
    limitation: 'Not a complete directory; certification is not a product ethical verdict.' },
  { id: 'uk-minimum-wage', name: 'UK minimum wage naming scheme', status: 'automated', refreshDays: 7,
    licence: ogl, attribution: 'Contains public sector information licensed under the Open Government Licence v3.0.',
    coverage: 'Reviewed companies in selected naming rounds, not all UK employers.',
    limitation: 'Publication date is not the period of underpayment. No match does not establish compliance.' },
  { id: 'uk-cma', name: 'Competition and Markets Authority', status: 'automated', refreshDays: 7,
    licence: ogl, attribution: 'Contains public sector information licensed under the Open Government Licence v3.0.',
    coverage: 'Selected reviewed CMA cases and company associations.',
    limitation: 'An investigation or undertaking is not a conviction. Historical outcomes are not claims of current misconduct.' },
  { id: 'uk-hse', name: 'Health and Safety Executive', status: 'automated', refreshDays: 7,
    licence: ogl, attribution: 'Contains public sector information published by the Health and Safety Executive and licensed under the Open Government Licence.',
    coverage: 'Selected reviewed HSE prosecution announcements in Great Britain.',
    limitation: 'Not a complete conviction register. Cases may include several breaches of the same incident.' },
  { id: 'us-epa', name: 'US Environmental Protection Agency', status: 'manual', refreshDays: 30,
    licence: 'Authored factual summaries with primary-source links; no reproduction of third-party documents or images.', attribution: 'US Environmental Protection Agency.',
    coverage: 'Selected manually reviewed EPA enforcement announcements; no ECHO feed imported.',
    limitation: 'US legal entities remain distinct from other regional companies and marketplace sellers. Historical orders do not establish current misconduct.' },
  { id: 'uk-environment-agency', name: 'Environment Agency', status: 'blocked', refreshDays: 30,
    licence: 'Unresolved: dataset page lists OGL while API metadata lists a conditional licence.', attribution: 'Environment Agency',
    coverage: 'Not imported.', limitation: 'Publication blocked pending confirmation of the specific dataset licence.' },
  { id: 'wba', name: 'World Benchmarking Alliance', status: 'blocked', refreshDays: 365,
    licence: 'Specific download licence must be confirmed; official pages conflict.', attribution: 'World Benchmarking Alliance',
    coverage: 'Not imported.', limitation: 'No API credentials or approved CSV snapshot configured.' }
];

export const minimumWagePages = [
  '/government/news/over-500-companies-named-for-not-paying-minimum-wage',
  '/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage'
];

// Reviewed assertions, not inferred classifications. If a source removes the
// supporting text or changes case state, refresh fails and retains prior data.
export const cmaCases = [
  { path: '/cma-cases/online-console-video-gaming', subjects: ['sony-playstation'],
    eventDate: '2022-04-13', outcome: 'undertaking',
    guard: 'The CMA has secured an undertaking from Sony to put in place measures to protect their PlayStation Plus customers',
    summary: 'Sony gave an undertaking concerning inactive PlayStation Plus subscriptions. This historical undertaking is not a conviction.' },
  { path: '/cma-cases/online-console-video-gaming', subjects: ['nintendo'],
    eventDate: '2022-04-13', outcome: 'practice_changed',
    guard: 'Nintendo changed its business practices during the course of the investigation',
    summary: 'Nintendo changed Switch Online subscriptions so automatic renewal was no longer the default. The CMA closed the investigation; this is not a conviction.' },
  { path: '/cma-cases/online-console-video-gaming', subjects: ['microsoft-xbox'],
    eventDate: '2022-01-26', outcome: 'undertakings',
    guard: 'The CMA has secured undertakings from Microsoft Limited and Microsoft Ireland Operations Limited',
    summary: 'Microsoft companies gave undertakings to improve auto-renewing Xbox gaming subscriptions. This historical undertaking is not a conviction.' },
  { path: '/cma-cases/asos-boohoo-and-asda-greenwashing-investigation',
    subjects: ['asos', 'boohoo', 'george-at-asda'], eventDate: '2024-03-27', outcome: 'undertakings',
    guard: 'ASOS, Boohoo and George at Asda have signed formal agreements to use only accurate and clear green claims.',
    summary: 'ASOS, Boohoo and George at Asda signed undertakings concerning environmental claims. This is not a conviction.' },
  { path: '/cma-cases/investigation-into-amazons-marketplace', subjects: ['amazon'],
    eventDate: '2023-11-03', outcome: 'commitments',
    guard: 'decision to accept commitments from Amazon',
    summary: 'The CMA accepted commitments addressing competition concerns about Amazon Marketplace. This is not a finding that an individual seller or product acted unlawfully.' },
  { path: '/cma-cases/apple-iphones-consumer-protection-case', subjects: ['apple'],
    eventDate: '2019-05-22', outcome: 'undertaking',
    guard: 'Apple has formally agreed to improve the information it provides to people about the battery health of their phones',
    summary: 'Apple agreed to improve information about iPhone battery health and performance management software. Historical undertaking, not a conviction.' },
  { path: '/cma-cases/wowcher-group-consumer-protection-case', subjects: ['wowcher'],
    eventDate: '2024-07-15', outcome: 'undertakings',
    guard: 'have signed undertakings to change their online selling practices',
    summary: 'Wowcher companies signed undertakings about online selling practices, including urgency claims and VIP membership refunds. This is not a conviction.' },
  { path: '/cma-cases/simba-sleep-limited-consumer-protection-case', subjects: ['simba'],
    eventDate: '2026-09-22', outcome: 'revised_undertakings',
    guard: 'the CMA accepted minor revisions to the undertakings from Simba Sleep',
    summary: 'The CMA accepted revised Simba Sleep undertakings concerning online discount and urgency claims. This is not a conviction.' }
];

export const hsePosts = [
  { id: 8550, companyId: 'samworth-brothers', eventDate: '2026-09-04',
    url: 'https://press.hse.gov.uk/2026/09/16/food-manufacturing-giant-fined-594000-after-two-workers-scalded-at-melton-mowbray-site/',
    guards: ['Samworth Brothers Limited', 'pleaded guilty', 'fined £594,000'],
    title: 'Samworth Brothers fined following workplace scalding incident',
    summary: 'HSE reported that Samworth Brothers Limited pleaded guilty to a health and safety offence and was fined £594,000 on 4 September 2026. The assessed entity is the manufacturer, not an individual food product.',
    facts: { fineGBP: 594000 } },
  { id: 8512, companyId: 'david-wood-baking', eventDate: '2026-09-01',
    url: 'https://press.hse.gov.uk/2026/09/04/baked-goods-company-fined-333333-after-worker-suffers-broken-arm/',
    guards: ['David Wood Baking Limited', 'pleaded guilty', 'fined £333,333'],
    title: 'David Wood Baking fined following machinery injury',
    summary: 'HSE reported that David Wood Baking Limited pleaded guilty to a machinery safety offence and was fined £333,333 on 1 September 2026.',
    facts: { fineGBP: 333333, incidentDate: '2023-12-01' } }
];
