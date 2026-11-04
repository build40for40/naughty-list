(() => {
  const TTL = 5 * 60 * 1000;
  function createLookup({ fetcher = fetch, readCache, writeCache, now = Date.now }) {
    const pending = new Map();
    let memory = {};
    let loaded;
    async function lookup(domain) {
      if (!globalThis.NaughtyList.hostname(domain)) throw new Error('Invalid hostname.');
      domain = globalThis.NaughtyList.hostname(domain);
      if (pending.has(domain)) return pending.get(domain);
      const task = (async () => {
        loaded ??= Promise.resolve(readCache()).then(value => { memory = value ?? {}; }).catch(() => {});
        await loaded;
        const cached = memory[domain];
        if (cached && cached.expiresAt > now()) return cached.assessment;
        const response = await fetcher('https://naughty-list-api.40for40.workers.dev/v1/assessments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain }), credentials: 'omit', referrerPolicy: 'no-referrer',
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error('Assessment service is unavailable.');
        const data = await response.json();
        if (data?.schemaVersion !== '1' || !data.match || !data.criteria || !data.scoring) throw new Error('Invalid assessment response.');
        // Cache only the fields the overlay uses, not the whole source catalogue.
        const assessment = {
          schemaVersion: data.schemaVersion, match: data.match, company: data.company,
          relevance: data.relevance ?? { category: 'unknown', eligibleForVerdict: false },
          criteria: { bCorp: data.criteria.bCorp }, scoring: data.scoring,
          evidence: (data.evidence ?? []).slice(0, 3).map(item => ({ title: item.title, sourceUrl: item.sourceUrl, checkedAt: item.checkedAt, freshness: item.freshness }))
        };
        memory[domain] = { assessment, expiresAt: now() + TTL };
        memory = Object.fromEntries(Object.entries(memory).filter(([, value]) => value.expiresAt > now()).sort((a, b) => b[1].expiresAt - a[1].expiresAt).slice(0, 50));
        try { await writeCache(memory); } catch { /* Memory deduplication still works if session storage is full. */ }
        return assessment;
      })();
      pending.set(domain, task);
      try { return await task; } finally { pending.delete(domain); }
    }
    return lookup;
  }
  globalThis.NaughtyList.createLookup = createLookup;
})();
