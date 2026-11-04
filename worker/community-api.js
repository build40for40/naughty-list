import { verifiedVoter } from './auth.js';
import { communityBrand, communitySummary, consumeVoteLimit, ownVote, saveVote, validVote, withdrawVote, MIN_VOTES } from './community.js';

export async function communityApi(request, env, { json, error, readBody, authenticate = verifiedVoter }) {
  const path = new URL(request.url).pathname;
  const match = path.match(/^\/v1\/community\/brands\/([a-z0-9-]{1,100})(\/vote)?$/);
  const allowed = match?.[2] ? ['GET', 'PUT', 'DELETE'] : ['GET'];
  if (request.method === 'OPTIONS') return json(null, 200);
  if (!allowed.includes(request.method)) return json({ error: { code: 'method_not_allowed', message: `Use ${allowed.join(', ')}.` } }, 405, { Allow: [...allowed, 'OPTIONS'].join(', ') });
  if (path === '/v1/community/config') return json({ minimumVotes: MIN_VOTES,
    clientId: env.WORKOS_CLIENT_ID || null, signInAvailable: Boolean(env.WORKOS_CLIENT_ID && env.WORKOS_API_KEY) });
  if (!env.DB) return error('service_unavailable', 'Community voting is unavailable.', 503);
  if (path === '/v1/community/brands') {
    const { results } = await env.DB.prepare('SELECT company_id FROM community_brands WHERE enabled=1 ORDER BY company_id').all();
    const brands = [];
    for (const row of results) {
      const brand = await communityBrand(env.DB, row.company_id);
      if (brand) brands.push(brand);
    }
    return json({ brands });
  }
  if (!match) return error('not_found', 'Route not found.', 404);
  const id = match[1];
  const brand = await communityBrand(env.DB, id);
  if (!brand) return error('brand_unavailable', 'Voting requires an enrolled, reviewed brand shop.', 404);
  if (!match[2]) return json({ brand, community: await communitySummary(env.DB, id) });
  const voter = await authenticate(request, env);
  if (voter.error) return error(voter.error, voter.status === 403 ? 'Verify your email through sign-in before voting.' : voter.status === 401 ? 'Please sign in.' : 'Sign-in is not configured.', voter.status);
  if (request.method === 'GET') return json({ vote: await ownVote(env.DB, id, voter.userId) });
  if (!await consumeVoteLimit(env.DB, voter.userId)) return json({ error: { code: 'rate_limited', message: 'Too many changes. Please wait a minute.' } }, 429, { 'Retry-After': '60' });
  if (request.method === 'DELETE') {
    await withdrawVote(env.DB, id, voter.userId);
    return json({ vote: null, community: await communitySummary(env.DB, id) });
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return error('unsupported_media_type', 'Send application/json.', 415);
  let input;
  try {
    const body = await readBody(request);
    if (body === null) return error('body_too_large', 'Maximum request size is 4096 bytes.', 413);
    input = JSON.parse(body);
  } catch { return error('invalid_json', 'Send a valid JSON body.', 400); }
  if (!validVote(input)) return error('invalid_vote', 'Choose nice, naughty or unsure, with optional staff, communities or environment reasons.', 400);
  await saveVote(env.DB, id, voter.userId, input);
  return json({ vote: await ownVote(env.DB, id, voter.userId), community: await communitySummary(env.DB, id) });
}
