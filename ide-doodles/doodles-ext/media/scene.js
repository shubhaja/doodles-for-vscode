(function () {
  'use strict';
  const config = JSON.parse(document.querySelector('meta[name="doodles-config"]').content);
  window.doodlesConfig = config;
  const vscode = acquireVsCodeApi();
  const state = vscode.getState() || {};
  for (const key of ['pasture-muted', 'pasture-race-best', 'doodles-resting-mode']) {
    try { if (state[key] != null) sessionStorage.setItem(key, state[key]); } catch (_) {}
  }
  function save() {
    for (const key of ['pasture-muted', 'pasture-race-best', 'doodles-resting-mode']) {
      try { state[key] = sessionStorage.getItem(key); } catch (_) {}
    }
    vscode.setState(state);
  }
  const color = value => { if(value===null){document.documentElement.style.removeProperty('--pasture-sky');return;} if (/^#[0-9a-f]{6}$/i.test(value)) document.documentElement.style.setProperty('--pasture-sky', value); };
  color(config.sky);
  window.addEventListener('message', event => { if (event.data?.type === 'sky') color(event.data.color); });
  document.addEventListener('click', () => queueMicrotask(save));
  window.addEventListener('pagehide', save);
})();
