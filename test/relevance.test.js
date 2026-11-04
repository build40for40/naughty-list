import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { seededDatabase } from './helpers.js';
import { domainRelevance } from '../worker/relevance.js';

const db = await seededDatabase();
const post = async domain => (await worker.fetch(new Request('https://example.test/v1/assessments', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
}), { DB: db })).json();

test('reviewed brand shops require an exact resolved business before verdict eligibility', async () => {
  for (const [domain, id] of [['www.patagonia.com', 'patagonia'], ['uk.tonyschocolonely.com', 'tonys-chocolonely'], ['www2.hm.com', 'hm']]) {
    const result = await post(domain);
    assert.equal(result.company.id, id);
    assert.equal(result.relevance.category, 'brand_shop');
    assert.equal(result.relevance.eligibleForVerdict, true);
    assert.ok(result.match.evidence.sourceUrl);
    assert.ok(result.relevance.evidence.sourceUrl);
    assert.equal(result.scoring.verdict, null);
  }
  assert.equal(domainRelevance('patagonia.com', { match: { status: 'ambiguous' } }).eligibleForVerdict, false);
  assert.equal(domainRelevance('patagonia.com', { match: { status: 'matched', method: 'reviewed_domain' }, company: { id: 'unrelated-owner' } }).eligibleForVerdict, false);
});

test('H&M identity coverage does not invent certification or transfer group evidence', async () => {
  for (const domain of ['hm.com', 'www.hm.com', 'www2.hm.com']) {
    const result = await post(domain);
    assert.equal(result.company.name, 'H&M');
    assert.equal(result.criteria.bCorp.certified, null);
    assert.equal(result.criteria.bCorp.reason, 'no_evidence');
    assert.equal(result.scoring.verdict, null);
    assert.equal(result.evidence.length, 0);
  }
  const group = await post('hmgroup.com');
  assert.equal(group.company, null);
  assert.equal(group.relevance.eligibleForVerdict, false);
});

test('retailers and marketplaces cannot become product brand verdicts', async () => {
  for (const [domain, category] of [['www.amazon.co.uk', 'marketplace'], ['www.argos.co.uk', 'retailer'], ['en.wikipedia.org', 'unrelated'], ['shop.patagonia.com', 'unknown']]) {
    const result = await post(domain);
    assert.equal(result.relevance.category, category);
    assert.equal(result.relevance.eligibleForVerdict, false);
    assert.equal(result.scoring.verdict, null);
  }
});

test('lookalikes, regional guesses and conflicting categories remain unknown', () => {
  for (const domain of ['patagonia.com.example.org', 'patagonia.co.uk', 'de.tonyschocolonely.com']) {
    assert.equal(domainRelevance(domain).category, 'unknown');
  }
  const conflict = [{ domains: ['patagonia.com'], category: 'brand_shop' }, { domains: ['patagonia.com'], category: 'retailer' }];
  assert.equal(domainRelevance('patagonia.com', null, conflict).status, 'ambiguous');
});
