'use strict';
const vscode = require('vscode');
const {execFile} = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

function activate(context) {
  let busy = false;
  const output = vscode.window.createOutputChannel('Doodles Refresh');
  context.subscriptions.push(output, vscode.commands.registerCommand('doodles.applyAndReload', async () => {
    if (busy || !vscode.workspace.isTrusted) return;
    busy = true;
    try {
      if (!await vscode.workspace.saveAll()) return;
      const script = path.join(os.homedir(), 'doodles', 'ide-doodles', 'apply.py');
      await vscode.window.withProgress({location: vscode.ProgressLocation.Window, title: 'Applying doodles…'}, () =>
        new Promise((resolve, reject) => {
          execFile('/usr/bin/env', ['python3', script, '--no-reload'], {
            timeout: 60000,
            maxBuffer: 2 * 1024 * 1024,
            env: {...process.env, PATH: '/Library/Frameworks/Python.framework/Versions/3.14/bin:/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '/usr/bin:/bin')}
          }, (error, stdout, stderr) => {
            output.appendLine(stdout || '');
            if (stderr) output.appendLine(stderr);
            if (error) reject(error); else resolve();
          });
        }));
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    } catch (error) {
      output.appendLine(String(error));
      const action = await vscode.window.showErrorMessage('Doodles could not apply; the window has not reloaded.', 'Show Details');
      if (action === 'Show Details') output.show(true);
    } finally {
      busy = false;
    }
  }));
}
module.exports = {activate};
