import { assess, validateInput } from './assessment.js';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (!['/health', '/v1/assessments'].includes(path)) return error('not_found', 'Route not found.', 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const allowed = path === '/health' ? 'GET, OPTIONS' : 'POST, OPTIONS';
    if (request.method !== (path === '/health' ? 'GET' : 'POST')) {
      return json({ error: { code: 'method_not_allowed', message: `Use ${allowed}.` } }, 405, { Allow: allowed });
    }
    if (path === '/health') return json({ status: 'ok', service: 'naughty-list-api' });
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
      return error('invalid_input', 'Provide exactly one of brand (1-200 characters) or identifier {scheme, value}. Schemes: duns (9 digits), b_lab (directory slug).', 400);
    }
    return json(assess(input));
  }
};
