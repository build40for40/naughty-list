import test from 'node:test';
import assert from 'node:assert/strict';
import { WIKIRATE_METRIC_ID, wikirateHeaders, wikirateAnswers, wikirateRecords, auditWikirate } from '../worker/wikirate.js';
import { seededDatabase } from './helpers.js';
import { evidenceStatements } from '../worker/imports.js';
import { assessStored } from '../worker/store.js';

const now = new Date('2026-11-04T12:00:00Z');
const registry = [{ id: 'example-gift-shop', name: 'Example Gift Shop Ltd', aliases: [] }];
const mapping = { companyId: registry[0].id, providerCompanyId: 42, sourceUrl: 'https://wikirate.org/Example_Gift_Shop_Ltd', checkedAt: '2026-11-04' };
const answer = { id: 500, company_id: 42, company: 'Example Gift Shop Ltd', metric_id: WIKIRATE_METRIC_ID,
  year: 2023, value: 'Certified', updated_at: '2026-10-01T00:00:00Z',
  license: { reference_url: 'https://creativecommons.org/licenses/by/4.0/' },
  sources: [{ original_url: 'https://example.test/certification-report' }] };
const records = rows => wikirateRecords(rows, registry, { now, approvedMappings: [mapping] });

test('Wikirate requires credentials and never sends tokens in query parameters', async () => {
  assert.throws(() => wikirateHeaders({}), /credentials required/);
  assert.deepEqual(Object.keys(wikirateHeaders({ WIKIRATE_PUBLISHABLE_KEY: 'example-key', WIKIRATE_API_TOKEN: 'example-token' })).sort(), ['Accept-Profile', 'apikey', 'x-api-token'].sort());
  await wikirateAnswers(async url => {
    assert.match(url, /metric_id=eq\.13660491/);
    assert.doesNotMatch(url, /token|apikey/);
    return [];
  });
  await wikirateAnswers(async url => {
    assert.match(url, /company_id=in\.\(42\)/);
    return [];
  }, [42]);
});

test('secondary reports retain observation year, original status and attribution', () => {
  const [record] = records([answer]);
  assert.equal(record.kind, 'certification_report');
  assert.equal(record.facts.reportingYear, 2023);
  assert.equal(record.facts.providerUpdatedAt, answer.updated_at);
  assert.equal(record.eventDate, null);
  assert.equal(record.publishedAt, null);
  assert.equal(record.facts.reportedCertified, true);
  assert.match(record.summary, /not a live B Lab/);
  assert.equal(records([{ ...answer, value: 'De-certified' }])[0].facts.reportedCertified, false);
});

test('latest report replaces older values without hiding conflicting latest answers', () => {
  assert.equal(records([answer, { ...answer, id: 501, year: 2024, value: 'De-certified' }])[0].facts.reportedCertified, false);
  assert.throws(() => records([answer, { ...answer, id: 501, value: 'De-certified' }]), /conflicting/);
  assert.throws(() => records([{ ...answer, year: 2027 }]), /year/);
  assert.throws(() => records([{ ...answer, value: 'Unknown' }]), /requires review/);
});

test('unreviewed identities and missing/disallowed licences cannot publish', () => {
  assert.deepEqual(wikirateRecords([answer], registry, { now, approvedMappings: [] }), []);
  assert.throws(() => records([]), /disappeared/);
  assert.throws(() => records([{ ...answer, license: null }]), /licence/);
  assert.throws(() => records([{ ...answer, license: { reference_url: 'https://creativecommons.org/licenses/by-nc/4.0/' } }]), /licence/);
  assert.throws(() => wikirateRecords([answer], registry, { now, approvedMappings: [mapping, mapping] }), /identity/);
});

test('pagination is stable and audit candidates never approve identity matches', async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({ ...answer, id: i + 1 }));
  const fetched = await wikirateAnswers(async url => url.includes('offset=0') ? rows : [{ ...answer, id: 1001 }]);
  assert.equal(fetched.length, 1001);
  const audit = await auditWikirate(async url => url.includes('/v1_answers') ? [answer] : [{ id: 42, name: answer.company, website: 'https://example.test' }], registry);
  assert.equal(audit.companies, 1);
  assert.equal(audit.candidates[0].status, 'requires_identity_review');
  assert.equal(audit.years['2023'], 1);
});

test('stored secondary reports never become direct verification or an overall verdict', async () => {
  const db = await seededDatabase();
  await db.prepare('INSERT INTO companies(id,registry_json) VALUES(?,?)').bind(registry[0].id, JSON.stringify({ ...registry[0], identifiers: [], domains: [] })).run();
  await db.prepare('INSERT INTO selectors(kind,value,company_id) VALUES(?,?,?)').bind('brand', 'example gift shop ltd', registry[0].id).run();
  const plan = evidenceStatements('wikirate-bcorp', records([answer]), registry, crypto.randomUUID(), now);
  await db.batch(plan.map(([sql, values]) => db.prepare(sql).bind(...values)));
  const result = await assessStored({ brand: 'Example Gift Shop Ltd' }, db, now);
  assert.equal(result.criteria.bCorp.certified, null);
  assert.equal(result.criteria.bCorpReports[0].reportingYear, 2023);
  assert.equal(result.criteria.bCorpReports[0].observationStatus, 'historical');
  assert.equal(result.criteria.bCorpReports[0].reportedCertified, true);
  assert.equal(result.scoring.verdict, null);
  assert.equal((await assessStored({ brand: 'Example Gift Shop Ltd' }, db, new Date('2026-11-12'))).criteria.bCorpReports[0].status, 'stale');
  db.close();
});
