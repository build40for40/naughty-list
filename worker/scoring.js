// Santa Score: DRAFT method from card 157 (see docs/scoring.md).
// Not signed off. The public API must keep scoring.total and scoring.verdict
// null until Samira and Ben agree the method on card 157, so nothing in
// worker/index.js or worker/store.js imports this module yet.

export const METHOD_VERSION = 'santa-v0.3-draft';
export const WINDOW_YEARS = 3;

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

/**
 * Score one company's published evidence records (the API's `evidence` array).
 * Records from several reviewed entities may be passed together when the
 * owner rule groups brands under one company; duplicates are counted once.
 */
export function santaScore(evidence, { asOf }) {
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
    else if (!date || date < start) history.push({ record, reason: date ? 'older_than_window' : 'undated' });
    else counted.push({ record, kind, coal: COAL[kind], date, datedByPublication });
  }
  // Repeats double: the worst incident's coal, doubled for each further
  // incident in the window (offences: 2, 4, 8, 16; warnings: 1, 2, 4).
  const worst = Math.max(0, ...counted.map(item => item.coal));
  const coal = counted.length ? worst * 2 ** (counted.length - 1) : 0;
  const hasRecord = gifts.length > 0 || counted.length > 0;
  const total = hasRecord ? gifts.length - coal : null;
  const verdict = !hasRecord ? 'not_enough_evidence' : total >= 0 ? 'nice' : total <= -2 ? 'naughty' : 'not_enough_evidence';
  return {
    method: METHOD_VERSION, asOf, windowStart: start,
    gifts: gifts.length, coal, total, verdict,
    warningShown: verdict === 'not_enough_evidence' && counted.length > 0,
    counted, giftRecords: gifts, history
  };
}
