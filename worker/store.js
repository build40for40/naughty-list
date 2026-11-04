import { assess, normalizeDomain, normalize } from './assessment.js';

export function selector(input) {
  if (input.domain !== undefined) return ['domain', normalizeDomain(input.domain)];
  if (input.brand !== undefined) return ['brand', normalize(input.brand)];
  return [input.identifier.scheme, input.identifier.value];
}

export async function sourceCoverage(db, now = new Date()) {
  const { results } = await db.prepare(`SELECT s.*,
    (SELECT COUNT(*) FROM evidence e WHERE e.source_id=s.id AND e.publication_status='published') AS published_records
    FROM sources s ORDER BY s.id`).all();
  if (!results.length) throw new Error('Source registry has not been seeded');
  return results.map(row => {
    const config = JSON.parse(row.config_json);
    const stale = !row.last_success_at || now - new Date(row.last_success_at) >= config.refreshDays * 86400000;
    return {
      id: row.id, name: row.name, status: config.status === 'credentials_required' && row.last_success_at ? 'automated' : config.status,
      coverage: config.coverage, licence: config.licence,
      attribution: config.attribution,
      publishedRecords: row.published_records,
      lastSuccessfulImportAt: row.last_success_at, lastAttemptAt: row.last_attempt_at,
      refreshDueAt: row.last_success_at ? new Date(Date.parse(row.last_success_at) + config.refreshDays * 86400000).toISOString() : null,
      freshness: stale ? 'stale' : 'fresh',
      importStatus: row.last_error ? 'failed' : row.last_success_at ? 'succeeded' : 'not_imported',
      limitation: config.limitation
    };
  });
}

export async function assessStored(input, db, now = new Date()) {
  const [kind, value] = selector(input);
  const { results } = await db.prepare(`SELECT c.registry_json FROM companies c
    JOIN selectors s ON c.id = s.company_id WHERE s.kind = ? AND s.value = ?`).bind(kind, value).all();
  const registry = results.map(row => JSON.parse(row.registry_json));
  const assessment = assess(input, { registry, now });
  const sources = await sourceCoverage(db, now);
  let evidence = [];
  if (assessment.company) {
    const rows = await db.prepare(`SELECT record_json FROM evidence
      WHERE company_id = ? AND publication_status = 'published' ORDER BY id`).bind(assessment.company.id).all();
    evidence = rows.results.map(row => {
      const record = JSON.parse(row.record_json);
      const source = sources.find(s => s.id === record.sourceId);
      return { ...record, freshness: !source || source.freshness === 'stale' || now >= new Date(record.refreshDueAt) ? 'stale' : 'fresh' };
    });
  }
  // Certification must come from the stored evidence, rather than from an
  // indefinitely fresh copy of the original seed registry.
  if (assessment.company) {
    const certification = evidence.find(record => record.sourceId === 'b-lab' && record.kind === 'certification');
    assessment.criteria.bCorp = {
      status: certification?.freshness === 'fresh' ? 'verified' : 'unknown',
      certified: certification?.freshness === 'fresh' ? certification.facts.certified : null,
      reason: certification ? certification.freshness === 'fresh' ? null : 'stale_evidence' : 'no_evidence',
      source: certification ? { name: 'B Lab', url: certification.sourceUrl } : null,
      checkedAt: certification?.checkedAt ?? null,
      validUntil: certification?.refreshDueAt?.slice(0, 10) ?? null
    };
    assessment.criteria.bCorpReports = evidence.filter(record => record.sourceId === 'wikirate-bcorp').map(record => ({
      status: record.freshness === 'fresh' ? 'reported' : 'stale',
      observationStatus: record.facts.reportingYear < now.getUTCFullYear() ? 'historical' : 'current_year_report',
      reportingYear: record.facts.reportingYear, reportedCertified: record.facts.reportedCertified,
      source: { name: 'Wikirate', url: record.sourceUrl }, checkedAt: record.checkedAt,
      reason: 'dated_secondary_source_not_live_verification'
    }));
  }
  return { ...assessment, evidence, sources, coverage: { status: 'partial', scope: 'reviewed_entities_and_selected_records', noRecordsMeans: 'unknown' } };
}
