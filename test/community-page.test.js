import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';

const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../web/community.js', import.meta.url), 'utf8').replace("import { createClient } from '@workos-inc/authkit-js';", 'const createClient = window.testCreateClient;');
const wait = () => new Promise(resolve => setTimeout(resolve, 25));

async function page(total, signedIn = false) {
  const window = new Window({ url: 'https://example.test/community/?brand=patagonia' });
  window.document.write(html.replace(/<script[^>]*>.*?<\/script>/s, ''));
  let currentTotal = total;
  let saved;
  const requests = [];
  const summary = () => ({ status: 'ready', total: currentTotal, nicePercentage: 100, minimumVotes: 20,
    counts: { nice: currentTotal, naughty: 0, unsure: 0 }, asOf: new Date().toISOString() });
  window.testCreateClient = async () => ({ getUser: () => signedIn ? { id: 'user_example' } : null, getAccessToken: async () => 'fixture-access-token' });
  window.fetch = async (path, options) => {
    requests.push({ path, options });
    if (path.endsWith('/config')) return Response.json({ signInAvailable: true, clientId: 'client_example' });
    if (path.endsWith('/brands')) return Response.json({ brands: [{ id: 'patagonia', name: 'Patagonia' }] });
    if (path === '/v1/assessments') return Response.json({ company: { id: 'patagonia' }, scoring: { verdict: null } });
    if (path.endsWith('/vote')) {
      if (options.method === 'PUT') { saved = JSON.parse(options.body); currentTotal++; return Response.json({ vote: { ...saved, expiresAt: '2027-11-04T12:00:00Z', reasons: [] }, community: summary() }); }
      if (options.method === 'DELETE') { currentTotal--; return Response.json({ vote: null, community: summary() }); }
      return Response.json({ vote: null });
    }
    return Response.json({ brand: { id: 'patagonia', name: 'Patagonia' }, community: summary() });
  };
  window.eval(script);
  await wait();
  return { window, requests, saved: () => saved };
}

test('voting page hides percentages from a malformed low-sample API response, while keeping results public', async () => {
  const { window, requests } = await page(19);
  assert.ok(!window.document.getElementById('score').textContent.includes('%'));
  assert.match(window.document.getElementById('score').textContent, /19 votes/);
  assert.equal(window.document.getElementById('vote-form').hidden, true);
  assert.ok(requests.every(request => !request.options?.headers?.Authorization));
  await window.happyDOM.abort();
});

test('signed-in saving crosses the baseline and withdrawal hides it, without changing our assessment', async () => {
  const { window, requests } = await page(19, true);
  const document = window.document;
  document.querySelector('[name="choice"][value="nice"]').checked = true;
  document.getElementById('vote-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await wait();
  assert.match(document.getElementById('score').textContent, /100% voted Nice · 20 votes/);
  assert.equal(document.getElementById('assessment').textContent, 'Awaiting assessment');
  const write = requests.find(request => request.options?.method === 'PUT');
  assert.equal(write.options.headers.Authorization, 'Bearer fixture-access-token');
  assert.deepEqual(JSON.parse(write.options.body), { choice: 'nice', reasons: [] });
  document.getElementById('withdraw').click();
  await wait();
  assert.ok(!document.getElementById('score').textContent.includes('%'));
  assert.match(document.getElementById('message').textContent, /withdrawn/);
  await window.happyDOM.abort();
});
