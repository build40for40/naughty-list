import { domainRelevance } from './relevance.js';

export const MIN_VOTES = 20;
export const REASONS = ['staff', 'communities', 'environment'];

export function voteExpiry(now) {
  const expires = new Date(now);
  // Clamp leap day to the last day of February next year.
  expires.setUTCFullYear(now.getUTCFullYear() + 1);
  if (expires.getUTCMonth() !== now.getUTCMonth()) expires.setUTCDate(0);
  return expires.toISOString();
}

export function validVote(input) {
  return input && typeof input === 'object' && !Array.isArray(input) &&
    Object.keys(input).every(key => ['choice', 'reasons'].includes(key)) &&
    ['nice', 'naughty', 'unsure'].includes(input.choice) &&
    (input.reasons === undefined || (Array.isArray(input.reasons) && input.reasons.length <= 3 &&
      new Set(input.reasons).size === input.reasons.length && input.reasons.every(reason => REASONS.includes(reason))));
}

export async function communityBrand(db, id) {
  const row = await db.prepare(`SELECT c.id, c.registry_json FROM companies c
    JOIN community_brands b ON b.company_id=c.id WHERE c.id=? AND b.enabled=1`).bind(id).first();
  if (!row) return null;
  const registry = JSON.parse(row.registry_json);
  // Only explicit reviewed brand shops qualify, never a retailer's product brands.
  if (registry.category && registry.category !== 'brand_shop') return null;
  if (!registry.domains?.length || !registry.domainEvidence?.sourceUrl || !registry.domainEvidence?.checkedAt) return null;
  if (!registry.domains.some(domain => domainRelevance(domain, {
    company: { id: row.id }, match: { status: 'matched', method: 'reviewed_domain' }
  }).eligibleForVerdict)) return null;
  return { id: row.id, name: registry.name };
}

export async function communitySummary(db, companyId, now = new Date()) {
  if (!await communityBrand(db, companyId)) return { status: 'unavailable', minimumVotes: MIN_VOTES, nicePercentage: null };
  const row = await db.prepare(`SELECT
    COALESCE(SUM(choice='nice'),0) AS nice,
    COALESCE(SUM(choice='naughty'),0) AS naughty,
    COALESCE(SUM(choice='unsure'),0) AS unsure
    FROM community_votes WHERE company_id=? AND excluded=0 AND expires_at>?`).bind(companyId, now.toISOString()).first();
  const total = row.nice + row.naughty;
  return {
    status: total >= MIN_VOTES ? 'ready' : 'early', minimumVotes: MIN_VOTES,
    total, counts: { nice: row.nice, naughty: row.naughty, unsure: row.unsure },
    nicePercentage: total >= MIN_VOTES ? Math.round(100 * row.nice / total) : null,
    asOf: now.toISOString(), window: 'unexpired_votes_last_12_months',
    disclaimer: 'Community opinion. Claims have not been verified.'
  };
}

// Atomic upsert prevents concurrent requests from bypassing the account limit.
export async function consumeVoteLimit(db, userId, now = new Date()) {
  const window = Math.floor(now.getTime() / 60000);
  const row = await db.prepare(`INSERT INTO community_rate_limits(user_id, window_start, attempts) VALUES(?,?,1)
    ON CONFLICT(user_id) DO UPDATE SET window_start=excluded.window_start,
      attempts=CASE WHEN community_rate_limits.window_start=excluded.window_start THEN community_rate_limits.attempts+1 ELSE 1 END
    RETURNING attempts`).bind(userId, window).first();
  return row.attempts <= 10;
}

export async function ownVote(db, companyId, userId, now = new Date()) {
  const row = await db.prepare(`SELECT choice, reasons_json, updated_at, expires_at, excluded
    FROM community_votes WHERE company_id=? AND user_id=?`).bind(companyId, userId).first();
  if (!row) return null;
  return { choice: row.choice, reasons: JSON.parse(row.reasons_json), updatedAt: row.updated_at,
    expiresAt: row.expires_at, expired: row.expires_at <= now.toISOString(), excluded: row.excluded === 1 };
}

export async function saveVote(db, companyId, userId, input, now = new Date()) {
  const date = now.toISOString();
  const burstWindow = Math.floor(now.getTime() / 600000);
  await db.batch([
    db.prepare(`INSERT INTO community_votes(company_id,user_id,choice,reasons_json,updated_at,expires_at) VALUES(?,?,?,?,?,?)
      ON CONFLICT(company_id,user_id) DO UPDATE SET choice=excluded.choice, reasons_json=excluded.reasons_json,
        updated_at=excluded.updated_at, expires_at=excluded.expires_at`).bind(companyId, userId, input.choice, JSON.stringify(input.reasons ?? []), date, voteExpiry(now)),
    // A burst flags a review; it never silently changes anybody's vote.
    db.prepare(`INSERT OR IGNORE INTO community_review_flags(company_id,window_start,created_at)
      SELECT ?,?,? WHERE (SELECT COUNT(*) FROM community_votes WHERE company_id=? AND updated_at>=?)>=30`)
      .bind(companyId, burstWindow, date, companyId, new Date(now.getTime() - 600000).toISOString())
  ]);
}

export async function withdrawVote(db, companyId, userId) {
  // Preserve an exclusion marker so withdrawing and voting again cannot bypass moderation.
  await db.prepare(`DELETE FROM community_votes WHERE company_id=? AND user_id=? AND excluded=0`).bind(companyId, userId).run();
  await db.prepare(`UPDATE community_votes SET choice='unsure', reasons_json='[]', expires_at='1970-01-01T00:00:00.000Z'
    WHERE company_id=? AND user_id=? AND excluded=1`).bind(companyId, userId).run();
}
