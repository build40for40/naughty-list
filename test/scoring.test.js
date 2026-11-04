import test from 'node:test';
import assert from 'node:assert/strict';
import { santaScore, windowStart, METHOD_VERSION } from '../worker/scoring.js';
import retailers from '../data/santa-retailers.js';
import registry from '../data/companies.js';
import { normalize } from '../worker/assessment.js';

const asOf = '2026-11-04';
let next = 0;
const record = (outcome, eventDate, extra = {}) => ({
  id: `r${++next}`, sourceId: 'uk-cma', sourceRecordId: `case-${next}`, outcome, eventDate, publishedAt: null, ...extra
});
const bCorp = (extra = {}) => ({
  id: 'b-lab:x', sourceId: 'b-lab', sourceRecordId: 'x', outcome: 'certified', eventDate: null, publishedAt: null,
  facts: { certified: true }, freshness: 'fresh', refreshDueAt: '2026-12-04T00:00:00Z', ...extra
});
const proven = date => record('government_naming', null, { sourceId: 'uk-minimum-wage', publishedAt: `${date}T08:00:00Z` });

test('the method is labelled as a draft', () => {
  assert.equal(METHOD_VERSION, 'santa-v0.3-draft');
  assert.equal(santaScore([], { asOf }).method, METHOD_VERSION);
});

test('no records is not enough evidence, never naughty', () => {
  const score = santaScore([], { asOf });
  assert.equal(score.verdict, 'not_enough_evidence');
  assert.equal(score.total, null);
  assert.equal(score.warningShown, false);
});

test('a current B Corp alone is one gift and Nice', () => {
  const score = santaScore([bCorp()], { asOf });
  assert.deepEqual([score.gifts, score.total, score.verdict], [1, 1, 'nice']);
});

test('a stale or uncertified B Corp record is not a gift', () => {
  assert.equal(santaScore([bCorp({ freshness: 'stale' })], { asOf }).verdict, 'not_enough_evidence');
  assert.equal(santaScore([bCorp({ facts: { certified: false } })], { asOf }).verdict, 'not_enough_evidence');
  assert.equal(santaScore([bCorp({ freshness: undefined, refreshDueAt: '2026-11-01T00:00:00Z' })], { asOf }).gifts, 0);
});

test('a single warning is not enough for Naughty but is shown', () => {
  const score = santaScore([record('undertakings', '2024-03-27')], { asOf });
  assert.deepEqual([score.coal, score.total, score.verdict, score.warningShown], [1, -1, 'not_enough_evidence', true]);
});

test('one proven offence is Naughty, dated by publication when no event date exists', () => {
  const score = santaScore([proven('2026-09-03')], { asOf });
  assert.deepEqual([score.coal, score.total, score.verdict], [2, -2, 'naughty']);
  assert.equal(score.counted[0].datedByPublication, true);
});

test('minimum-wage namings under £1,000 earn no coal', () => {
  const small = proven('2026-09-03'); small.facts = { underpaymentGBP: 227.84 };
  const large = proven('2026-09-03'); large.facts = { underpaymentGBP: 1709.93 };
  assert.equal(santaScore([small], { asOf }).verdict, 'not_enough_evidence');
  assert.equal(santaScore([small], { asOf }).history[0].reason, 'below_threshold');
  assert.equal(santaScore([large], { asOf }).verdict, 'naughty');
});

test('repeat incidents within the window double the total', () => {
  const twoWarnings = santaScore([record('undertaking', '2025-01-01'), record('commitments', '2026-01-01')], { asOf });
  assert.deepEqual([twoWarnings.coal, twoWarnings.verdict], [2, 'naughty']);
  const warningAndOffence = santaScore([record('undertaking', '2025-01-01'), proven('2026-09-03')], { asOf });
  assert.equal(warningAndOffence.coal, 4);
  const offences = [proven('2024-01-01'), proven('2025-01-01'), proven('2026-01-01'), proven('2026-06-01')];
  assert.deepEqual([1, 2, 3, 4].map(n => santaScore(offences.slice(0, n), { asOf }).coal), [2, 4, 8, 16]);
});

test('a gift can balance a warning: neutral with evidence is Nice', () => {
  const score = santaScore([bCorp(), record('undertaking', '2025-06-01')], { asOf });
  assert.deepEqual([score.total, score.verdict, score.warningShown], [0, 'nice', false]);
});

test('the window is the last three years to the day', () => {
  assert.equal(windowStart(asOf), '2023-11-04');
  assert.equal(santaScore([record('commitments', '2023-11-03')], { asOf }).history[0].reason, 'older_than_window');
  assert.equal(santaScore([record('commitments', '2023-11-04')], { asOf }).coal, 1);
});

test('changed practices, secondary reports and unknown outcomes earn no coal', () => {
  const score = santaScore([
    record('practice_changed', '2026-01-01'),
    record('reported_certified', '2022-12-31', { sourceId: 'wikirate-bcorp' }),
    record('investigation_opened', '2026-01-01')
  ], { asOf });
  assert.equal(score.verdict, 'not_enough_evidence');
  assert.deepEqual(score.history.map(item => item.reason), ['changed_its_ways', 'not_scored', 'not_scored']);
});

test('the same record reached through two brand lookups counts once', () => {
  const shared = record('undertakings', '2024-03-27');
  assert.equal(santaScore([shared, { ...shared }], { asOf }).coal, 1);
});

test('the card 159 list has 100 retailers and only reviewed registry lookups', () => {
  assert.equal(retailers.length, 100);
  assert.equal(new Set(retailers.map(retailer => retailer.n)).size, 100);
  const names = new Set(registry.flatMap(company => [company.name, ...company.aliases]).map(normalize));
  // H&M waits on the hm-registry branch; every other lookup must already be reviewed.
  const missing = retailers.flatMap(retailer => retailer.lookups).filter(name => !names.has(normalize(name)) && name !== 'H&M');
  assert.deepEqual(missing, []);
});
