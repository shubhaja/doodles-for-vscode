'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function host(filename) {
  const commands = new Map(), state = new Map(), subscriptions = [];
  let provider, enabled = false, current = { custom: '#123456' };
  const api = {
    Uri: {joinPath: (...parts) => parts.join('/')},
    ConfigurationTarget: {Global: 1},
    extensions: {getExtension: () => undefined},
    commands: {registerCommand(name, fn) {commands.set(name, fn); return {dispose(){}};}, executeCommand() {}},
    window: {registerWebviewViewProvider(name, value) {provider = value; return {dispose(){}};},showInformationMessage(){}},
    workspace: {
      getConfiguration(name) {return name === 'doodles' ? {
        get(key, fallback) {return key === 'sky.enabled' ? enabled : fallback;},
        async update(key, value) {if (key === 'sky.enabled') enabled = value;}
      } : {inspect: () => ({globalValue:current}), async update(key, value) { current = value; }};},
      onDidChangeConfiguration() {return {dispose(){}};}
    }
  };
  const sandbox = {module:{exports:{}}, require: name => name === 'vscode' ? api : require(path.resolve(root,name)),
    console, setInterval: () => 1, clearInterval() {}};
  vm.runInNewContext(fs.readFileSync(path.join(root, filename),'utf8'), sandbox);
  const exports = sandbox.module.exports;
  exports.activate({extensionUri:'extension', subscriptions,
    globalState:{get:(key,fallback)=>state.has(key)?state.get(key):fallback, async update(key,value){state.set(key,value);}}});
  return {exports,commands,state,subscriptions,get provider(){return provider;},get current(){return current;}};
}
for (const filename of ['extension.js','browser.js']) {
  test(filename + ': sky commands update the pasture without changing user colors', async () => {
    const h = host(filename), messages = [];
    h.provider.resolveWebviewView({webview:{asWebviewUri:x=>x,cspSource:'assets:',
      onDidReceiveMessage(){},postMessage(message){messages.push(message);}},onDidDispose(){}});
    await h.commands.get('doodles.sky.enable')();
    assert.match(messages.at(-1).color, /^#[a-f0-9]{6}$/);
    const count=messages.length;
    await h.commands.get('doodles.sky.pause')();
    assert.equal(messages.length,count);
    await h.commands.get('doodles.sky.restore')();
    assert.equal(messages.at(-1).color,null);
    assert.deepEqual(h.current,{custom:'#123456'});
    assert.ok(![...h.commands.keys()].some(name=>name.includes('shelf')));
    for (const item of h.subscriptions) item.dispose();
  });
}

test('webview restricts scripts/resources and omits weather unless enabled', () => {
  const h = host('extension.js');
  const webview = {asWebviewUri: x => 'https://assets.test/'+x, cspSource:'https://assets.test'};
  const html = h.exports.pastureHtml(webview,'extension',{sky:'#abcdef',weather:false});
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<script(?! src=)/);
  assert.doesNotMatch(html, /ktown-weather.js/);
  for (const match of html.matchAll(/<script src="https:\/\/assets.test\/extension\/([^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  }
  const enabled = h.exports.pastureHtml(webview,'extension',{weather:true,latitude:40,longitude:-73});
  assert.match(enabled, /ktown-weather.js/);
  for (const item of h.subscriptions) item.dispose();
});
