import test from 'node:test';
import assert from 'node:assert/strict';
import workerModule from '../worker/index.js';
import { seededDatabase } from './helpers.js';
import { assess } from '../worker/assessment.js';
import companies from '../worker/companies.js';

const db = await seededDatabase();
const worker = { fetch: request => workerModule.fetch(request, { DB: db }) };

const post = body => worker.fetch(new Request('https://example.test/v1/assessments', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
}));

test('brand and stable B Lab ID resolve to the same company with provenance', async () => {
  const byBrand = await (await post({ brand: '  PATAGONIA  ' })).json();
  const byId = await (await post({ identifier: { scheme: 'b_lab', value: 'patagonia-inc' } })).json();
  assert.equal(byBrand.company.id, byId.company.id);
  const fresh = assess({ brand: 'Patagonia' }, { now: new Date('2026-11-04T12:00:00Z') });
  assert.equal(fresh.criteria.bCorp.certified, true);
  assert.match(byBrand.criteria.bCorp.source.url, /^https:\/\/www.bcorporation.net\//);
  assert.equal(byBrand.scoring.verdict, 'nice');
  assert.equal(byBrand.scoring.total, 1);
});

test('unknown brands and unmapped DUNS are unknown, never false', async () => {
  for (const input of [{ brand: 'Unlisted Example Shop' }, { identifier: { scheme: 'duns', value: '000000000' } }]) {
    const response = await post(input);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.match.status, 'not_found');
    assert.equal(body.criteria.bCorp.certified, null);
    assert.equal(body.company, null);
  }
});

test('reviewed domains resolve exactly with identity evidence', async () => {
  for (const domain of ['patagonia.com', 'www.patagonia.com', '  PATAGONIA.COM.  ']) {
    const response = await post({ domain });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.company.id, 'patagonia');
    assert.equal(result.match.method, 'reviewed_domain');
    assert.equal(result.match.domain, domain.trim().toLowerCase().replace(/\.$/, ''));
    assert.equal(result.match.evidence.checkedAt, '2026-11-04');
    assert.equal(result.match.evidence.sourceUrl, companies[0].domainEvidence.sourceUrl);
  }
  const tonys = await (await post({ domain: 'www.tonyschocolonely.com' })).json();
  assert.equal(tonys.company.id, 'tonys-chocolonely');
});

test('lookalikes, unreviewed subdomains and marketplaces never inherit a brand match', async () => {
  for (const domain of ['patagonia.com.example.org', 'fakepatagonia.com', 'shop.patagonia.com',
    'patagonia.co.uk', 'amazon.co.uk', 'argos.co.uk', 'xn--patagonia-example.com']) {
    const response = await post({ domain });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.match.status, 'not_found', domain);
    assert.equal(result.company, null);
    assert.equal(result.criteria.bCorp.certified, null);
  }
});

test('conflicting domain mappings stay ambiguous', () => {
  const registry = [companies[0], { ...companies[0], id: 'different-business' }];
  const result = assess({ domain: 'patagonia.com' }, { registry });
  assert.equal(result.match.status, 'ambiguous');
  assert.equal(result.match.evidence, null);
  assert.equal(result.criteria.bCorp.certified, null);
});

test('domain lookup rejects URLs, IPs, malformed names and mixed selectors', async () => {
  for (const domain of ['', null, 42, 'localhost', '127.0.0.1', '[::1]', 'https://patagonia.com',
    'patagonia.com/path', 'patagonia.com?x=1', 'patagonia.com#test', 'user@example.com',
    'patagonia.com:443', '.patagonia.com', 'patagonia..com', '-patagonia.com',
    `${'a'.repeat(64)}.com`, 'patagonia.com..', 'patagоnia.com']) {
    assert.equal((await post({ domain })).status, 400, String(domain));
  }
  assert.equal((await post({ domain: 'patagonia.com', brand: 'Patagonia' })).status, 400);
  assert.equal((await post({ domain: 'patagonia.com', identifier: { scheme: 'b_lab', value: 'patagonia-inc' } })).status, 400);
});

test('ambiguous names and partial matches do not assign certification', () => {
  const registry = [companies[0], { ...companies[0], id: 'different-business' }];
  assert.equal(assess({ brand: 'Patagonia' }, { registry }).match.status, 'ambiguous');
  assert.equal(assess({ brand: 'Patagonia' }, { registry }).criteria.bCorp.certified, null);
  assert.equal(assess({ brand: 'Patagon' }).match.status, 'not_found');
});

test('evidence becomes unknown at its refresh deadline', () => {
  const result = assess({ brand: 'Patagonia' }, { now: new Date('2026-12-04T00:00:00Z') });
  assert.equal(result.criteria.bCorp.certified, null);
  assert.equal(result.criteria.bCorp.reason, 'stale_evidence');
  assert.ok(result.criteria.bCorp.source);
});

test('rejects invalid, ambiguous and malformed identifier inputs', async () => {
  for (const input of [null, [], {}, { brand: '' }, { brand: 42 }, { brand: 'a'.repeat(201) },
    { brand: 'Patagonia', identifier: { scheme: 'duns', value: '000000000' } },
    { identifier: { scheme: 'duns', value: 123456789 } },
    { identifier: { scheme: 'duns', value: '123' } },
    { identifier: { scheme: 'unknown', value: '123456789' } },
    { identifier: { scheme: 'b_lab', value: '../patagonia-inc' } }]) {
    assert.equal((await post(input)).status, 400);
  }
});

test('rejects invalid JSON, wrong content type and oversized bodies', async () => {
  const request = (body, type) => new Request('https://example.test/v1/assessments', {
    method: 'POST', headers: { 'Content-Type': type }, body
  });
  assert.equal((await worker.fetch(request('{', 'application/json'))).status, 400);
  assert.equal((await worker.fetch(request('{}', 'text/plain'))).status, 415);
  assert.equal((await worker.fetch(request('x'.repeat(4097), 'application/json'))).status, 413);
});

test('health, routes, methods and preflight behave consistently', async () => {
  assert.equal((await worker.fetch(new Request('https://example.test/health'))).status, 200);
  assert.equal((await worker.fetch(new Request('https://example.test/missing'))).status, 404);
  const wrongMethod = await worker.fetch(new Request('https://example.test/v1/assessments'));
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get('Allow'), 'POST, OPTIONS');
  const preflight = await worker.fetch(new Request('https://example.test/v1/assessments', { method: 'OPTIONS' }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
});
