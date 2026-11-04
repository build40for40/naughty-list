import test from 'node:test';
import assert from 'node:assert/strict';
import { santaScore, windowStart, scorecardThresholds, METHOD_VERSION } from '../worker/scoring.js';
import filings from '../data/santa-filings.js';
import scorecardData from '../data/santa-scorecard.json' with { type: 'json' };
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

test('the approved method has a stable version', () => {
  assert.equal(METHOD_VERSION, 'santa-v0.4');
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

test('a single warning goes on the watch list, not Naughty, and is shown', () => {
  const score = santaScore([record('undertakings', '2024-03-27')], { asOf });
  assert.deepEqual([score.coal, score.total, score.verdict, score.warningShown], [1, -1, 'watch_list', true]);
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
  assert.deepEqual([score.total, score.verdict, score.warningShown], [0, 'nice', true]);
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
  assert.equal(score.total, null);
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

// Report card (v0.4)
const thresholds = { payGapAbsMedianPercent: { best: 1.25, worst: 6.94 }, lateInvoicePercent: { best: 2, worst: 20 } };
const card = (gap, late, extra = {}) => ({
  payGap: gap === null ? null : { medianHourlyGapPercent: gap, snapshotYear: 2025, submittedLate: false },
  payments: late === null ? null : { lateInvoicePercent: late, periodEnd: '2026-06-30' },
  ...extra
});
const score = (evidence, scorecard) => santaScore(evidence, { asOf, scorecard, thresholds });

test('a middling report card is a counted record: neutral with evidence is Nice', () => {
  const result = score([], card(3, 8));
  assert.deepEqual([result.reportCardPoints, result.total, result.verdict], [0, 0, 'nice']);
});

test('best quarter earns a gift, worst quarter one coal; the pay gap counts in either direction', () => {
  assert.equal(score([], card(-0.3, 0)).total, 2);
  assert.equal(score([], card(-36, 25)).total, -2);
  assert.equal(score([], card(-36, 25)).verdict, 'naughty');
  assert.equal(score([], card(1.25, 20)).reportCardPoints, 0);
});

test('report-card gifts balance a warning but never cancel a proven offence', () => {
  assert.equal(score([record('undertakings', '2024-03-27')], card(0, 0)).verdict, 'nice');
  const offence = score([proven('2026-09-03')], card(0, 0));
  assert.deepEqual([offence.total, offence.verdict], [-2, 'naughty']);
  assert.equal(score([proven('2026-09-03')], card(20, 30)).total, -4);
});

test('report-card coal never doubles as a repeat incident', () => {
  const result = score([record('undertakings', '2024-03-27')], card(20, 30));
  assert.deepEqual([result.coal, result.total], [1, -3]);
});

test('stale, missing or invalid filings are left out, never scored as bad', () => {
  assert.equal(score([], card(null, null)).verdict, 'not_enough_evidence');
  assert.equal(score([], { payments: { lateInvoicePercent: 50, periodEnd: '2025-01-31' } }).verdict, 'not_enough_evidence');
  assert.equal(score([], { payGap: { medianHourlyGapPercent: 2, snapshotYear: 2022 } }).verdict, 'not_enough_evidence');
  assert.equal(score([], { payments: { lateInvoicePercent: 4323394, periodEnd: '2026-06-30' } }).verdict, 'not_enough_evidence');
});

test('thresholds are quartiles of the scored retailers', () => {
  const shops = [0, 1, 2, 3, 4, 5, 6, 7].map(v => ({ payGap: { medianHourlyGapPercent: -v }, payments: { lateInvoicePercent: v } }));
  assert.deepEqual(scorecardThresholds(shops), { payGapAbsMedianPercent: { best: 1.25, worst: 5.75 }, lateInvoicePercent: { best: 1.25, worst: 5.75 } });
});

test('every card 159 retailer has a filings entry and the scorecard data matches it', () => {
  assert.deepEqual(retailers.map(r => r.n).filter(n => !filings[n]), []);
  assert.deepEqual(scorecardData.thresholds, scorecardThresholds(Object.values(scorecardData.shops)));
  for (const r of retailers) {
    const shop = scorecardData.shops[r.n];
    if (shop.payGap) assert.equal(shop.payGap.companyNumber, filings[r.n].payGap);
    if (shop.payments) assert.equal(shop.payments.companyNumber, filings[r.n].payments);
  }
});

test('future-dated incidents do not change today’s score', () => {
  const score = santaScore([proven('2027-01-01')], { asOf });
  assert.equal(score.total, null);
  assert.equal(score.history[0].reason, 'future_dated');
});
