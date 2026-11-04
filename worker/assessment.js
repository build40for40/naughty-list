import companies from './companies.js';

const normalize = (value) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const keys = Object.keys(input);
  if (keys.length !== 1) return false;
  if (keys[0] === 'brand') {
    return typeof input.brand === 'string' && input.brand.trim().length > 0 && input.brand.length <= 200;
  }
  if (keys[0] !== 'identifier') return false;
  const identifier = input.identifier;
  if (!identifier || typeof identifier !== 'object' || Array.isArray(identifier)) return false;
  if (Object.keys(identifier).length !== 2 || typeof identifier.value !== 'string') return false;
  if (identifier.scheme === 'duns') return /^[0-9]{9}$/.test(identifier.value);
  return identifier.scheme === 'b_lab' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier.value) && identifier.value.length <= 200;
}

export function assess(input, { registry = companies, now = new Date() } = {}) {
  const matches = registry.filter(company => input.brand !== undefined
    ? [company.name, ...company.aliases].some(name => normalize(name) === normalize(input.brand))
    : company.identifiers.some(identifier => identifier.scheme === input.identifier.scheme && identifier.value === input.identifier.value));
  const status = matches.length === 1 ? 'matched' : matches.length === 0 ? 'not_found' : 'ambiguous';
  const company = status === 'matched' ? matches[0] : null;
  const evidence = company?.bCorp;
  // validUntil is our evidence refresh deadline, not B Lab's certificate expiry.
  const fresh = evidence && now.getTime() < Date.parse(`${evidence.validUntil}T00:00:00Z`);
  const reason = !company ? status : !fresh ? 'stale_evidence' : null;
  return {
    schemaVersion: '1',
    input,
    match: { status },
    company: company ? { id: company.id, name: company.name, identifiers: company.identifiers } : null,
    criteria: {
      bCorp: {
        status: fresh ? 'verified' : 'unknown',
        certified: fresh ? evidence.certified : null,
        reason,
        source: evidence ? { name: 'B Lab', url: evidence.sourceUrl } : null,
        checkedAt: evidence?.checkedAt ?? null,
        validUntil: evidence?.validUntil ?? null
      }
    },
    scoring: { status: 'deferred', total: null, verdict: null }
  };
}
