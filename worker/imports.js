import { normalize } from './assessment.js';
import { sources, cmaCases, minimumWagePages, hsePosts } from './source-config.js';
import { wikirateHeaders, wikirateAnswers, wikirateRecords, hasWikirateMappings, wikirateCompanyIds } from './wikirate.js';

export function plainText(html) {
  return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[n])
    .replace(/\s+/g, ' ').trim();
}

export async function fetchJson(url, fetcher = fetch, extraHeaders = {}) {
  const response = await fetcher(url, { headers: { Accept: 'application/json', ...extraHeaders }, signal: AbortSignal.timeout(20000), redirect: 'manual' });
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
  // Bound decoded input as well as time. Do not put upstream bodies in logs.
  const reader = response.body.getReader();
  let bytes = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 4000000) { await reader.cancel(); throw new Error('Source response exceeds 4 MB'); }
    chunks.push(value);
  }
  const data = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(data));
}

function baseRecord(sourceId, sourceRecordId, companyId, now) {
  const source = sources.find(s => s.id === sourceId);
  return {
    id: `${sourceId}:${sourceRecordId}:${companyId}`, sourceId, sourceRecordId, companyId,
    publicationStatus: 'published', scope: 'company',
    checkedAt: now.toISOString(), refreshDueAt: new Date(+now + source.refreshDays * 86400000).toISOString(),
    eventDate: null, publishedAt: null, facts: {}
  };
}

export function parseMinimumWage(document, path, registry, now) {
  if (!document.details?.body || !document.public_updated_at) throw new Error('Minimum wage source schema changed');
  const matches = [...document.details.body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => plainText(match[1]))
    .map(text => text.match(/^(?:\d+\.\s*)?(.+?),\s*.+?,\s*failed to pay £([\d,.]+) to ([\d,]+) workers?\./))
    .filter(Boolean);
  if (!matches.length) throw new Error('Minimum wage source has no recognisable naming entries');
  const records = [];
  for (const match of matches) {
    const [, legalName, amount, workers] = match;
    const companies = registry.filter(c => [c.name, ...c.aliases].some(name => normalize(name) === normalize(legalName)));
    // Name similarity or more than one matching entity never publishes evidence.
    if (companies.length !== 1) continue;
    const companyId = companies[0].id;
    records.push({ ...baseRecord('uk-minimum-wage', `${path}:${normalize(legalName)}`, companyId, now),
      kind: 'wage_underpayment', outcome: 'government_naming', dimensions: ['staff'],
      title: 'Named for minimum wage underpayment', sourceUrl: `https://www.gov.uk${path}`,
      assessedEntity: legalName, publishedAt: document.public_updated_at,
      summary: `${legalName} was named by the government for underpaying ${workers} workers by £${amount}. The naming publication states arrears were repaid; publication date is not the underpayment period.`,
      facts: { underpaymentGBP: Number(amount.replaceAll(',', '')), workersAffected: Number(workers.replaceAll(',', '')), underpaymentPeriod: null }
    });
  }
  return records;
}

export function parseCma(document, config, now) {
  if (document.document_type !== 'cma_case' || document.details?.metadata?.case_state !== 'closed'
    || !plainText(document.details.body).includes(config.guard)) throw new Error('CMA assertion requires review');
  return config.subjects.map(companyId => ({
    ...baseRecord('uk-cma', config.path, companyId, now),
    kind: 'consumer_enforcement', outcome: config.outcome, dimensions: ['consumer_practices'],
    title: document.title, sourceUrl: `https://www.gov.uk${config.path}`,
    assessedEntity: companyId, summary: config.summary,
    eventDate: config.eventDate, publishedAt: document.public_updated_at,
    facts: { caseState: document.details.metadata.case_state, caseType: document.details.metadata.case_type,
      closedDate: document.details.metadata.closed_date, supportingText: config.guard }
  }));
}

export async function collectSource(sourceId, registry, { fetcher = fetch, now = new Date(), credentials } = {}) {
  if (sourceId === 'wikirate-bcorp') {
    const headers = wikirateHeaders(credentials);
    if (!hasWikirateMappings()) throw new Error('Wikirate identity mappings require review; run wikirate-audit');
    const answers = await wikirateAnswers(url => fetchJson(url, fetcher, headers), wikirateCompanyIds());
    return wikirateRecords(answers, registry, { now });
  }
  if (sourceId === 'uk-minimum-wage') {
    const records = [];
    for (const path of minimumWagePages) records.push(...parseMinimumWage(await fetchJson(`https://www.gov.uk/api/content${path}`, fetcher), path, registry, now));
    return records;
  }
  if (sourceId === 'uk-cma') {
    const records = [];
    const documents = new Map();
    for (const config of cmaCases) {
      if (!documents.has(config.path)) documents.set(config.path, await fetchJson(`https://www.gov.uk/api/content${config.path}`, fetcher));
      records.push(...parseCma(documents.get(config.path), config, now).map(record => ({
        ...record, assessedEntity: registry.find(c => c.id === record.companyId)?.name ?? record.companyId
      })));
    }
    return records;
  }
  if (sourceId === 'uk-hse') {
    const records = [];
    for (const config of hsePosts) {
      const post = await fetchJson(`https://press.hse.gov.uk/wp-json/wp/v2/posts/${config.id}`, fetcher);
      const text = plainText(post.content?.rendered ?? '');
      if (post.id !== config.id || post.link !== config.url || post.status !== 'publish'
        || !config.guards.every(guard => text.includes(guard))) throw new Error('HSE assertion requires review');
      records.push({ ...baseRecord(sourceId, String(config.id), config.companyId, now),
        kind: 'workplace_safety', outcome: 'guilty_plea_and_fine', dimensions: ['staff'],
        title: config.title, summary: config.summary, sourceUrl: config.url,
        assessedEntity: registry.find(c => c.id === config.companyId)?.name ?? config.companyId,
        eventDate: config.eventDate, publishedAt: post.date_gmt ? `${post.date_gmt}Z` : null,
        facts: config.facts
      });
    }
    return records;
  }
  throw new Error('Source is not configured for automated import');
}

export function validateRecords(sourceId, records, registry) {
  const source = sources.find(s => s.id === sourceId);
  if (!source || source.status === 'blocked') throw new Error('Source publication is blocked');
  if (!Array.isArray(records) || records.length > 500) throw new Error('Expected at most 500 evidence records');
  const ids = new Set();
  const sourceKeys = new Set();
  for (const record of records) {
    if (!record || record.sourceId !== sourceId || !registry.some(c => c.id === record.companyId)
      || !record.id || ids.has(record.id) || !record.sourceRecordId || sourceKeys.has(`${record.sourceRecordId}:${record.companyId}`)
      || !['published', 'pending', 'withdrawn'].includes(record.publicationStatus)
      || !['company', 'brand', 'facility', 'product'].includes(record.scope)
      || !record.assessedEntity || !record.kind || !record.outcome || !record.summary || !record.title
      || !Array.isArray(record.dimensions) || !record.facts || typeof record.facts !== 'object'
      || !Number.isFinite(Date.parse(record.checkedAt)) || !Number.isFinite(Date.parse(record.refreshDueAt))
      || Date.parse(record.refreshDueAt) <= Date.parse(record.checkedAt)
      || (record.eventDate !== null && !Number.isFinite(Date.parse(record.eventDate)))
      || (record.publishedAt !== null && !Number.isFinite(Date.parse(record.publishedAt)))
      || JSON.stringify(record).length > 20000) throw new Error('Invalid or ambiguous evidence record');
    const host = new URL(record.sourceUrl).hostname;
    const allowed = {
      'b-lab': ['www.bcorporation.net'], 'uk-minimum-wage': ['www.gov.uk'], 'uk-cma': ['www.gov.uk'],
      'uk-hse': ['www.hse.gov.uk', 'resources.hse.gov.uk', 'press.hse.gov.uk'],
      'us-epa': ['echo.epa.gov', 'www.epa.gov', 'ofmpub.epa.gov'], 'wikirate-bcorp': ['wikirate.org']
    }[sourceId] ?? [];
    if (!allowed.includes(host) || new URL(record.sourceUrl).protocol !== 'https:') throw new Error('Unapproved evidence source URL');
    ids.add(record.id);
    sourceKeys.add(`${record.sourceRecordId}:${record.companyId}`);
  }
}

export function evidenceStatements(sourceId, records, registry, runId, now = new Date()) {
  validateRecords(sourceId, records, registry);
  const timestamp = now.toISOString();
  return [
    ['INSERT INTO import_runs(id,source_id,started_at,finished_at,status,record_count) VALUES(?,?,?,?,?,?)', [runId, sourceId, timestamp, timestamp, 'succeeded', records.length]],
    ...records.map(record => [`INSERT INTO evidence(id,source_id,source_record_id,company_id,publication_status,record_json,import_run_id)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(source_id,source_record_id,company_id) DO UPDATE SET
      publication_status=excluded.publication_status, record_json=excluded.record_json, import_run_id=excluded.import_run_id`,
      [record.id, sourceId, record.sourceRecordId, record.companyId, record.publicationStatus, JSON.stringify(record), runId]]),
    ...records.map(record => ['INSERT INTO evidence_history(evidence_id,import_run_id,record_json) VALUES(?,?,?)', [record.id, runId, JSON.stringify(record)]]),
    ['UPDATE sources SET last_success_at=?,last_attempt_at=?,last_error=NULL WHERE id=?', [timestamp, timestamp, sourceId]]
  ];
}

export function importFailureCode(error) {
  const http = /^Source HTTP (\d{3})$/.exec(error?.message ?? '');
  if (http) return `upstream_http_${http[1]}`;
  if (/assertion requires review|source schema changed|recognisable naming entries/.test(error?.message ?? '')) return 'source_requires_review';
  if (error?.name === 'SyntaxError') return 'invalid_source_json';
  if (/D1|SQLITE/.test(error?.message ?? '')) return 'database_write_failed';
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'source_timeout';
  return 'import_failed';
}

export async function syncSources(db, { fetcher = fetch, now = new Date(), credentials } = {}) {
  const { results } = await db.prepare('SELECT registry_json FROM companies').all();
  const registry = results.map(row => JSON.parse(row.registry_json));
  if (!registry.length) throw new Error('Company registry has not been seeded');
  const resultsBySource = [];
  for (const source of sources.filter(s => s.status === 'automated' || (s.id === 'wikirate-bcorp' && credentials?.WIKIRATE_API_TOKEN && credentials?.WIKIRATE_PUBLISHABLE_KEY))) {
    const runId = crypto.randomUUID();
    try {
      const records = await collectSource(source.id, registry, { fetcher, now, credentials });
      if (!records.length) throw new Error('Unexpected empty import; requires review');
      const statements = evidenceStatements(source.id, records, registry, runId, now);
      await db.batch(statements.map(([sql, values]) => db.prepare(sql).bind(...values)));
      resultsBySource.push({ source: source.id, status: 'succeeded', records: records.length });
    } catch (cause) {
      // Never store an upstream body, URL with credentials, or exception dump.
      const error = 'Import failed; retained previous evidence. Check source access, schema and reviewed assertions.';
      await db.batch([
        db.prepare('INSERT INTO import_runs(id,source_id,started_at,finished_at,status,error) VALUES(?,?,?,?,?,?)').bind(runId, source.id, now.toISOString(), now.toISOString(), 'failed', error),
        db.prepare('UPDATE sources SET last_attempt_at=?,last_error=? WHERE id=?').bind(now.toISOString(), error, source.id)
      ]);
      resultsBySource.push({ source: source.id, status: 'failed', reason: importFailureCode(cause) });
    }
  }
  return resultsBySource;
}
