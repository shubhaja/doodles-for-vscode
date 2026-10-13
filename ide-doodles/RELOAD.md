# Apply edits without rebuilding

## One keyboard shortcut

Install [Doodles Refresh](refresh-ext/doodles-refresh-0.1.0.vsix) once using
**Extensions: Install from VSIX…** in VS Code. Then press **Cmd+Option+R**
to save files, apply the latest doodles, and reload the current window without
leaving VS Code. This runs the same apply script as Restore Doodles.command.
If applying fails, it keeps the window open and offers a log.

## Automatic updates

Double-click `Enable Automatic Updates.command` in Finder once. This installs
`local.doodles.auto-apply` in `~/Library/LaunchAgents` and starts it immediately.
It applies saved JS and CSS changes after a quiet second,
without activating or reloading VS Code. Wait a couple of seconds after saving,
then use **Developer: Reload Window**. No terminal needs to stay open, and the
helper starts again at login. Errors appear in `.reload-helper/auto-apply.log`.
The helper uses the existing apply script and its timestamped backups. It does
not add support for decorations that the apply script cannot restore after a
VS Code update. It does not rebuild the portable extension.

To stop and uninstall the helper:

```sh
launchctl bootout gui/$(id -u)/local.doodles.auto-apply
rm ~/Library/LaunchAgents/local.doodles.auto-apply.plist
```

## Manual request helper (older alternative)

For the legacy window-wide decorations, start the helper in a regular macOS
Terminal window, outside the personal Codex sandbox:

```sh
python3 ~/doodles/ide-doodles/reload-helper.py
```

Keep that terminal open. Ctrl+C stops the helper. Start it again after restarting
your computer. This does not install an extension or a background service.

After finishing an edit, Codex can queue an apply-and-reload with:

```sh
python3 ~/doodles/ide-doodles/reload-helper.py --request
```

The helper backs up the installed workbench page, applies all changed source
blocks supported by `apply.py`, activates VS Code, and requests Developer: Reload
Window through the Command Palette. With multiple VS Code windows, the reload
targets the most recently active window. Finish any interaction with the Command
Palette before requesting a reload. macOS may require granting Terminal
Accessibility/Automation access in System Settings > Privacy & Security.

Check the last request/result with:

```sh
python3 ~/doodles/ide-doodles/reload-helper.py --status
```

A successful result confirms that the apply script and keyboard automation
returned successfully; it cannot confirm that the new artwork rendered.
Failed requests are not retried automatically. Queue a new request after fixing
the reported error. Requests queued while the helper is stopped run on startup.

The helper accepts only a request identifier; it always runs the repository's
`apply.py`, never a command or path supplied by the request. Run it only while
working on trusted doodles source. Applying removes the obsolete title-bar refresh button. For manual reloads, run
`python3 ~/doodles/ide-doodles/apply.py --no-reload`, then use
**Developer: Reload Window**.

This updates the legacy injected decorations, not the portable Pasture webview.
If a VS Code update removes the injected blocks, those need restoring first.
