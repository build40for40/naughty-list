// Looks up the company behind the current store. Only the hostname of the tab
// that asked is sent, and only content scripts on reviewed stores can ask.
const API = 'https://naughty-list-api.40for40.workers.dev/v1/assessments';
const TIMEOUT_MS = 8000;
const CACHE_MS = 60 * 60 * 1000;
const cache = new Map();

async function lookup(domain) {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
      credentials: 'omit',
      signal: controller.signal
    });
    if (!response.ok) return { ok: false };
    const value = { ok: true, data: await response.json() };
    cache.set(domain, { at: Date.now(), value });
    return value;
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'assess' || !sender.tab || !sender.url) return false;
  let domain;
  try {
    domain = new URL(sender.url).hostname;
  } catch {
    return false;
  }
  lookup(domain).then(sendResponse);
  return true;
});
