import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assess } from '../worker/assessment.js';
import companies from '../worker/companies.js';
import '../extension/verdict.js';

const { badgeState } = globalThis.NaughtyListVerdict;
const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
const fresh = new Date('2026-11-04T12:00:00Z');

test('content scripts run on exactly the reviewed single-brand store domains', () => {
  const reviewed = companies
    .filter(company => company.domainEvidence?.storeType === 'single_brand')
    .flatMap(company => company.domains)
    .map(domain => `https://${domain}/*`)
    .sort();
  const [script] = manifest.content_scripts;
  assert.deepEqual([...script.matches].sort(), reviewed);
  assert.deepEqual([...manifest.web_accessible_resources[0].matches].sort(), reviewed);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.host_permissions, undefined);
});

test('domain lookups report the store type', () => {
  assert.equal(assess({ domain: 'patagonia.com' }).match.storeType, 'single_brand');
  assert.equal(assess({ domain: 'amazon.co.uk' }).match.storeType, null);
  assert.equal(assess({ brand: 'Patagonia' }).match.storeType, undefined);
});

test('a fresh certified B Corp on a single-brand store shows its evidence, with the verdict pending', () => {
  const state = badgeState(assess({ domain: 'www.patagonia.com' }, { now: fresh }));
  assert.equal(state.verdict, 'certified');
  assert.doesNotMatch(`${state.label} ${state.headline} ${state.line}`, /\b(nice|naughty)\b/i);
  assert.equal(state.subject, 'Patagonia');
  assert.equal(state.checked, '4 Nov 2026');
  assert.match(state.sourceUrl, /^https:\/\/www\.bcorporation\.net\//);
  assert.equal(state.line, 'Verdict pending · B Lab · checked 4 Nov 2026');
});

test('missing, stale, unreachable and negative evidence are unidentified', () => {
  const stale = badgeState(assess({ domain: 'patagonia.com' }, { now: new Date('2026-12-04T00:00:00Z') }));
  assert.equal(stale.verdict, 'unknown');
  assert.equal(stale.reason, 'stale');
  assert.equal(stale.subject, 'Patagonia');

  assert.equal(badgeState(assess({ domain: 'unlisted-example.com' })).reason, 'not_listed');
  assert.equal(badgeState(null).reason, 'unreachable');

  const ambiguous = assess({ domain: 'patagonia.com' }, { registry: [companies[0], { ...companies[0], id: 'other' }], now: fresh });
  assert.equal(badgeState(ambiguous).verdict, 'unknown');

  const uncertified = [{ ...companies[0], bCorp: { ...companies[0].bCorp, certified: false } }];
  const negative = badgeState(assess({ domain: 'patagonia.com' }, { registry: uncertified, now: fresh }));
  assert.equal(negative.verdict, 'unknown');
  assert.equal(negative.reason, 'no_evidence');
});

test('badge mode stays off for stores that are not single-brand', () => {
  const marketplace = [{ ...companies[0], domainEvidence: { ...companies[0].domainEvidence, storeType: 'multi_brand' } }];
  assert.equal(badgeState(assess({ domain: 'patagonia.com' }, { registry: marketplace, now: fresh })), null);
});

test('non-https source links are dropped', () => {
  const result = assess({ domain: 'patagonia.com' }, { now: fresh });
  result.criteria.bCorp.source.url = 'javascript:alert(1)';
  assert.equal(badgeState(result).sourceUrl, null);
});
