import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { runInNewContext } from 'node:vm';
import '../extension/shared.js';
import '../extension/lookup.js';

const lib = globalThis.NaughtyList;
const source = name => readFileSync(new URL(`../extension/${name}`, import.meta.url), 'utf8');
const product = '<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"24.00","priceCurrency":"GBP"}}</script>';
const cart = '<button>Add to basket</button>';
function page(html = '', url = 'https://www.patagonia.com/product') {
  const window = new Window({ url });
  window.document.body.innerHTML = html;
  return window;
}
const assessment = {
  schemaVersion: '1', company: { id: 'patagonia', name: 'Patagonia' },
  match: { status: 'matched' }, criteria: { bCorp: { certified: true, checkedAt: '2026-11-04', source: { url: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/patagonia-inc/' } } },
  relevance: { category: 'brand_shop', eligibleForVerdict: true }, scoring: { status: 'deferred', total: null, verdict: null }
};

test('shopping detection requires purchase controls and prices, not just Product metadata', () => {
  for (const [html, expected] of [
    [product, false], [cart, false], [`<script type="application/ld+json">{"@type":"Product"}</script>${cart}`, false],
    [`${product}${cart}`, true], [`${product}<button disabled>Add to cart</button>`, false],
    [`${product}<div hidden>${cart}</div>`, false],
    [`${product}<div style="display:none">${cart}</div>`, false],
    [`<script type="application/ld+json">{"@graph":[{"@type":["Thing","Product"],"offers":{"price":0}}]}</script>${cart}`, true],
    [`<meta property="og:type" content="product"><meta property="product:price:amount" content="12.50">${cart}`, true],
    [`<p>An article discussing a £20 product.</p>${cart}`, false],
    [`<script type="application/ld+json">{broken</script>${cart}`, false]
  ]) {
    const window = page(html);
    assert.equal(lib.shoppingSignals(window.document).candidate, expected, html);
    window.happyDOM.abort();
  }
});

test('B Corp or missing evidence never manufacture a naughty/nice verdict', () => {
  assert.equal(lib.viewModel(assessment).tone, 'neutral');
  assert.equal(lib.viewModel({ ...assessment, criteria: { bCorp: { certified: false } } }).tone, 'neutral');
  assert.equal(lib.viewModel({ ...assessment, scoring: { verdict: 'nice' } }).tone, 'nice');
  assert.equal(lib.viewModel({ ...assessment, scoring: { verdict: 'naughty' } }).tone, 'naughty');
  for (const category of ['unknown', 'retailer', 'marketplace', 'unrelated']) {
    assert.equal(lib.viewModel({ ...assessment, relevance: { category, eligibleForVerdict: false }, scoring: { verdict: 'nice' } }).tone, 'neutral');
  }
});

test('settings validate position and default to bottom right', () => {
  assert.deepEqual(lib.settings(), { enabled: true, position: 'bottom-right' });
  assert.deepEqual(lib.settings({ enabled: false, position: 'top-left' }), { enabled: false, position: 'top-left' });
  assert.equal(lib.settings({ position: 'javascript:bad' }).position, 'bottom-right');
});

test('background accepts only top-frame messages for the sender hostname', async () => {
  let listener;
  let lookedUp;
  let response;
  const chrome = {
    storage: { local: { get: async () => ({}) } },
    runtime: { onMessage: { addListener: value => { listener = value; } }, openOptionsPage() {} }
  };
  runInNewContext(source('background.js'), { URL, fetch, chrome, NaughtyList: { ...lib, createLookup: () => async domain => { lookedUp = domain; return assessment; } } });
  for (const sender of [{ frameId: 1, url: 'https://patagonia.com' }, { frameId: 0, url: 'http://patagonia.com' }, { frameId: 0, url: 'https://example.test' }]) {
    assert.equal(listener({ type: 'assess-domain', domain: 'patagonia.com' }, sender, () => {}), false);
  }
  assert.equal(lookedUp, undefined);
  assert.equal(listener({ type: 'assess-domain', domain: 'patagonia.com' }, { frameId: 0, url: 'https://patagonia.com/product?private=test' }, value => { response = value; }), true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(lookedUp, 'patagonia.com');
  assert.equal(response.assessment.company.id, 'patagonia');
});

test('lookup sends only hostname, deduplicates concurrent requests and persists a bounded session cache', async () => {
  let calls = 0;
  let time = 0;
  let stored;
  const fetcher = async (url, init) => {
    calls++;
    assert.equal(url, 'https://naughty-list-api.40for40.workers.dev/v1/assessments');
    assert.deepEqual(JSON.parse(init.body), { domain: 'www.patagonia.com' });
    assert.equal(init.credentials, 'omit');
    assert.equal(init.referrerPolicy, 'no-referrer');
    return Response.json(assessment);
  };
  const options = { fetcher, readCache: async () => stored, writeCache: async value => { stored = value; }, now: () => time };
  const lookup = lib.createLookup(options);
  const [one, two] = await Promise.all([lookup('WWW.PATAGONIA.COM'), lookup('www.patagonia.com')]);
  assert.deepEqual(one, two);
  assert.equal(calls, 1);
  await lib.createLookup(options)('www.patagonia.com');
  assert.equal(calls, 1, 'cache survives a background restart');
  time = 300001;
  await lookup('www.patagonia.com');
  assert.equal(calls, 2, 'expired entries are rechecked');
  await assert.rejects(lookup('https://www.patagonia.com/product'), /Invalid hostname/);
});

test('lookup failures remain retryable and old backends fail closed for verdicts', async () => {
  let count = 0;
  const lookup = lib.createLookup({ readCache: async () => ({}), writeCache: async () => {}, fetcher: async () => {
    if (++count === 1) return new Response('', { status: 503 });
    const { relevance, ...oldResponse } = assessment;
    return Response.json(oldResponse);
  } });
  await assert.rejects(lookup('patagonia.com'), /unavailable/);
  const result = await lookup('patagonia.com');
  assert.equal(result.relevance.eligibleForVerdict, false);
});

test('overlay renders neutral evidence, follows settings and sends no product details', async () => {
  const window = page(product + cart);
  const messages = [];
  let onChange;
  window.chrome = {
    storage: { local: { get: async () => ({ settings: { position: 'top-left' } }) }, onChanged: { addListener: listener => { onChange = listener; } } },
    runtime: { sendMessage: async message => { messages.push(message); return { assessment }; } }
  };
  window.eval(source('shared.js'));
  window.eval(source('content.js'));
  await new Promise(resolve => setTimeout(resolve, 600));
  const host = window.document.querySelector('#naughty-list-stamp');
  assert.ok(host);
  assert.equal(host.style.top, '16px');
  assert.equal(host.style.left, '16px');
  assert.match(host.shadowRoot.textContent, /Not enough evidence for a verdict/);
  assert.match(host.shadowRoot.textContent, /B Corp certification recorded/);
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{ type: 'assess-domain', domain: 'www.patagonia.com' }]);
  window.document.body.append(window.document.createElement('div'));
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(messages.length, 1);
  onChange({ settings: { newValue: { enabled: false } } }, 'local');
  assert.equal(window.document.querySelector('#naughty-list-stamp'), null);
  await window.happyDOM.abort();
});

test('a review page sends no request and renders no stamp', async () => {
  const window = page(product);
  let calls = 0;
  window.chrome = { storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } }, runtime: { sendMessage: async () => { calls++; } } };
  window.eval(source('shared.js')); window.eval(source('content.js'));
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(calls, 0);
  assert.equal(window.document.querySelector('#naughty-list-stamp'), null);
  await window.happyDOM.abort();
});

test('stamp avoids purchase controls and hides when no corner is clear', async () => {
  const window = page(product + cart);
  let allBlocked = false;
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.id === 'naughty-list-stamp') {
      const left = this.style.left === '16px' ? 16 : 284;
      const top = this.style.top === '16px' ? 16 : 284;
      return { left, top, right: left + 200, bottom: top + 200, width: 200, height: 200 };
    }
    if (this.tagName === 'BUTTON' && this.textContent === 'Add to basket') {
      return allBlocked ? { left: 0, top: 0, right: 500, bottom: 500, width: 500, height: 500 }
        : { left: 400, top: 400, right: 480, bottom: 480, width: 80, height: 80 };
    }
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  };
  window.chrome = { storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } }, runtime: { sendMessage: async () => ({ assessment }) } };
  window.eval(source('shared.js')); window.eval(source('content.js'));
  await new Promise(resolve => setTimeout(resolve, 750));
  const host = window.document.querySelector('#naughty-list-stamp');
  assert.equal(host.style.left, '16px', 'bottom-left is clear when bottom-right covers Add to basket');
  assert.equal(host.style.visibility, 'visible');
  allBlocked = true;
  window.dispatchEvent(new window.Event('resize'));
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(host.style.visibility, 'hidden');
  await window.happyDOM.abort();
});

test('navigation removes a pending stamp and an old response cannot restore it on a review page', async () => {
  const window = page(product + cart);
  let finish;
  let calls = 0;
  window.chrome = {
    storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } },
    runtime: { sendMessage: () => { calls++; return new Promise(resolve => { finish = resolve; }); } }
  };
  window.eval(source('shared.js')); window.eval(source('content.js'));
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.match(window.document.querySelector('#naughty-list-stamp').shadowRoot.textContent, /Checking the list/);
  window.history.pushState({}, '', '/review');
  window.document.body.innerHTML = product;
  await new Promise(resolve => setTimeout(resolve, 600));
  finish({ assessment });
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(window.document.querySelector('#naughty-list-stamp'), null);
  assert.equal(calls, 1);
  await window.happyDOM.abort();
});

test('error state offers an explicit retry and settings form persists validated choices', async () => {
  const window = page(product + cart);
  let calls = 0;
  window.chrome = {
    storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } },
    runtime: { sendMessage: async () => ++calls === 1 ? { error: 'unavailable' } : { assessment } }
  };
  window.eval(source('shared.js')); window.eval(source('content.js'));
  await new Promise(resolve => setTimeout(resolve, 600));
  const shadow = window.document.querySelector('#naughty-list-stamp').shadowRoot;
  assert.match(shadow.textContent, /could not check/);
  [...shadow.querySelectorAll('button')].find(button => button.textContent === 'Try again').click();
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(calls, 2);
  assert.match(window.document.querySelector('#naughty-list-stamp').shadowRoot.textContent, /Not enough evidence for a verdict/);
  await window.happyDOM.abort();

  const options = page(source('options.html'));
  let stored;
  options.chrome = { storage: { local: { get: async () => ({ settings: { position: 'top-left' } }), set: async value => { stored = value; } } } };
  options.eval(source('shared.js')); options.eval(source('options.js'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(options.document.querySelector('#position').value, 'top-left');
  options.document.querySelector('#enabled').checked = false;
  options.document.querySelector('#position').value = 'bottom-left';
  options.document.querySelector('form').dispatchEvent(new options.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(JSON.parse(JSON.stringify(stored)), { settings: { enabled: false, position: 'bottom-left' } });
  assert.match(options.document.querySelector('#status').textContent, /Settings saved/);
  await options.happyDOM.abort();
});
