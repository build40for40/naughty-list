import mappings from '../data/wikirate-mappings.js';

export const WIKIRATE_METRIC_ID = 13660491;
const base = 'https://data.wikirate.org/rest/v1';
const licence = 'https://creativecommons.org/licenses/by/4.0/';

export const hasWikirateMappings = () => mappings.length > 0;
export const wikirateCompanyIds = () => mappings.map(mapping => {
  if (!Number.isSafeInteger(mapping.providerCompanyId) || mapping.providerCompanyId <= 0) throw new Error('Wikirate identity mapping requires review');
  return mapping.providerCompanyId;
});

export function wikirateHeaders(credentials) {
  if (!credentials?.WIKIRATE_PUBLISHABLE_KEY || !credentials?.WIKIRATE_API_TOKEN) throw new Error('Wikirate credentials required');
  return { apikey: credentials.WIKIRATE_PUBLISHABLE_KEY, 'x-api-token': credentials.WIKIRATE_API_TOKEN, 'Accept-Profile': 'api' };
}

export async function wikirateAnswers(request, companyIds = []) {
  if (!companyIds.every(id => Number.isSafeInteger(id) && id > 0)) throw new Error('Wikirate identity mapping requires review');
  const filter = companyIds.length ? `&company_id=in.(${companyIds.join(',')})` : '';
  const rows = [];
  // Stable pagination and a hard cap prevent accidental unbounded imports.
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = await request(`${base}/v1_answers?metric_id=eq.${WIKIRATE_METRIC_ID}${filter}&order=id&limit=1000&offset=${offset}`);
    if (!Array.isArray(page) || page.length > 1000) throw new Error('Wikirate source schema changed');
    rows.push(...page);
    if (page.length < 1000) {
      if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Wikirate duplicate answers require review');
      return rows;
    }
  }
  throw new Error('Wikirate pagination limit requires review');
}

export function wikirateRecords(answers, registry, { now = new Date(), approvedMappings = mappings } = {}) {
  const records = [];
  const providerIds = new Set();
  const companyIds = new Set();
  for (const mapping of approvedMappings) {
    const company = registry.find(company => company.id === mapping.companyId);
    if (!company || !Number.isSafeInteger(mapping.providerCompanyId) || mapping.providerCompanyId <= 0
      || providerIds.has(mapping.providerCompanyId) || companyIds.has(mapping.companyId)
      || !/^https:\/\/wikirate\.org\//.test(mapping.sourceUrl) || !Number.isFinite(Date.parse(mapping.checkedAt))) {
      throw new Error('Wikirate identity mapping requires review');
    }
    providerIds.add(mapping.providerCompanyId); companyIds.add(mapping.companyId);
    const candidates = answers.filter(answer => answer.company_id === mapping.providerCompanyId);
    if (!candidates.length) throw new Error('Wikirate mapped company disappeared; requires review');
    if (candidates.some(answer => !Number.isSafeInteger(answer.year) || answer.year < 1900 || answer.year > now.getUTCFullYear())) {
      throw new Error('Wikirate observation year requires review');
    }
    const year = Math.max(...candidates.map(answer => answer.year));
    const latest = candidates.filter(answer => answer.year === year);
    const values = new Set(latest.map(answer => answer.value));
    if (values.size !== 1) throw new Error('Wikirate conflicting latest answers require review');
    const answer = latest.sort((a, b) => b.id - a.id)[0];
    if (answer.metric_id !== WIKIRATE_METRIC_ID || !Number.isSafeInteger(answer.id) || typeof answer.company !== 'string' || !answer.company.trim()
      || !['Certified', 'De-certified'].includes(answer.value)
      || answer.license?.reference_url?.replace(/\/$/, '') !== licence.replace(/\/$/, '')
      || !Array.isArray(answer.sources) || !answer.sources.some(source => /^https:\/\//.test(source.original_url ?? ''))
      || !Number.isFinite(Date.parse(answer.updated_at))) throw new Error('Wikirate evidence or licence requires review');
    const sourceRecordId = `${WIKIRATE_METRIC_ID}:${mapping.providerCompanyId}`;
    records.push({
      id: `wikirate-bcorp:${sourceRecordId}`, sourceId: 'wikirate-bcorp', sourceRecordId,
      companyId: company.id, assessedEntity: answer.company, scope: 'company', publicationStatus: 'published',
      kind: 'certification_report', outcome: answer.value === 'Certified' ? 'reported_certified' : 'reported_decertified',
      dimensions: ['certification'], title: 'Wikirate B Corp certification status report',
      summary: `Wikirate reports ${answer.company} as ${answer.value} for ${year}. This is a dated secondary-source report, not a live B Lab certification check.`,
      sourceUrl: `https://wikirate.org/~${answer.id}`, checkedAt: now.toISOString(),
      refreshDueAt: new Date(+now + 7 * 86400000).toISOString(), eventDate: null, publishedAt: null,
      facts: { providerCompanyId: mapping.providerCompanyId, metricId: WIKIRATE_METRIC_ID,
        answerId: answer.id, reportingYear: year, reportedCertified: answer.value === 'Certified',
        reportedStatus: answer.value, providerUpdatedAt: answer.updated_at,
        // Updating a database entry is not evidence of recertification.
        attribution: 'Wikirate; metric designer: B Lab', licence,
        supportingSourceUrls: answer.sources.map(source => source.original_url).filter(url => /^https:\/\//.test(url ?? '')),
        archivedSourceUrls: answer.sources.map(source => source.file_url).filter(url => /^https:\/\//.test(url ?? '')),
        identityEvidence: { sourceUrl: mapping.sourceUrl, checkedAt: mapping.checkedAt } }
    });
  }
  return records;
}

export async function auditWikirate(request, registry) {
  const answers = await wikirateAnswers(request);
  const years = {};
  const values = {};
  const licences = {};
  for (const row of answers) {
    years[row.year] = (years[row.year] ?? 0) + 1;
    values[row.value] = (values[row.value] ?? 0) + 1;
    const key = row.license?.reference_url ?? 'missing';
    licences[key] = (licences[key] ?? 0) + 1;
  }
  const normalise = value => String(value).normalize('NFKC').trim().toLowerCase();
  const candidates = registry.flatMap(company => {
    const names = [company.name, ...company.aliases].map(normalise);
    return [...new Set(answers.filter(answer => names.includes(normalise(answer.company))).map(answer => answer.company_id))]
      .map(providerCompanyId => ({ companyId: company.id, providerCompanyId, status: 'requires_identity_review' }));
  });
  const ids = [...new Set(candidates.map(candidate => candidate.providerCompanyId))];
  const companies = ids.length ? await request(`${base}/v1_companies?id=in.(${ids.join(',')})&select=id,name,website,company_identifiers&order=id&limit=1000`) : [];
  if (!Array.isArray(companies)) throw new Error('Wikirate source schema changed');
  return { metricId: WIKIRATE_METRIC_ID, answers: answers.length,
    companies: new Set(answers.map(answer => answer.company_id)).size, years, values, licences,
    candidates: candidates.map(candidate => ({ ...candidate, provider: companies.find(company => company.id === candidate.providerCompanyId) ?? null })) };
}
