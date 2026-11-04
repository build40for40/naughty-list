import original from '../worker/companies.js';

const company = (id, name, aliases, sourceUrl) => ({
  id, name, aliases, identifiers: [], domains: [],
  identityEvidence: { sourceUrl, checkedAt: '2026-11-04' }
});
export default [
  ...original,
  {
    id: 'hm', name: 'H&M', aliases: [], identifiers: [],
    domains: ['hm.com', 'www.hm.com', 'www2.hm.com'],
    identityEvidence: { sourceUrl: 'https://hmgroup.com/brands/hm/', checkedAt: '2026-11-04' },
    domainEvidence: { sourceUrl: 'https://hmgroup.com/brands/hm/', checkedAt: '2026-11-04' }
  },
  company('asos', 'ASOS', ['ASOS.com Limited'], 'https://www.gov.uk/cma-cases/asos-boohoo-and-asda-greenwashing-investigation'),
  company('boohoo', 'Boohoo', [], 'https://www.gov.uk/cma-cases/asos-boohoo-and-asda-greenwashing-investigation'),
  company('george-at-asda', 'George at Asda', [], 'https://www.gov.uk/cma-cases/asos-boohoo-and-asda-greenwashing-investigation'),
  company('amazon', 'Amazon', [], 'https://www.gov.uk/cma-cases/investigation-into-amazons-marketplace'),
  company('apple', 'Apple', ['Apple Inc', 'Apple Inc.'], 'https://www.gov.uk/cma-cases/apple-iphones-consumer-protection-case'),
  company('wowcher', 'Wowcher', ['Wowcher Limited'], 'https://www.gov.uk/cma-cases/wowcher-group-consumer-protection-case'),
  company('simba', 'Simba Sleep', ['Simba', 'Simba Sleep Limited'], 'https://www.gov.uk/cma-cases/simba-sleep-limited-consumer-protection-case'),
  company('b-and-q', 'B&Q', ['B&Q LIMITED'], 'https://www.gov.uk/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage'),
  company('forest-holidays', 'Forest Holidays', ['FOREST HOLIDAYS LIMITED'], 'https://www.gov.uk/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage'),
  company('five-guys-uk', 'Five Guys JV Limited', [], 'https://www.gov.uk/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage'),
  company('merlin-cinemas', 'Merlin Cinemas', ['Merlin Cinemas Limited'], 'https://www.gov.uk/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage'),
  company('sony-playstation', 'Sony PlayStation', ['PlayStation'], 'https://www.gov.uk/cma-cases/online-console-video-gaming'),
  company('nintendo', 'Nintendo', [], 'https://www.gov.uk/cma-cases/online-console-video-gaming'),
  company('microsoft-xbox', 'Microsoft Xbox', ['Xbox'], 'https://www.gov.uk/cma-cases/online-console-video-gaming'),
  company('samworth-brothers', 'Samworth Brothers Limited', ['Samworth Brothers', 'Samworth Brothers Ltd'], 'https://press.hse.gov.uk/2026/09/16/food-manufacturing-giant-fined-594000-after-two-workers-scalded-at-melton-mowbray-site/'),
  company('david-wood-baking', 'David Wood Baking Limited', ['David Wood Baking'], 'https://press.hse.gov.uk/2026/09/04/baked-goods-company-fined-333333-after-worker-suffers-broken-arm/'),
  company('amazon-services-us', 'Amazon Services LLC', ['Amazon Services, LLC'], 'https://www.epa.gov/enforcement/amazon-services-llc-fifra-settlement'),
  company('ebay-us', 'eBay Inc.', ['eBay Inc'], 'https://www.epa.gov/newsreleases/epa-orders-amazon-and-ebay-stop-sale-certain-pesticide-products')
];

// Exact hostnames reviewed on 4 November 2026 using the brand's own website.
// These identify the named business/service, never its marketplace sellers.
export const reviewedWebsites = {
  'asos': 'www.asos.com', 'boohoo': 'www.boohoo.com', 'amazon': 'www.amazon.co.uk',
  'apple': 'www.apple.com', 'simba': 'simbasleep.com', 'forest-holidays': 'www.forestholidays.co.uk',
  'sony-playstation': 'www.playstation.com', 'nintendo': 'www.nintendo.com', 'microsoft-xbox': 'www.xbox.com'
};
