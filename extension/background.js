if (typeof importScripts === 'function') importScripts('shared.js', 'lookup.js');
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const session = api.storage.session;
  const lookup = globalThis.NaughtyList.createLookup({
    readCache: async () => session ? (await session.get('assessmentCache')).assessmentCache : {},
    writeCache: async value => { if (session) await session.set({ assessmentCache: value }); }
  });
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let url;
    try { url = new URL(sender.url); } catch { return false; }
    if (sender.frameId !== 0 || url.protocol !== 'https:') return false;
    if (message?.type === 'open-settings') { api.runtime.openOptionsPage(); return false; }
    const domain = globalThis.NaughtyList.hostname(url.hostname);
    if (domain && message?.type === 'open-community' && globalThis.NaughtyList.hostname(message.domain) === domain) {
      // Resolve the identity ourselves; the shopping page cannot choose a voting
      // destination or receive account credentials from the hosted page.
      api.storage.local.get('settings').then(async value => {
        if (!globalThis.NaughtyList.settings(value.settings).enabled) return;
        const assessment = await lookup(domain);
        const community = globalThis.NaughtyList.communityModel(assessment);
        if (!community || !/^[a-z0-9-]{1,100}$/.test(community.companyId)) return;
        await api.tabs.create({ url: `https://naughty-list-api.40for40.workers.dev/community/?brand=${encodeURIComponent(community.companyId)}` });
      }).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ error: 'unavailable' }));
      return true;
    }
    if (!domain || message?.type !== 'assess-domain' || globalThis.NaughtyList.hostname(message.domain) !== domain) return false;
    api.storage.local.get('settings').then(value => {
      if (!globalThis.NaughtyList.settings(value.settings).enabled) return { error: 'disabled' };
      return lookup(url.hostname).then(assessment => ({ assessment }));
    }).then(sendResponse).catch(() => sendResponse({ error: 'unavailable' }));
    return true;
  });
})();
