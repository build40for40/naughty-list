import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import companies, { reviewedWebsites } from '../data/companies.js';
import { pathToFileURL } from 'node:url';
import { loadEnvFile } from 'node:process';
import { normalize } from '../worker/assessment.js';
import { sources } from '../worker/source-config.js';
import { collectSource, evidenceStatements, fetchJson } from '../worker/imports.js';
import { auditWikirate, wikirateHeaders } from '../worker/wikirate.js';

export const registry = companies.map(company => reviewedWebsites[company.id] ? {
  ...company, domains: [reviewedWebsites[company.id]],
  domainEvidence: { sourceUrl: `https://${reviewedWebsites[company.id]}/`, checkedAt: '2026-11-04' }
} : company);

export function sourceStatements() {
  return sources.map(source => ['INSERT INTO sources(id,name,config_json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,config_json=excluded.config_json', [source.id, source.name, JSON.stringify(source)]]);
}

export function seedStatements() {
  return [
    ...registry.flatMap(company => [
      ['INSERT INTO companies(id,registry_json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET registry_json=excluded.registry_json', [company.id, JSON.stringify(company)]],
      ['DELETE FROM selectors WHERE company_id=?', [company.id]],
      ...[...new Set([company.name, ...company.aliases].map(normalize))].map(name => ['INSERT INTO selectors(kind,value,company_id) VALUES(?,?,?)', ['brand', name, company.id]]),
      ...(company.domains ?? []).map(domain => ['INSERT INTO selectors(kind,value,company_id) VALUES(?,?,?)', ['domain', domain, company.id]]),
      ...company.identifiers.map(identifier => ['INSERT INTO selectors(kind,value,company_id) VALUES(?,?,?)', [identifier.scheme, identifier.value, company.id]])
    ]),
    ...sourceStatements()
  ];
}

export function bCorpRecords() {
  return registry.filter(company => company.bCorp).map(company => ({
    id: `b-lab:${company.id}`, sourceId: 'b-lab', sourceRecordId: company.identifiers.find(id => id.scheme === 'b_lab').value,
    companyId: company.id, assessedEntity: company.name, publicationStatus: 'published', scope: 'company',
    kind: 'certification', outcome: 'certified', dimensions: ['certification'],
    title: 'B Corp certification', summary: 'Certification checked against the B Lab directory. This is not a product-level ethical judgment.',
    sourceUrl: company.bCorp.sourceUrl, checkedAt: company.bCorp.checkedAt,
    refreshDueAt: `${company.bCorp.validUntil}T00:00:00Z`, eventDate: null, publishedAt: null,
    facts: { certified: company.bCorp.certified }
  }));
}

export function renderSql(statements) {
  return statements.map(([sql, values]) => {
    let index = 0;
    const rendered = sql.replace(/\?/g, () => {
      const value = values[index++];
      if (value === null) return 'NULL';
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      if (typeof value !== 'string') throw new Error('Invalid SQL parameter');
      return `'${value.replaceAll("'", "''")}'`;
    });
    if (index !== values.length) throw new Error('SQL parameter mismatch');
    return `${rendered};`;
  }).join('\n');
}

async function execute(statements, remote) {
  const directory = await mkdtemp(join(tmpdir(), 'naughty-list-import-'));
  try {
    const file = join(directory, 'import.sql');
    await writeFile(file, renderSql(statements), { mode: 0o600 });
    const result = spawnSync('npm', ['run', 'wrangler', '--', 'd1', 'execute', 'naughty-list', remote ? '--remote' : '--local', '--file', file], {
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_LOG_PATH: join(tmpdir(), 'naughty-list-wrangler.log') }
    });
    if (result.status !== 0) throw new Error('D1 import failed');
  } finally { await rm(directory, { recursive: true, force: true }); }
}

async function main() {
  try { loadEnvFile('.dev.vars'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const [command, ...args] = process.argv.slice(2);
  const remote = args.includes('--remote');
  const parameters = args.filter(arg => arg !== '--remote');
  const now = new Date();
  if (command === 'sources') {
    await execute(sourceStatements(), remote);
    console.log(JSON.stringify({ status: 'registered', sources: sources.length }));
    return;
  }
  if (command === 'wikirate-audit') {
    const headers = wikirateHeaders(process.env);
    console.log(JSON.stringify(await auditWikirate(url => fetchJson(url, fetch, headers), registry), null, 2));
    return;
  }
  if (command === 'wikirate-secrets') {
    wikirateHeaders(process.env);
    const directory = await mkdtemp(join(tmpdir(), 'naughty-list-secrets-'));
    try {
      const file = join(directory, 'secrets.json');
      await writeFile(file, JSON.stringify({ WIKIRATE_PUBLISHABLE_KEY: process.env.WIKIRATE_PUBLISHABLE_KEY, WIKIRATE_API_TOKEN: process.env.WIKIRATE_API_TOKEN }), { mode: 0o600 });
      const result = spawnSync('npm', ['run', 'wrangler', '--', 'secret', 'bulk', file], {
        stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_LOG_PATH: join(tmpdir(), 'naughty-list-wrangler.log') }
      });
      if (result.status !== 0) throw new Error('Wikirate secret upload failed');
      console.log(JSON.stringify({ status: 'configured', names: ['WIKIRATE_PUBLISHABLE_KEY', 'WIKIRATE_API_TOKEN'] }));
    } finally { await rm(directory, { recursive: true, force: true }); }
    return;
  }
  if (command === 'seed') {
    const statements = [...seedStatements(), ...evidenceStatements('b-lab', bCorpRecords(), registry, crypto.randomUUID(), now)];
    await execute(statements, remote);
    console.log(JSON.stringify({ status: 'seeded', companies: registry.length }));
    return;
  }
  if (command === 'sync' || command === 'preview') {
    let failed = false;
    for (const source of sources.filter(source => source.status === 'automated' || (source.id === 'wikirate-bcorp' && process.env.WIKIRATE_API_TOKEN && process.env.WIKIRATE_PUBLISHABLE_KEY))) {
      const runId = crypto.randomUUID();
      try {
        const records = await collectSource(source.id, registry, { now, credentials: process.env });
        if (!records.length) throw new Error('Unexpected empty import');
        const statements = evidenceStatements(source.id, records, registry, runId, now);
        if (command === 'sync') await execute(statements, remote);
        console.log(JSON.stringify({ source: source.id, status: command === 'preview' ? 'validated' : 'imported', records: records.length,
          companies: [...new Set(records.map(record => record.companyId))] }));
      } catch (error) {
        failed = true;
        const message = 'Import failed; retained previous evidence. Check source access, schema and reviewed assertions.';
        if (command === 'sync') await execute([
          ['INSERT INTO import_runs(id,source_id,started_at,finished_at,status,error) VALUES(?,?,?,?,?,?)', [runId, source.id, now.toISOString(), now.toISOString(), 'failed', message]],
          ['UPDATE sources SET last_attempt_at=?,last_error=? WHERE id=?', [now.toISOString(), message, source.id]]
        ], remote);
        console.error(JSON.stringify({ source: source.id, status: 'failed', error: error.message }));
      }
    }
    if (failed) process.exitCode = 1;
    return;
  }
  if (command === 'import' && parameters.length === 2) {
    const [sourceId, file] = parameters;
    const source = sources.find(source => source.id === sourceId);
    if (!source || source.status !== 'manual') throw new Error('Only reviewed manual sources may be imported from files');
    const records = JSON.parse(await readFile(file, 'utf8'));
    await execute(evidenceStatements(sourceId, records, registry, crypto.randomUUID(), now), remote);
    console.log(JSON.stringify({ source: sourceId, status: 'imported', records: records.length }));
    return;
  }
  throw new Error('Usage: npm run evidence -- seed|sources|preview|sync|wikirate-audit|wikirate-secrets|import SOURCE FILE [--remote]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
