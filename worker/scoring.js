// Santa Score v0.4, approved for release by Samira on card 157 (4 Nov 2026), superseding v0.3.
// Scores assess the matched business, never a product. See docs/scoring.md.
export const METHOD_VERSION = 'santa-v0.4';
export const WINDOW_YEARS = 3;
// Report card (v0.4): statutory gov.uk filings that every large UK employer makes.
export const PAYMENTS_MAX_AGE_MONTHS = 18;
export const PAY_GAP_MAX_AGE_YEARS = 2;

// Proven wrongdoing: a court, regulator or government found it happened.
const PROVEN = new Set(['government_naming', 'guilty_plea_and_fine', 'guilty_plea', 'conviction', 'fine', 'stop_sale_order', 'civil_settlement', 'order']);
// Warnings: the practice was real and a regulator stepped in, but nothing was proven or admitted.
const WARNING = new Set(['undertaking', 'undertakings', 'revised_undertakings', 'commitments']);
const COAL = { proven: 2, warning: 1 };
// Minimum-wage namings under £1,000 in total are shown but earn no coal (card 157, 4 Nov).
export const MIN_UNDERPAYMENT_GBP = 1000;

const day = value => (typeof value === 'string' ? value.slice(0, 10) : null);

export function windowStart(asOf) {
  const date = new Date(`${asOf}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - WINDOW_YEARS);
  return date.toISOString().slice(0, 10);
}

function isGift(record, asOf) {
  if (record.sourceId !== 'b-lab' || record.outcome !== 'certified' || record.facts?.certified !== true) return false;
  if (record.freshness && record.freshness !== 'fresh') return false;
  return !record.refreshDueAt || day(record.refreshDueAt) >= asOf;
}

function kindOf(record) {
  if (PROVEN.has(record.outcome)) return 'proven';
  if (WARNING.has(record.outcome)) return 'warning';
  return null;
}

// Quartiles by the "exclusive" method (Python's statistics.quantiles default).
function quartiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n < 4) return null;
  const at = p => {
    const pos = p * (n + 1);
    const lo = Math.min(Math.max(Math.floor(pos), 1), n - 1);
    return sorted[lo - 1] + (pos - lo) * (sorted[lo] - sorted[lo - 1]);
  };
  const round = x => Math.round(x * 100) / 100;
  return { best: round(at(0.25)), worst: round(at(0.75)) };
}

/**
 * Report-card thresholds, frozen per publication from the retailers being
 * scored: the best quarter earns a gift, the worst quarter one coal.
 * Pay gap uses the size of the median hourly gap in either direction.
 */
export function scorecardThresholds(shops) {
  const gaps = shops.map(s => s.payGap?.medianHourlyGapPercent).filter(Number.isFinite).map(Math.abs);
  const late = shops.map(s => s.payments?.lateInvoicePercent).filter(Number.isFinite);
  return { payGapAbsMedianPercent: quartiles(gaps), lateInvoicePercent: quartiles(late) };
}

function reportCard(scorecard, thresholds, asOf) {
  const items = [];
  const rate = (value, band) => (!band ? 0 : value <= band.best ? 1 : value >= band.worst ? -1 : 0);
  const gap = scorecard?.payGap;
  if (gap && Number.isFinite(gap.medianHourlyGapPercent) && gap.snapshotYear >= Number(asOf.slice(0, 4)) - PAY_GAP_MAX_AGE_YEARS) {
    items.push({ measure: 'pay_gap', value: gap.medianHourlyGapPercent, points: rate(Math.abs(gap.medianHourlyGapPercent), thresholds?.payGapAbsMedianPercent), submittedLate: Boolean(gap.submittedLate), filing: gap });
  }
  const pay = scorecard?.payments;
  const oldest = new Date(`${asOf}T00:00:00Z`);
  oldest.setUTCMonth(oldest.getUTCMonth() - PAYMENTS_MAX_AGE_MONTHS);
  if (pay && Number.isFinite(pay.lateInvoicePercent) && pay.lateInvoicePercent >= 0 && pay.lateInvoicePercent <= 100 && day(pay.periodEnd) >= oldest.toISOString().slice(0, 10)) {
    items.push({ measure: 'late_invoices', value: pay.lateInvoicePercent, points: rate(pay.lateInvoicePercent, thresholds?.lateInvoicePercent), filing: pay });
  }
  return items;
}

/**
 * Score one company's published evidence records (the API's `evidence` array).
 * Records from several reviewed entities may be passed together when the
 * owner rule groups brands under one company; duplicates are counted once.
 */
export function santaScore(evidence, { asOf, scorecard = null, thresholds = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? '')) throw new Error('asOf must be YYYY-MM-DD');
  const start = windowStart(asOf);
  const seen = new Set();
  const gifts = [];
  const counted = [];
  const history = [];
  for (const record of evidence) {
    const key = `${record.sourceId}:${record.sourceRecordId ?? record.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (isGift(record, asOf)) { gifts.push({ record, gift: 1 }); continue; }
    const kind = kindOf(record);
    const date = day(record.eventDate) ?? day(record.publishedAt);
    const datedByPublication = !day(record.eventDate) && Boolean(day(record.publishedAt));
    if (!kind) history.push({ record, reason: record.outcome === 'practice_changed' ? 'changed_its_ways' : 'not_scored' });
    else if (record.outcome === 'government_naming' && Number(record.facts?.underpaymentGBP) < MIN_UNDERPAYMENT_GBP) history.push({ record, reason: 'below_threshold' });
    else if (!date || date < start || date > asOf) history.push({ record, reason: !date ? 'undated' : date > asOf ? 'future_dated' : 'older_than_window' });
    else counted.push({ record, kind, coal: COAL[kind], date, datedByPublication });
  }
  // Repeats double: the worst incident's coal, doubled for each further
  // incident in the window (offences: 2, 4, 8, 16; warnings: 1, 2, 4).
  const worst = Math.max(0, ...counted.map(item => item.coal));
  const coal = counted.length ? worst * 2 ** (counted.length - 1) : 0;
  const incidentTotal = gifts.length - coal;
  const card = reportCard(scorecard, thresholds, asOf);
  const cardPoints = card.reduce((sum, item) => sum + item.points, 0);
  // Report-card gifts can balance warnings but never cancel a proven offence.
  const hasProven = counted.some(item => item.kind === 'proven');
  const hasRecord = gifts.length > 0 || counted.length > 0 || card.length > 0;
  const total = !hasRecord ? null : hasProven ? Math.min(incidentTotal, incidentTotal + cardPoints) : incidentTotal + cardPoints;
  const verdict = !hasRecord ? 'not_enough_evidence' : total >= 0 ? 'nice' : total <= -2 ? 'naughty' : 'watch_list';
  return {
    method: METHOD_VERSION, asOf, windowStart: start,
    gifts: gifts.length, coal, reportCardPoints: cardPoints, total, verdict,
    warningShown: counted.some(item => item.kind === 'warning') && verdict !== 'naughty',
    counted, giftRecords: gifts, reportCard: card, history
  };
}
