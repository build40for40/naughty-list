import test from 'node:test';
import assert from 'node:assert/strict';
import { seededDatabase, database } from './helpers.js';
import worker from '../worker/index.js';
import { assessStored } from '../worker/store.js';
import { fetchJson, parseCma, parseMinimumWage, evidenceStatements, validateRecords, syncSources } from '../worker/imports.js';
import { renderSql } from '../scripts/evidence.mjs';
import registry from '../data/companies.js';
const now = new Date('2026-11-04T12:00:00Z');
const naming = { public_updated_at: '2026-09-03T00:00:00Z', details: { body: '<p>1. B&amp;Q LIMITED, Example Town, XX1, failed to pay £123.45 to 2 workers.</p><p>2. Private Person, Somewhere, YY1, failed to pay £22 to 1 workers.</p>' } };

test('upstream redirects fail closed using a Workers-compatible fetch mode', async () => {
  await assert.rejects(fetchJson('https://www.gov.uk/example', async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response('', { status: 302, headers: { Location: 'https://unapproved.example.test' } });
  }), /HTTP 302/);
});

test('minimum wage importer limits records to exact reviewed entities and removes locations', () => {
  const records = parseMinimumWage(naming, '/test-round', registry, now);
  assert.equal(records.length, 1);
  assert.equal(records[0].companyId, 'b-and-q');
  assert.equal(records[0].facts.underpaymentGBP, 123.45);
  assert.equal(records[0].eventDate, null);
  assert.equal(records[0].publishedAt, naming.public_updated_at);
  assert.doesNotMatch(JSON.stringify(records), /Example Town|Private Person|XX1/);
  const ambiguous = [...registry, { ...registry.find(c => c.id === 'b-and-q'), id: 'other' }];
  assert.equal(parseMinimumWage(naming, '/test-round', ambiguous, now).length, 0);
});

test('CMA classification requires reviewed supporting text and expected case state', () => {
  const config = { path: '/case', subjects: ['asos'], guard: 'Signed undertakings.', eventDate: '2024-03-27', outcome: 'undertakings', summary: 'An undertaking, not a conviction.' };
  const doc = { document_type: 'cma_case', title: 'Example case', public_updated_at: '2024-04-01', details: { body: '<p>Signed undertakings.</p>', metadata: { case_state: 'closed' } } };
  assert.equal(parseCma(doc, config, now)[0].outcome, 'undertakings');
  assert.throws(() => parseCma({ ...doc, details: { ...doc.details, body: 'An unrelated investigation' } }, config, now), /review/);
  assert.throws(() => parseCma({ ...doc, details: { ...doc.details, metadata: { case_state: 'open' } } }, config, now), /review/);
});

test('imports are idempotent and assessments expose provenance, stale data and coverage', async () => {
  const db = await seededDatabase();
  const records = parseMinimumWage(naming, '/test-round', registry, now);
  for (let i = 0; i < 2; i++) await db.batch(evidenceStatements('uk-minimum-wage', records, registry, crypto.randomUUID(), now).map(([sql, values]) => db.prepare(sql).bind(...values)));
  assert.equal((await db.prepare("SELECT count(*) AS n FROM evidence WHERE source_id='uk-minimum-wage'").first()).n, 1);
  const assessment = await assessStored({ brand: 'B&Q' }, db, now);
  assert.equal(assessment.evidence.length, 1);
  assert.equal(assessment.evidence[0].freshness, 'fresh');
  assert.equal(assessment.criteria.bCorp.certified, null);
  // v0.4: minimum-wage namings under £1,000 are shown but earn no coal.
  assert.ok(assessment.scoring.history.some(item => item.reason === 'below_threshold'));
  assert.notEqual(assessment.scoring.verdict, 'naughty');
  assert.equal((await assessStored({ brand: 'B&Q' }, db, new Date('2026-11-12'))).evidence[0].freshness, 'stale');
  const expired = await assessStored({ brand: 'Patagonia' }, db, new Date('2026-12-04'));
  assert.equal(expired.criteria.bCorp.certified, null);
  assert.equal(expired.evidence[0].freshness, 'stale');
  assert.equal(assessment.sources.find(s => s.id === 'wba').status, 'blocked');
  db.close();
});

test('unpublished evidence and related entities never leak into another company assessment', async () => {
  const db = await seededDatabase();
  const records = parseMinimumWage(naming, '/test-round', registry, now);
  records[0].publicationStatus = 'pending';
  await db.batch(evidenceStatements('uk-minimum-wage', records, registry, crypto.randomUUID(), now).map(([sql, values]) => db.prepare(sql).bind(...values)));
  assert.equal((await assessStored({ brand: 'B&Q' }, db, now)).evidence.length, 0);
  assert.equal((await assessStored({ brand: 'ASOS' }, db, now)).evidence.length, 0);
  assert.equal((await assessStored({ domain: 'amazon.co.uk' }, db, now)).company, null);
  db.close();
});

test('failed source fetches preserve evidence and successful import dates', async () => {
  const db = await seededDatabase();
  const records = parseMinimumWage(naming, '/test-round', registry, now);
  await db.batch(evidenceStatements('uk-minimum-wage', records, registry, crypto.randomUUID(), now).map(([sql, values]) => db.prepare(sql).bind(...values)));
  const results = await syncSources(db, { now: new Date('2026-11-05'), fetcher: async () => { throw new Error('upstream secret body'); } });
  assert.ok(results.every(result => result.status === 'failed'));
  const result = await assessStored({ brand: 'B&Q' }, db, now);
  assert.equal(result.evidence.length, 1);
  const source = result.sources.find(s => s.id === 'uk-minimum-wage');
  assert.equal(source.lastSuccessfulImportAt, now.toISOString());
  assert.equal(source.importStatus, 'failed');
  assert.doesNotMatch(JSON.stringify(await db.prepare('SELECT * FROM import_runs').all()), /upstream secret/);
  db.close();
});

test('transaction failure preserves old evidence and rejects unsupported/blocked sources', async () => {
  const db = await seededDatabase();
  const records = parseMinimumWage(naming, '/test-round', registry, now);
  const statements = evidenceStatements('uk-minimum-wage', records, registry, crypto.randomUUID(), now);
  statements.push(['INSERT INTO nonexistent_table VALUES(?)', ['test']]);
  await assert.rejects(db.batch(statements.map(([sql, values]) => db.prepare(sql).bind(...values))));
  assert.equal((await assessStored({ brand: 'B&Q' }, db, now)).evidence.length, 0);
  assert.throws(() => validateRecords('wba', [], registry), /blocked/);
  assert.throws(() => validateRecords('uk-minimum-wage', [{ ...records[0], sourceUrl: 'https://www.gov.uk.example.org/case' }], registry), /Unapproved/);
  const sql = renderSql([['INSERT INTO example(value) VALUES(?)', ["Example'); DROP TABLE companies; --"]]]);
  assert.match(sql, /Example''\); DROP/);
  db.close();
});

test('database failures return 503 and source endpoint is read only', async () => {
  const request = new Request('https://example.test/v1/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"brand":"ASOS"}' });
  assert.equal((await worker.fetch(request, {})).status, 503);
  const db = await seededDatabase();
  assert.equal((await worker.fetch(new Request('https://example.test/v1/sources'), { DB: db })).status, 200);
  assert.equal((await worker.fetch(new Request('https://example.test/v1/sources', { method: 'POST' }), { DB: db })).status, 405);
  const empty = database();
  assert.equal((await worker.fetch(new Request('https://example.test/health'), { DB: empty })).status, 503);
  empty.close(); db.close();
});
