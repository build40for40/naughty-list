// Elf Cam badge mode for single-brand stores. On the first visit to a store each
// day, the page "goes on camera" for a few seconds, then the evidence shrinks into
// a corner badge. Clicking the badge opens the case file. No Naughty or Nice
// verdict is shown until the scoring method is agreed. Only Elf Cam's own
// controls take clicks; the shop's purchase controls are never covered by the
// intro panel, which sits at the top of the page.
(function () {
  if (window.top !== window || document.documentElement.hasAttribute('data-naughty-list')) return;
  document.documentElement.setAttribute('data-naughty-list', '');

  const INTRO_MS = 4000;
  const FONT = 'Naughty List VT323';
  const host = location.hostname;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CSS = `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0}
[hidden]{display:none!important}
.ec{--bg:#0a0e0b;--ph:#7dff9a;--rec:#ff3b30;--neutral:#d5ddd7;--soft:#9cc7a6;--c:var(--ph);
  font-family:"${FONT}",ui-monospace,Menlo,Consolas,monospace;text-transform:uppercase;line-height:1.05;
  color:var(--c);-webkit-font-smoothing:antialiased;letter-spacing:0}
/* Unknown must look neutral, never like a warning. */
.ec.unknown{--c:var(--neutral)}
button,a{all:unset;cursor:pointer;font:inherit;color:inherit}
button:focus-visible,a:focus-visible{outline:2px solid var(--c);outline-offset:3px}
.blink{animation:blink 1.2s steps(2,start) infinite}
@keyframes blink{to{visibility:hidden}}
@media (prefers-reduced-motion:reduce){.blink{animation:none}.vf{transition:none!important}}

.vf{position:fixed;inset:0;pointer-events:none;transition:opacity .35s ease;
  background:repeating-linear-gradient(0deg,rgba(10,40,20,.12) 0 1px,transparent 1px 3px),rgba(20,60,30,.07)}
.vf.out{opacity:0}
.c{position:absolute;width:44px;height:44px;border:5px solid var(--c);filter:drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)}
.tl{top:16px;left:16px;border-right:0;border-bottom:0}
.tr{top:16px;right:16px;border-left:0;border-bottom:0}
.bl{bottom:16px;left:16px;border-right:0;border-top:0}
.br{bottom:16px;right:16px;border-left:0;border-top:0}
.hud{position:absolute;top:26px;left:76px;right:76px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:22px}
.plate{background:var(--bg);color:var(--ph);padding:4px 10px}
.rec{color:var(--rec)}
.cross{position:absolute;left:50%;top:60%;width:44px;height:44px;transform:translate(-50%,-50%)}
.cross::before,.cross::after{content:"";position:absolute;background:var(--c);filter:drop-shadow(0 0 1px #000)}
.cross::before{left:21px;top:0;bottom:0;width:2px}
.cross::after{top:21px;left:0;right:0;height:2px}
.verdict{position:absolute;left:50%;top:72px;transform:translateX(-50%);width:min(600px,calc(100vw - 48px));
  background:var(--bg);border:2px solid var(--c);padding:14px 18px;display:grid;gap:8px;pointer-events:auto;
  box-shadow:0 12px 32px rgba(0,0,0,.4)}
.l1{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px 12px;font-size:20px;color:var(--soft)}
.l1 button{color:var(--c);text-decoration:underline;text-underline-offset:3px}
.big{font-size:clamp(36px,6vw,56px);line-height:.9;color:var(--c)}
.line{font-size:20px;text-transform:none;color:var(--c)}

.badge{position:fixed;right:20px;bottom:20px;display:flex;align-items:center;gap:10px;background:var(--bg);color:var(--c);
  border:2px solid var(--c);padding:6px 14px 6px 10px;font-size:24px;box-shadow:0 8px 20px rgba(0,0,0,.35)}
.badge small{font-size:17px;color:var(--soft);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lens{position:relative;width:26px;height:26px;border-radius:50%;border:2px solid var(--c);flex:none;
  background:radial-gradient(circle at 35% 35%,#6a8 0 3px,#123 4px 8px,#000 9px)}
.lens i{position:absolute;right:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--rec)}

.file{position:fixed;right:20px;bottom:78px;width:min(420px,calc(100vw - 40px));max-height:calc(100vh - 110px);overflow:auto;
  background:var(--bg);color:var(--c);border:2px solid var(--c);padding:16px 18px;display:grid;gap:10px;font-size:20px;
  box-shadow:0 12px 32px rgba(0,0,0,.45)}
.hd{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--soft);padding-bottom:6px;color:var(--ph)}
.file .big{font-size:42px}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 14px}
dt{color:var(--soft)}
dd{text-transform:none;color:var(--c)}
.note{text-transform:none;color:var(--c)}
.ft{display:flex;flex-wrap:wrap;gap:8px;border-top:1px dashed var(--soft);padding-top:8px}
.ft a,.ft button{border:1px solid currentColor;padding:2px 10px}
`;

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs ?? {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'on') for (const [type, fn] of Object.entries(value)) el.addEventListener(type, fn);
      else el.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) el.append(child);
    return el;
  }

  async function loadFont() {
    try {
      const response = await fetch(chrome.runtime.getURL('fonts/vt323-latin-400.woff2'));
      const face = new FontFace(FONT, await response.arrayBuffer());
      await face.load();
      document.fonts.add(face);
    } catch {
      // The monospace fallback still works.
    }
  }

  function assess() {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ type: 'assess' }, reply => {
          if (chrome.runtime.lastError || !reply?.ok) resolve(null);
          else resolve(reply.data);
        });
      } catch {
        resolve(null);
      }
    });
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  async function introDue() {
    const key = `introSeen:${host}`;
    try {
      const stored = await chrome.storage.local.get(key);
      if (stored[key] === today()) return false;
      await chrome.storage.local.set({ [key]: today() });
    } catch {
      // Without storage, show the intro rather than never.
    }
    return true;
  }

  function stamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function render(state, showIntro) {
    const subjectName = state.subject ?? host;
    const container = h('naughty-list-elf-cam', {
      style: 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647'
    });
    const shadow = container.attachShadow({ mode: 'closed' });
    const ec = h('div', { class: `ec ${state.verdict}` });
    shadow.append(h('style', null, CSS), ec);

    // Case file
    const fileId = 'naughty-list-case-file';
    const closeFile = () => { file.hidden = true; badge.setAttribute('aria-expanded', 'false'); badge.focus(); };
    const file = h('section', { class: 'file', id: fileId, role: 'dialog', 'aria-label': `Case file: ${subjectName}`, hidden: true },
      h('div', { class: 'hd' }, h('span', null, h('span', { class: 'rec' }, '● '), `Case file · ${subjectName}`), h('span', null, 'Cam 01')),
      h('p', { class: 'big' }, state.verdict === 'certified' ? 'B Corp ✓ On file' : 'Unidentified'),
      h('dl', null,
        h('dt', null, 'Subject'), h('dd', null, state.subject ? `${state.subject} (the company behind this store)` : `${host} (not on the list)`),
        h('dt', null, 'Evidence'), h('dd', null, state.evidence),
        h('dt', null, 'Verdict'), h('dd', null, "Pending. Santa hasn't agreed his rules yet"),
        state.sourceName && [h('dt', null, 'Source'), h('dd', null, state.sourceName)],
        state.checked && [h('dt', null, 'Checked'), h('dd', null, state.checked)],
        h('dt', null, 'Scope'), h('dd', null, 'The company, not individual products')),
      h('p', { class: 'note' }, state.verdict === 'certified'
        ? 'B Corp certification means the company was independently assessed on how it treats its workers, community and environment. It is evidence for the list, not a Naughty or Nice verdict on its own.'
        : "Not being on the list isn't the same as being naughty. The elves just haven't vouched for this one yet."),
      h('div', { class: 'ft' },
        state.sourceUrl && h('a', { href: state.sourceUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Source ↗'),
        h('button', { type: 'button', on: { click: closeFile } }, 'Close file')));
    file.addEventListener('keydown', event => { if (event.key === 'Escape') closeFile(); });

    // Corner badge
    const badge = h('button', {
      type: 'button', class: 'badge', 'aria-expanded': 'false', 'aria-controls': fileId,
      'aria-label': state.verdict === 'certified'
        ? `The Naughty List: ${subjectName} is a ${state.evidence}, verdict pending. Open case file.`
        : `The Naughty List: ${subjectName} is unidentified, no verdict. Open case file.`,
      hidden: showIntro,
      on: { click: () => {
        const opening = file.hidden;
        file.hidden = !opening;
        badge.setAttribute('aria-expanded', String(opening));
        if (opening) file.querySelector('button, a')?.focus();
      } }
    }, h('span', { class: 'lens' }, h('i', { class: 'blink' })), state.label, h('small', null, state.verdict === 'certified' ? `${subjectName} · verdict pending` : 'No verdict'));

    ec.append(file, badge);
    document.documentElement.append(container);

    if (!showIntro) return;

    // Viewfinder intro
    const clock = h('span', { class: 'plate' }, stamp());
    // Decoration is hidden from assistive tech; the verdict plate and its button are not.
    const vf = h('div', { class: 'vf' },
      h('span', { class: 'c tl', 'aria-hidden': 'true' }), h('span', { class: 'c tr', 'aria-hidden': 'true' }),
      h('span', { class: 'c bl', 'aria-hidden': 'true' }), h('span', { class: 'c br', 'aria-hidden': 'true' }),
      h('div', { class: 'hud', 'aria-hidden': 'true' }, h('span', { class: 'plate' }, h('span', { class: 'rec blink' }, '●'), ` REC · Cam 01 · ${host}`), clock),
      h('span', { class: 'cross', 'aria-hidden': 'true' }));
    const plate = h('div', { class: 'verdict', role: 'status' },
      h('div', { class: 'l1' }, h('span', null, `Subject: ${subjectName}${state.subject ? ' (brand)' : ''}`),
        h('button', { type: 'button', on: { click: () => { collapse(); badge.click(); } } }, 'View case file ›')),
      h('p', { class: 'big' }, state.headline),
      h('p', { class: 'line' }, state.line));
    vf.append(plate);
    ec.append(vf);

    const tick = setInterval(() => { clock.textContent = stamp(); }, 1000);
    const dismissEvents = ['scroll', 'wheel', 'keydown', 'pointerdown', 'touchstart'];
    let done = false;
    function collapse() {
      if (done) return;
      done = true;
      clearInterval(tick);
      clearTimeout(timer);
      for (const type of dismissEvents) window.removeEventListener(type, onUserAction, true);
      badge.hidden = false;
      vf.classList.add('out');
      setTimeout(() => vf.remove(), reduceMotion ? 0 : 400);
    }
    function onUserAction(event) {
      // Events inside Elf Cam's own UI are retargeted to its container; leave those to the plate.
      if (event.target === container) return;
      collapse();
    }
    const timer = setTimeout(collapse, INTRO_MS);
    for (const type of dismissEvents) window.addEventListener(type, onUserAction, { capture: true, passive: true });
  }

  (async () => {
    const [result] = await Promise.all([assess(), loadFont()]);
    const state = globalThis.NaughtyListVerdict.badgeState(result);
    if (!state) return;
    render(state, await introDue());
  })();
})();
