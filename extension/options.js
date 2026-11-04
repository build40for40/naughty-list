(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const form = document.querySelector('#settings');
  const enabled = document.querySelector('#enabled');
  const position = document.querySelector('#position');
  const status = document.querySelector('#status');
  const button = form.querySelector('button');
  button.disabled = true;
  api.storage.local.get('settings').then(value => {
    const settings = globalThis.NaughtyList.settings(value.settings);
    enabled.checked = settings.enabled;
    position.value = settings.position;
    button.disabled = false;
  }).catch(() => { status.textContent = 'Settings could not be loaded. Reload to try again.'; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await api.storage.local.set({ settings: globalThis.NaughtyList.settings({ enabled: enabled.checked, position: position.value }) });
      status.textContent = 'Settings saved.';
    } catch { status.textContent = 'Settings could not be saved. Please try again.'; }
  });
})();
