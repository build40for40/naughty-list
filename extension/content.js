(() => {
  if (window.top !== window || location.protocol !== 'https:') return;
  const api = globalThis.browser ?? globalThis.chrome;
  const lib = globalThis.NaughtyList;
  let settings = lib.settings();
  let host;
  let shadow;
  let page = location.href;
  let dismissed = false;
  let generation = 0;
  let current;
  let requestedAt = 0;
  let pending = false;
  let scheduled = false;
  let retryAfter = 0;
  let placementScheduled = false;

  const element = (name, text, parent) => {
    const node = document.createElement(name);
    if (text) node.textContent = text;
    parent?.append(node);
    return node;
  };
  function remove() { host?.remove(); host = shadow = undefined; }
  function applyPosition(corner) {
    if (!host) return;
    for (const side of ['top', 'right', 'bottom', 'left']) host.style.setProperty(side, 'auto', 'important');
    for (const side of corner.split('-')) host.style.setProperty(side, '16px', 'important');
  }
  function queuePlacement() {
    if (placementScheduled) return;
    placementScheduled = true;
    setTimeout(() => {
      placementScheduled = false;
      if (!host) return;
      const controls = lib.purchaseControls(document).map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
      for (const corner of [settings.position, ...lib.positions.filter(value => value !== settings.position)]) {
        applyPosition(corner);
        const rect = host.getBoundingClientRect();
        const blocked = controls.some(button => rect.left < button.right + 8 && rect.right > button.left - 8 && rect.top < button.bottom + 8 && rect.bottom > button.top - 8);
        if (!blocked) { host.style.setProperty('visibility', 'visible', 'important'); return; }
      }
      // Purchase controls take precedence if no corner is safe. Recheck on
      // scroll, resize or a content change; never duplicate or move shop controls.
      host.style.setProperty('visibility', 'hidden', 'important');
    }, 100);
  }
  function position() {
    if (!host) return;
    host.style.setProperty('visibility', 'hidden', 'important');
    applyPosition(settings.position);
    queuePlacement();
  }
  function render(state, assessment) {
    if (dismissed || !settings.enabled) return;
    if (!host) {
      host = document.createElement('div');
      host.id = 'naughty-list-stamp';
      host.style.cssText = 'all:initial!important;position:fixed!important;z-index:2147483000!important;display:block!important;width:300px!important;max-width:calc(100vw - 32px)!important;';
      shadow = host.attachShadow({ mode: 'open' });
      document.documentElement.append(host);
    }
    position();
    shadow.replaceChildren();
    const style = element('style', null, shadow);
    style.textContent = ':host{color-scheme:light}*{box-sizing:border-box}section{font:14px/1.5 system-ui,sans-serif;color:#173a2f;background:#fff8e9;border:2px solid #a51d2d;border-radius:14px;padding:16px;box-shadow:0 5px 24px #0003}header{display:flex;align-items:center;gap:10px}strong{flex:1;font-size:16px}h2{font-size:16px;margin:12px 0 6px}p{margin:6px 0}button,a{font:inherit}button{cursor:pointer;border:1px solid #6e756d;border-radius:6px;background:#fff;padding:4px 8px;color:#173a2f}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #397eac;outline-offset:2px}footer{display:flex;justify-content:space-between;gap:8px;margin-top:12px}details{margin-top:10px}summary{cursor:pointer}a{color:#8d1927}small{font-size:12px}section[data-tone=nice]{border-color:#28724f}section[data-tone=naughty]{border-color:#a51d2d}';
    const section = element('section', null, shadow);
    section.setAttribute('aria-label', 'The Naughty List shopping information');
    const header = element('header', null, section);
    element('strong', 'The Naughty List', header);
    const close = element('button', '×', header);
    close.setAttribute('aria-label', 'Dismiss for this page');
    close.addEventListener('click', () => { dismissed = true; remove(); });
    const status = element('div', null, section);
    status.setAttribute('aria-live', 'polite');
    const model = state === 'pending' ? { title: 'Checking the list…', message: 'Looking for reviewed business information.', tone: 'neutral' }
      : state === 'error' ? { title: 'The list is taking a break', message: 'We could not check this website. Please try again.', tone: 'neutral' }
      : lib.viewModel(assessment);
    section.dataset.tone = model.tone;
    element('h2', model.title, status);
    element('p', model.message, status);
    if (assessment?.company) {
      const detail = element('details', null, section);
      detail.addEventListener('toggle', position);
      element('summary', 'Evidence and source', detail);
      const certification = assessment.criteria?.bCorp;
      if (certification) {
        element('p', certification.certified === true ? 'B Corp certification recorded.' : certification.certified === false ? 'Source records no B Corp certification.' : 'Current B Corp certification is unknown.', detail);
        if (certification.checkedAt) element('small', `Checked ${certification.checkedAt}${certification.reason === 'stale_evidence' ? ' · evidence needs refreshing' : ''}.`, detail);
        addLink(detail, 'B Lab source', certification.source?.url);
      }
      for (const evidence of assessment.evidence ?? []) {
        if (evidence.title === 'B Corp certification') continue;
        element('p', `${evidence.title}${evidence.freshness === 'stale' ? ' (historical or needs refreshing)' : ''}`, detail);
        addLink(detail, 'Source', evidence.sourceUrl);
      }
      element('p', 'This describes the business, not the ethics of this individual product.', detail);
    }
    const footer = element('footer', null, section);
    const options = element('button', 'Settings', footer);
    options.addEventListener('click', () => { api.runtime.sendMessage({ type: 'open-settings' }).catch(() => {}); });
    if (state === 'error') {
      const retry = element('button', 'Try again', footer);
      retry.addEventListener('click', () => { retryAfter = 0; schedule(); });
    }
  }
  function addLink(parent, text, value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return;
      const link = element('a', text, parent);
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    } catch { /* Invalid source URLs are never rendered. */ }
  }
  async function evaluate() {
    if (page !== location.href) { page = location.href; dismissed = false; generation++; remove(); }
    if (!settings.enabled || dismissed) { generation++; remove(); return; }
    const signals = lib.shoppingSignals(document);
    if (!signals.candidate) { generation++; remove(); return; }
    if (current && Date.now() - requestedAt < 300000) { if (!host) render('ready', current); else queuePlacement(); return; }
    if (pending || Date.now() < retryAfter) return;
    const token = ++generation;
    pending = true;
    render('pending');
    try {
      const result = await api.runtime.sendMessage({ type: 'assess-domain', domain: location.hostname });
      if (result?.error || !result?.assessment) throw new Error('Lookup failed');
      current = result.assessment; requestedAt = Date.now();
      if (token === generation) render('ready', current);
    } catch {
      retryAfter = Date.now() + 30000;
      if (token === generation) render('error');
    } finally { pending = false; if (token !== generation) schedule(); }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; evaluate(); }, 500);
  }
  api.storage.local.get('settings').then(value => {
    settings = lib.settings(value.settings);
    schedule();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['content', 'disabled', 'aria-label', 'aria-disabled'] });
    setInterval(() => { if (page !== location.href || (settings.enabled && !dismissed && current && Date.now() - requestedAt >= 300000)) schedule(); }, 1000);
    window.addEventListener('scroll', queuePlacement, { passive: true });
    window.addEventListener('resize', queuePlacement, { passive: true });
  }).catch(() => { /* No lookup if preferences cannot be read. */ });
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    settings = lib.settings(changes.settings.newValue);
    if (!settings.enabled) { generation++; remove(); } else { position(); schedule(); }
  });
})();
