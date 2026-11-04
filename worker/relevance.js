import { normalizeDomain } from './assessment.js';

// Reviewed domain categories, not a classifier or a company-ownership guess.
// Entries describe exact hosts only. Shopping-page signals are evaluated locally
// by the extension; a category is not proof that every page sells something.
export const reviewedDomains = [
  { domains: ['hm.com', 'www.hm.com', 'www2.hm.com'], category: 'brand_shop', companyId: 'hm', sourceUrl: 'https://hmgroup.com/brands/hm/', checkedAt: '2026-11-04' },
  { domains: ['fatface.com', 'www.fatface.com'], category: 'brand_shop', companyId: 'fatface', sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/fat-face-limited/', checkedAt: '2026-11-04' },
  { domains: ['riverisland.com', 'www.riverisland.com'], category: 'retailer', companyId: 'river-island', sourceUrl: 'https://www.riverisland.com/useful-information/terms-and-conditions', checkedAt: '2026-11-04' },
  {
    domains: ['patagonia.com', 'www.patagonia.com'], category: 'brand_shop', companyId: 'patagonia',
    sourceUrl: 'https://www.patagonia.com/home/', checkedAt: '2026-11-04'
  },
  {
    domains: ['tonyschocolonely.com', 'www.tonyschocolonely.com', 'uk.tonyschocolonely.com', 'us.tonyschocolonely.com'],
    category: 'brand_shop', companyId: 'tonys-chocolonely',
    sourceUrl: 'https://tonyschocolonely.com/', checkedAt: '2026-11-04'
  },
  {
    domains: ['amazon.co.uk', 'www.amazon.co.uk'], category: 'marketplace', companyId: null,
    sourceUrl: 'https://www.aboutamazon.co.uk/news/small-businesses/selling-on-amazon', checkedAt: '2026-11-04'
  },
  {
    domains: ['argos.co.uk', 'www.argos.co.uk'], category: 'retailer', companyId: null,
    sourceUrl: 'https://corporate.sainsburys.co.uk/about-us/our-brands/', checkedAt: '2026-11-04'
  },
  {
    domains: ['wikipedia.org', 'www.wikipedia.org', 'en.wikipedia.org'], category: 'unrelated', companyId: null,
    sourceUrl: 'https://wikimediafoundation.org/what-we-do/wikimedia-projects/wikipedia/', checkedAt: '2026-11-04'
  }
];

export function domainRelevance(domain, assessment, registry = reviewedDomains) {
  const host = normalizeDomain(domain);
  const matches = registry.filter(record => record.domains.includes(host));
  if (matches.length !== 1) return {
    category: 'unknown', status: matches.length ? 'ambiguous' : 'unreviewed',
    eligibleForVerdict: false, reason: matches.length ? 'conflicting_domain_categories' : 'domain_not_reviewed', evidence: null
  };
  const record = matches[0];
  const eligible = record.category === 'brand_shop' && assessment?.match?.status === 'matched' &&
    assessment.match.method === 'reviewed_domain' && assessment.company?.id === record.companyId;
  return {
    category: record.category, status: 'reviewed', eligibleForVerdict: Boolean(eligible),
    eligibleForBusinessVerdict: ['brand_shop', 'retailer'].includes(record.category) && assessment?.match?.status === 'matched' && assessment.match.method === 'reviewed_domain' && assessment.company?.id === record.companyId,
    reason: eligible ? 'reviewed_brand_shop' : record.category === 'brand_shop' ? 'business_identity_unresolved' : 'not_a_reviewed_brand_shop',
    evidence: { sourceUrl: record.sourceUrl, checkedAt: record.checkedAt }
  };
}
