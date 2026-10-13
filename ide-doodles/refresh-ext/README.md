# Doodles Refresh

Press **Cmd+Option+R** on macOS (Ctrl+Alt+R elsewhere) to save open files,
apply `~/doodles/ide-doodles/apply.py --no-reload`, and reload the current VS Code
window. Repeated presses while applying are ignored. Failed applies leave the
window open and offer an output log. The command requires a trusted workspace.

One-time installation: run **Extensions: Install from VSIX…** in VS Code's
Command Palette and select `~/doodles/ide-doodles/refresh-ext/doodles-refresh-0.1.0.vsix`.
Reload if VS Code asks. The shortcut is then available in Keyboard Shortcuts as
**Doodles: Apply and Reload**.

Build with `python3 ide-doodles/refresh-ext/build.py`.
