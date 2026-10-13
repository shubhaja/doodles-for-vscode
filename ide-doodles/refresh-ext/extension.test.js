const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function host({fail = false, saved = true} = {}) {
  const calls = []; let command;
  const vscode = {
    workspace: {isTrusted: true, saveAll: async () => {calls.push('save'); return saved;}},
    ProgressLocation: {Window: 10},
    window: {
      createOutputChannel: () => ({appendLine() {}, dispose() {}}),
      withProgress: (_, task) => task(),
      showErrorMessage: async () => {calls.push('error');}
    },
    commands: {registerCommand: (_, fn) => {command = fn; return {};}, executeCommand: async name => calls.push(name)}
  };
  const sandbox = {module: {exports: {}}, process: {env: {}}, require: name => {
    if (name === 'vscode') return vscode;
    if (name === 'node:child_process') return {execFile(binary, args, options, callback) {
      calls.push('apply');
      assert.equal(binary, '/usr/bin/env');
      assert.equal(args[2], '--no-reload');
      queueMicrotask(() => callback(fail ? new Error('denied') : null, '', ''));
    }};
    return require(name);
  }};
  vm.runInNewContext(fs.readFileSync(__dirname + '/extension.js', 'utf8'), sandbox);
  sandbox.module.exports.activate({subscriptions: []});
  return {calls, run: () => command()};
}
test('saves and applies before reloading, suppressing repeated presses', async () => {
  const h = host(); await Promise.all([h.run(), h.run()]);
  assert.deepEqual(h.calls, ['save', 'apply', 'workbench.action.reloadWindow']);
});
test('apply failure keeps the window open and allows retry', async () => {
  const h = host({fail: true}); await h.run(); await h.run();
  assert.deepEqual(h.calls, ['save', 'apply', 'error', 'save', 'apply', 'error']);
});
test('cancelled save does not apply or reload', async () => {
  const h = host({saved: false}); await h.run(); assert.deepEqual(h.calls, ['save']);
});
