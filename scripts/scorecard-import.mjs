// Build the Santa Score report card (card 157 draft v0.4) from two gov.uk
// open-data downloads (Open Government Licence v3.0):
//   gender pay gap:    https://gender-pay-gap.service.gov.uk/viewing/download-data/<year>
//   payment practices: https://check-payment-practices.service.gov.uk/export/csv/
// Usage:
//   npm run scorecard -- --pay-gap gpg-2025.csv --payments pp.csv --as-of 2026-11-04
// Writes data/santa-scorecard.json. Every value is validated before anything is
// written; a filing that fails validation is left out, never scored as bad.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import filings from '../data/santa-filings.js';
import retailers from '../data/santa-retailers.js';
import { scorecardThresholds, PAYMENTS_MAX_AGE_MONTHS } from '../worker/scoring.js';

const { values } = parseArgs({ options: {
  'pay-gap': { type: 'string' },
  payments: { type: 'string' },
  'as-of': { type: 'string', default: new Date().toISOString().slice(0, 10) },
  out: { type: 'string', default: new URL('../data/santa-scorecard.json', import.meta.url).pathname }
} });
if (!values['pay-gap'] || !values.payments) throw new Error('Pass --pay-gap <csv> and --payments <csv>');
const asOf = values['as-of'];

// RFC 4180 CSV: quoted fields may contain commas, quotes and newlines.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  header[0] = header[0].replace(/^﻿/, '');
  return body.filter(r => r.length === header.length).map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const read = path => parseCsv(readFileSync(path, 'utf8'));
const number = value => (value === '' || value == null || Number.isNaN(Number(value)) ? null : Number(value));
const isoDay = value => (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(value ?? '') ? value.slice(0, 10).replaceAll('/', '-') : null);

const payGapRows = read(values['pay-gap']);
const paymentRows = read(values.payments);
const oldestPaymentsEnd = (() => {
  const d = new Date(`${asOf}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - PAYMENTS_MAX_AGE_MONTHS);
  return d.toISOString().slice(0, 10);
})();

function payGapFor(companyNumber) {
  const row = payGapRows.find(r => r.CompanyNumber === companyNumber);
  if (!row) return null;
  const median = number(row.DiffMedianHourlyPercent);
  if (median === null || median < -100 || median > 100) return null;
  const dueDate = isoDay(row.DueDate);
  return {
    employer: row.EmployerName, companyNumber, employerId: row.EmployerId,
    snapshotYear: dueDate ? Number(dueDate.slice(0, 4)) - 1 : null,
    medianHourlyGapPercent: median,
    submittedLate: String(row.SubmittedAfterTheDeadline).toLowerCase() === 'true',
    dueDate, submittedAt: isoDay(row.DateSubmitted),
    sourceUrl: `https://gender-pay-gap.service.gov.uk/employers/${row.EmployerId}`
  };
}

function paymentsFor(companyNumber) {
  const candidates = paymentRows
    .filter(r => r['Company number'] === companyNumber && isoDay(r['End date']) >= oldestPaymentsEnd && isoDay(r['End date']) <= asOf)
    .sort((a, b) => (isoDay(b['End date']) ?? '').localeCompare(isoDay(a['End date']) ?? ''));
  for (const row of candidates) {
    const late = number(row['% Invoices not paid within agreed terms']);
    if (late === null || late < 0 || late > 100) continue;
    return {
      company: row.Company, companyNumber, reportId: row['Report Id'],
      periodStart: isoDay(row['Start date']), periodEnd: isoDay(row['End date']), filedAt: isoDay(row['Filing date']),
      lateInvoicePercent: late,
      sourceUrl: `https://check-payment-practices.service.gov.uk/report/${row["Report Id"]}/`
    };
  }
  return null;
}

const shops = {};
for (const retailer of retailers) {
  const filing = filings[retailer.n];
  if (!filing) throw new Error(`No santa-filings entry for retailer ${retailer.n}`);
  shops[retailer.n] = {
    retailer: retailer.retailer,
    payGap: filing.payGap ? payGapFor(filing.payGap) : null,
    payments: filing.payments ? paymentsFor(filing.payments) : null
  };
}

const thresholds = scorecardThresholds(Object.values(shops));
const output = {
  draft: true, method: 'santa-v0.4-draft', asOf, licence: 'Open Government Licence v3.0',
  sources: {
    payGap: 'https://gender-pay-gap.service.gov.uk/viewing/download-data',
    payments: 'https://check-payment-practices.service.gov.uk/export/csv/'
  },
  thresholds, shops
};
writeFileSync(values.out, `${JSON.stringify(output, null, 1)}\n`);
const has = key => Object.values(shops).filter(s => s[key]).length;
console.log(`Wrote ${values.out}: pay gap ${has('payGap')}, payments ${has('payments')}, either ${Object.values(shops).filter(s => s.payGap || s.payments).length} of ${retailers.length}.`);
console.log('Thresholds:', JSON.stringify(thresholds));
