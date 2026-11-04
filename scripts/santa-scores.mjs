// Compute DRAFT Santa Scores (card 157 method) for the card 159 retailers.
// Reads published evidence through the public API; it never writes anything.
//   npm run scores                         markdown table, deployed API, today
//   npm run scores -- --json               machine-readable output
//   npm run scores -- --api http://localhost:8787 --as-of 2026-11-04
// Draft output only: do not publish it until card 157 is signed off.
import { parseArgs } from 'node:util';
import retailers from '../data/santa-retailers.js';
import { santaScore, METHOD_VERSION } from '../worker/scoring.js';

const { values } = parseArgs({ options: {
  api: { type: 'string', default: 'https://naughty-list-api.40for40.workers.dev' },
  'as-of': { type: 'string', default: new Date().toISOString().slice(0, 10) },
  json: { type: 'boolean', default: false }
} });

async function lookup(brand) {
  const response = await fetch(new URL('/v1/assessments', values.api), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brand })
  });
  if (!response.ok) throw new Error(`Lookup failed for ${brand}: HTTP ${response.status}`);
  const body = await response.json();
  return { matched: Boolean(body.company?.id), evidence: body.evidence ?? [] };
}

const LABEL = { nice: 'Nice', naughty: 'Naughty', not_enough_evidence: 'Not enough evidence' };
const describe = ({ record, coal, gift }) =>
  `${record.sourceId} ${(record.eventDate ?? record.publishedAt ?? (gift ? `checked ${record.checkedAt ?? ''}` : '')).slice(0, 18)}: ${record.outcome} (${gift ? `gift ${gift}` : `coal ${coal}`})`;

const rows = [];
for (const retailer of retailers) {
  const evidence = [];
  const unmatched = [];
  for (const brand of retailer.lookups) {
    const result = await lookup(brand);
    if (!result.matched) unmatched.push(brand);
    evidence.push(...result.evidence);
  }
  const score = santaScore(evidence, { asOf: values['as-of'] });
  const reviewed = retailer.lookups.length > unmatched.length;
  rows.push({ ...retailer, reviewed, unmatched, ...score });
}

if (values.json) {
  console.log(JSON.stringify({ method: METHOD_VERSION, draft: true, asOf: values['as-of'], api: values.api, rows }, null, 2));
} else {
  const cell = text => String(text).replaceAll('|', '\\|');
  console.log(`DRAFT Santa Scores, method ${METHOD_VERSION}, as of ${values['as-of']}. Not signed off; do not publish.\n`);
  console.log('| # | Retailer | Domain | Counted records | Total | Draft verdict | Note |');
  console.log('| ---: | --- | --- | --- | ---: | --- | --- |');
  for (const row of rows) {
    const counted = [...row.giftRecords, ...row.counted].map(describe).join('; ') || (row.reviewed ? 'None in window' : 'Not reviewed yet');
    const verdict = LABEL[row.verdict] + (row.warningShown ? ' (warning shown)' : '');
    const note = [row.note, row.unmatched.length ? `No registry match: ${row.unmatched.join(', ')}` : ''].filter(Boolean).join(' ');
    console.log(`| ${row.n} | ${cell(row.retailer)} | ${row.domain} | ${cell(counted)} | ${row.total ?? '–'} | ${verdict} | ${cell(note)} |`);
  }
  const count = key => rows.filter(row => row.verdict === key).length;
  console.log(`\n${count('nice')} Nice, ${count('naughty')} Naughty, ${count('not_enough_evidence')} not enough evidence (${rows.filter(row => row.warningShown).length} with a warning shown, ${rows.filter(row => !row.reviewed).length} not reviewed yet).`);
}
