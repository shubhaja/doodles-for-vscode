'use strict';
const vscode = require('vscode');
const { colorsAt, skyAt } = require('./lib/sky');
const { restoreColors } = require('./lib/settings');

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function pastureHtml(webview, extensionUri, config) {
  const asset = name => escapeAttribute(webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', name)));
  const scripts = ['scene.js', 'modes.js', 'settings.js', 'host-appearance.js', 'night-sky.js', 'cozy-mode.js', 'terminal-eyes.js', 'pasture-audio.js', 'sheep-overlay.js', 'fireflies-overlay.js',
    'disco-overlay.js', 'flower-foraging.js', 'sheep-run.js'];
  if (config.weather) scripts.push('ktown-weather.js');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; connect-src https://api.open-meteo.com https://photon.komoot.io;">
    <meta name="doodles-config" content="${escapeAttribute(JSON.stringify(config))}">
    <link rel="stylesheet" href="${asset('scene.css')}"><title>Doodles Pasture</title></head>
    <body><div id="pasture-ground" aria-hidden="true"></div>
    <div id="pasture-toolbar" aria-label="Pasture controls"><ul class="actions-container"></ul></div>
    <p id="pasture-help">Drag a sheep · Choose a mode in settings · Race: Space to jump or retry</p>
    ${config.weather ? '<a id="weather-credit" href="https://open-meteo.com/">Weather by Open-Meteo (CC BY 4.0)</a>' : ''}
    ${scripts.map(name => `<script src="${asset(name)}"></script>`).join('')}
    </body></html>`;
}
function activate(context) {
  const appearance=require('./lib/appearance').createAppearance(vscode,context);
  let dark=false,skyPaused=false;
  async function setDark(enabled){dark=enabled;}
  let view, disposed = false, queue = Promise.resolve();
  const nowHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const config = () => vscode.workspace.getConfiguration('doodles');
  // Serialize tick and restore to prevent a late tick from undoing a restore.
  function enqueue(task) {
    queue = queue.then(() => disposed ? undefined : task()).catch(error => console.error('Doodles:', error));
    return queue;
  }
  function render() {
    if (!view) return;
    if(dark)void enqueue(()=>setDark(false));
    const c = config();
    view.webview.html = pastureHtml(view.webview, context.extensionUri, {
      host: 'webview', sky: skyAt(nowHour()), weather: c.get('weather.enabled', false),
      latitude: c.get('weather.latitude', 40.7479), longitude: c.get('weather.longitude', -73.9867)
    });
  }
  async function restore() {
    const saved = context.globalState.get('skySnapshot');
    if (!saved) return;
    const workbench = vscode.workspace.getConfiguration('workbench');
    const current = workbench.inspect('colorCustomizations')?.globalValue || {};
    await workbench.update('colorCustomizations', restoreColors(current, saved.original, saved.last), vscode.ConfigurationTarget.Global);
    await context.globalState.update('skySnapshot', undefined);
  }
  async function tick() {
    if(!skyPaused)view?.webview.postMessage({ type: 'sky', color: skyAt(nowHour()) });

  }
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('doodles.pasture', {
    resolveWebviewView(resolved) {
      view = resolved;
      view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')] };
      const thisView = view;
      view.webview.onDidReceiveMessage(message=>{
        if(message?.type!=='dark-mode' || typeof message.enabled!=='boolean' || !Number.isSafeInteger(message.id))return;
        void enqueue(async()=>{
          try{await setDark(message.enabled);thisView.webview.postMessage({type:'dark-mode-result',id:message.id});}
          catch(error){thisView.webview.postMessage({type:'dark-mode-result',id:message.id,error:error.message});}
        });
      });
      view.onDidDispose(() => { if (view === thisView) {view = undefined;void enqueue(()=>setDark(false));} });
      render();
    }
  }));
  const command = (name, fn) => context.subscriptions.push(vscode.commands.registerCommand(name, fn));
  command('doodles.open', () => vscode.commands.executeCommand('doodles.pasture.focus'));
  command("doodles.sky.enable", () => {skyPaused=false;return enqueue(tick);});
  command("doodles.sky.pause", () => {skyPaused=true;});
  command("doodles.sky.restore", () => {
    skyPaused=true;
    view?.webview.postMessage({type:"sky",color:null});
  });
  command('doodles.terminalGoal', () => vscode.commands.executeCommand('workbench.action.terminal.rename'));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('doodles.weather')) render();
    if (event.affectsConfiguration('doodles.sky')) void enqueue(tick);
  }));
  const timer = setInterval(() => void enqueue(tick), 60000);
  context.subscriptions.push({ dispose() { disposed = true; clearInterval(timer); } });
  void enqueue(async()=>{await appearance.setDark(false);await restore();await tick();});
}
module.exports = { activate, pastureHtml };
