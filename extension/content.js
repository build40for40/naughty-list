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

  // Elf Cam look (card 158). The pixel font ships with the extension, so no
  // font request leaves the browser; the monospace fallback still works.
  const FONT = 'Naughty List VT323';
  const fontReady = (async () => {
    try {
      const response = await fetch(api.runtime.getURL('fonts/vt323-latin-400.woff2'));
      const face = new FontFace(FONT, await response.arrayBuffer());
      await face.load();
      document.fonts.add(face);
    } catch { /* Fallback font. */ }
  })();
  const ELF_CSS = `:host{color-scheme:dark}*{box-sizing:border-box}
section{--c:#d5ddd7;--ph:#7dff9a;--soft:#9cc7a6;--rec:#ff3b30;position:relative;font:19px/1.15 "${FONT}",ui-monospace,Menlo,Consolas,monospace;color:#e6efe8;background:#0a0e0b;border:2px solid var(--c);padding:10px 14px 12px;box-shadow:0 8px 24px #0006}
section::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px)}
section[data-tone=nice]{--c:#7dff9a}section[data-tone=naughty]{--c:#ff3b30}
header{display:flex;align-items:center;gap:8px;text-transform:uppercase;color:var(--ph);border-bottom:1px dashed var(--soft);padding-bottom:6px}
strong{flex:1;font-weight:400;font-size:18px}
.lens{width:22px;height:22px;border-radius:50%;border:2px solid var(--c);flex:none;background:radial-gradient(circle at 35% 35%,#6a8 0 3px,#123 4px 7px,#000 8px)}
.rec{color:var(--rec)}.blink{animation:blink 1.2s steps(2,start) infinite}@keyframes blink{to{visibility:hidden}}
h2{font-size:30px;line-height:.95;font-weight:400;text-transform:uppercase;margin:10px 0 4px;color:var(--c)}
p{margin:6px 0}small{display:block;font-size:16px;color:var(--soft)}a{color:var(--ph);margin-right:10px}
button{all:unset;cursor:pointer;border:1px solid currentColor;padding:1px 8px;text-transform:uppercase;color:var(--c)}
header button{border:0;padding:0 4px;font-size:22px;color:var(--ph)}
details{margin-top:8px}summary{cursor:pointer;text-transform:uppercase;color:var(--ph)}
footer{display:flex;justify-content:space-between;gap:8px;margin-top:10px;border-top:1px dashed var(--soft);padding-top:8px}
button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--ph);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.blink{animation:none}}`;

  // Once per shop per day, the page briefly "goes on camera": corner brackets
  // and a REC readout, never taking clicks. Skipped if a purchase control sits
  // where the readout would go.
  let introChecked = false;
  async function maybeIntro() {
    if (introChecked) return;
    introChecked = true;
    const key = `elfCamIntro:${location.hostname}`;
    const today = new Date().toDateString();
    try {
      const stored = await api.storage.local.get(key);
      if (stored[key] === today) return;
      await api.storage.local.set({ [key]: today });
    } catch { return; }
    const clash = lib.purchaseControls(document).some(node => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && (rect.top < 90 || rect.bottom > innerHeight - 70);
    });
    if (clash || dismissed || !settings.enabled) return;
    await fontReady;
    const frame = document.createElement('div');
    frame.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147482999!important;pointer-events:none!important;';
    const root = frame.attachShadow({ mode: 'closed' });
    const css = element('style', null, root);
    css.textContent = `*{box-sizing:border-box}div{position:fixed;inset:0;pointer-events:none;font:22px/1 "${FONT}",ui-monospace,Menlo,monospace;text-transform:uppercase;transition:opacity .35s}
.out{opacity:0}i{position:absolute;width:44px;height:44px;border:5px solid #7dff9a;filter:drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)}
.tl{top:16px;left:16px;border-right:0;border-bottom:0}.tr{top:16px;right:16px;border-left:0;border-bottom:0}.bl{bottom:16px;left:16px;border-right:0;border-top:0}.br{bottom:16px;right:16px;border-left:0;border-top:0}
b{position:absolute;top:28px;font-weight:400;background:#0a0e0b;color:#7dff9a;padding:4px 10px}b.l{left:76px}b.r{right:76px}b span{color:#ff3b30}
@media (prefers-reduced-motion:reduce){div{transition:none}}`;
    const box = element('div', null, root);
    box.setAttribute('aria-hidden', 'true');
    for (const corner of ['tl', 'tr', 'bl', 'br']) element('i', null, box).className = corner;
    const left = element('b', null, box); left.className = 'l';
    element('span', '● ', left); left.append(`REC · Cam 01 · ${location.hostname}`);
    const clock = element('b', null, box); clock.className = 'r';
    const stamp = () => { const d = new Date(); clock.textContent = `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB')}`; };
    stamp();
    document.documentElement.append(frame);
    const tick = setInterval(stamp, 1000);
    const end = () => {
      clearInterval(tick);
      for (const type of ['scroll', 'keydown', 'pointerdown']) window.removeEventListener(type, end, true);
      box.classList.add('out');
      setTimeout(() => frame.remove(), 400);
    };
    for (const type of ['scroll', 'keydown', 'pointerdown']) window.addEventListener(type, end, { capture: true, passive: true, once: true });
    setTimeout(end, 3500);
  }
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
    style.textContent = ELF_CSS;
    const section = element('section', null, shadow);
    section.setAttribute('aria-label', 'The Naughty List shopping information');
    const header = element('header', null, section);
    element('span', null, header).className = 'lens';
    const name = element('strong', null, header);
    const rec = element('span', '● ', name);
    rec.className = 'rec blink';
    rec.setAttribute('aria-hidden', 'true');
    name.append('Elf Cam · The Naughty List');
    const close = element('button', '×', header);
    close.setAttribute('aria-label', 'Dismiss for this page');
    close.addEventListener('click', () => { dismissed = true; remove(); });
    const status = element('div', null, section);
    status.setAttribute('aria-live', 'polite');
    const model = state === 'pending' ? { title: 'Enhancing…', message: 'Checking the list for reviewed business information.', tone: 'neutral' }
      : state === 'error' ? { title: 'Signal lost', message: 'We could not check this website. Please try again.', tone: 'neutral' }
      : lib.viewModel(assessment);
    section.dataset.tone = model.tone;
    element('h2', model.title, status);
    element('p', model.message, status);
    if (assessment?.scoring?.status === 'computed' && assessment.scoring.total !== null) {
      element('small', `Santa Score ${assessment.scoring.total > 0 ? '+' : ''}${assessment.scoring.total} · ${assessment.scoring.method ?? 'santa'} · ${assessment.scoring.asOf}`, status);
    }
    const community = lib.communityModel(assessment);
    if (state === 'ready' && community) {
      element('p', `Community: ${community.text}`, section);
      element('small', 'Community opinion. Claims have not been verified.', section);
      const votes = element('button', 'View or cast a vote', section);
      votes.addEventListener('click', () => {
        api.runtime.sendMessage({ type: 'open-community', domain: location.hostname }).catch(() => {});
      });
    }
    if (assessment?.company) {
      const detail = element('details', null, section);
      detail.addEventListener('toggle', position);
      element('summary', 'Case file: evidence and source', detail);
      const certification = assessment.criteria?.bCorp;
      if (certification) {
        element('p', certification.certified === true ? 'B Corp certification recorded.' : certification.certified === false ? 'Source records no B Corp certification.' : 'Current B Corp certification is unknown.', detail);
        if (certification.checkedAt) element('small', `Checked ${certification.checkedAt}${certification.reason === 'stale_evidence' ? ' · evidence needs refreshing' : ''}.`, detail);
        addLink(detail, 'B Lab source', certification.source?.url);
      }
      for (const evidence of assessment.evidence ?? []) {
        if (evidence.title === 'B Corp certification') continue;
        element('p', `${evidence.title}${evidence.freshness === 'stale' ? ' (historical or needs refreshing)' : ''}`, detail);
        if (evidence.summary) element('p', evidence.summary, detail);
        if (evidence.publishedAt) element('small', `Published ${evidence.publishedAt.slice(0, 10)}${!evidence.eventDate ? ' · publication date, not event date' : ''}.`, detail);
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
      if (token === generation) { render('ready', current); maybeIntro(); }
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
