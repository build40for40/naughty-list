import { validateInput } from './assessment.js';
import { assessStored, sourceCoverage } from './store.js';
import { syncSources } from './imports.js';
import { communityApi } from './community-api.js';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
const error = (code, message, status) => json({ error: { code, message } }, status);
const MAX_BODY_BYTES = 4096;

async function readBody(request) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(body);
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare('DELETE FROM community_votes WHERE excluded=0 AND expires_at<=?').bind(new Date().toISOString()),
      env.DB.prepare('DELETE FROM community_rate_limits WHERE window_start<?').bind(Math.floor(Date.now() / 60000) - 1440)
    ]));
    ctx.waitUntil(syncSources(env.DB, { credentials: env }).then(results => {
      console.log(JSON.stringify({ event: 'source_sync', results }));
      if (results.some(result => result.status === 'failed')) throw new Error('One or more source imports failed');
    }));
  },
  async fetch(request, env = {}) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/community/') || path === '/community') {
      if (!env.ASSETS) return error('not_found', 'Voting page has not been built.', 404);
      const assetUrl = new URL(request.url);
      if (['/community', '/community/', '/community/login'].includes(path)) assetUrl.pathname = '/community/index.html';
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      const secured = new Response(response.body, response);
      secured.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://api.workos.com; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      secured.headers.set('Referrer-Policy', 'no-referrer');
      secured.headers.set('X-Content-Type-Options', 'nosniff');
      secured.headers.set('Cache-Control', 'no-store');
      return secured;
    }
    if (path.startsWith('/v1/community/')) {
      try { return await communityApi(request, env, { json, error, readBody }); }
      catch { return error('service_unavailable', 'Community voting is unavailable. Please try again.', 503); }
    }
    if (!['/health', '/v1/assessments', '/v1/sources'].includes(path)) return error('not_found', 'Route not found.', 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const isRead = path !== '/v1/assessments';
    const allowed = isRead ? 'GET, OPTIONS' : 'POST, OPTIONS';
    if (request.method !== (isRead ? 'GET' : 'POST')) {
      return json({ error: { code: 'method_not_allowed', message: `Use ${allowed}.` } }, 405, { Allow: allowed });
    }
    if (isRead) {
      try {
        if (!env.DB) throw new Error('Database binding missing');
        if (path === '/v1/sources') return json({ sources: await sourceCoverage(env.DB) });
        const row = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM companies) AS companies, (SELECT COUNT(*) FROM sources) AS sources').first();
        if (!row?.companies || !row?.sources) throw new Error('Database has not been seeded');
        return json({ status: 'ok', service: 'naughty-list-api', storage: 'd1' });
      } catch { return error('service_unavailable', 'Evidence store is unavailable.', 503); }
    }
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return error('unsupported_media_type', 'Send application/json.', 415);
    }
    let input;
    try {
      const body = await readBody(request);
      if (body === null) return error('body_too_large', 'Maximum request size is 4096 bytes.', 413);
      input = JSON.parse(body);
    } catch {
      return error('invalid_json', 'Send a valid JSON body.', 400);
    }
    if (!validateInput(input)) {
      return error('invalid_input', 'Provide exactly one of domain (hostname only), brand (1-200 characters) or identifier {scheme, value}. Schemes: duns (9 digits), b_lab (directory slug).', 400);
    }
    try {
      if (!env.DB) throw new Error('Database binding missing');
      return json(await assessStored(input, env.DB));
    } catch { return error('service_unavailable', 'Evidence store is unavailable.', 503); }
  }
};
