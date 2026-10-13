#!/usr/bin/env python3
"""Re-inject the IDE doodles from ide-doodles/src into VS Code's workbench.html, then ask VS Code to reload.
Run OUTSIDE the personal-Codex sandbox (it writes into /Applications), using doodle-apply.
--no-reload lets you use Developer: Reload Window yourself.
Each source file replaces the matching <!-- name-start --> ... <!-- name-end --> block. A timestamped backup of
workbench.html goes to ide-doodles/backups/ first. Blocks with no change are left alone. --check only reports."""
import re, sys, shutil, subprocess
from datetime import datetime
from pathlib import Path
from restore_support import restore_foundation, restore_statusbar, restore_terminal_goals
HERE = Path(__file__).resolve().parent
W = Path("/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html")
BLOCKS = {  # block name -> (source file, wrapper tag)
    "terminal-eyes": ("src/terminal/terminal-eyes.js", "script"),
    "night-sky": ("src/world/night-sky.js", "script"),
    "cozy-mode": ("src/world/cozy-mode.js", "script"),
    "pixel-goldfish": ("src/goldfish/goldfish.js", "script"),
    "ktown-weather": ("src/weather/ktown-weather.js", "script"), "neutral-focus-dim": ("src/terminal/neutral-focus-dim.css", "style"),
    "pasture-audio": ("src/sheep/pasture-audio.js", "script"), "pasture-sheep": ("src/sheep/sheep-overlay.js", "script"),
    "pasture-fireflies": ("src/sheep/fireflies-overlay.js", "script"), "pixel-disco": ("src/sheep/disco-overlay.js", "script"),
    "pasture-flowers": ("src/sheep/flower-foraging.js", "script"), "pasture-run": ("src/sheep/sheep-run.js", "script"),
    "terminal-goals": ("src/terminal/terminal-goals.js", "script")}
check = "--check" in sys.argv; no_reload = "--no-reload" in sys.argv
html = W.read_text(); out = html; changed = []
out = restore_foundation(out, HERE)
if out != html: changed.append('paper, grass and script permission')
# Remove the retired animal art loader from older installations.
out, removed = re.subn(r"<!-- evolution-assets-start -->.*?<!-- evolution-assets-end -->", "", out, flags=re.S)
if removed: changed.append("removed bird/frog assets")
out, removed = re.subn(r"<!-- dark-mode-start -->.*?<!-- dark-mode-end -->", "", out, flags=re.S)
if removed: changed.append("replaced dark mode with cozy mode")
# Retire the string lights in existing installations too.
out, removed = re.subn(r"<!-- string-lights-start -->.*?<!-- string-lights-end -->", "", out, flags=re.S)
if removed: changed.append("removed string-lights")
# Remove the retired control from existing installations as well.
out, removed = re.subn(r"<!-- doodle-reload-start -->.*?<!-- doodle-reload-end -->", "", out, flags=re.S)
if removed: changed.append("removed doodle-reload")
# Bootstrap shared services before all dependent blocks, including existing installations.
world_source = '\n'.join((HERE / ('src/world/' + name + '.js')).read_text().strip() for name in ('modes', 'settings', 'host-appearance'))
world_block = '<!-- doodles-world-start -->\n<script>\n' + world_source + '\n</script>\n<!-- doodles-world-end -->\n'
without_world = re.sub(r'<!-- doodles-world-start -->.*?<!-- doodles-world-end -->\n?', '', out, flags=re.S)
positions = [m.start() for m in re.finditer(r'<!-- (?:' + '|'.join(BLOCKS) + r')-start -->', without_world)]
position = min(positions) if positions else re.search(r'</html\s*>', without_world, re.I).start()
with_world = without_world[:position] + world_block + without_world[position:]
if with_world != out: changed.append('doodles-world')
out = with_world
for name, (src, tag) in BLOCKS.items():
    f = HERE / src
    if not f.exists(): print(f"  missing source {src}, skipped"); continue
    source = f.read_text().strip()
    if name == 'ktown-weather':
        source = '\n'.join((HERE / path).read_text().strip() for path in
                           ['src/weather/vendor/simplex-noise.js', 'src/weather/cloud-field.js', 'src/weather/fine-rain.js', 'src/weather/rain-field.js']) + '\n' + source
    new = f"<!-- {name}-start -->\n<{tag}>\n{source}\n</{tag}>\n<!-- {name}-end -->"
    pat = re.compile(rf"<!-- {name}-start -->.*?<!-- {name}-end -->", re.S)
    m = pat.search(out)
    if not m:
        closing = re.search(r'</html\s*>', out, re.I)
        if not closing: raise ValueError('Workbench has no closing html tag')
        out = out[:closing.start()] + new + '\n' + out[closing.start():]
        changed.append(name)
        continue
    cur = re.sub(rf"^\s*<{tag}>\s*|\s*</{tag}>\s*$", "", m.group(0)[len(f"<!-- {name}-start -->"):-len(f"<!-- {name}-end -->")], flags=re.S).strip()
    if cur == source: continue
    out = out[:m.start()] + new + out[m.end():]; changed.append(name)
# Remove the retired statue overlay from older installations.
out, removed = re.subn(r"<!-- margin-snowglobe-start -->.*?<!-- margin-snowglobe-end -->", "", out, flags=re.S)
if removed: changed.append('removed margin-snowglobe')
if not changed: print("workbench.html already matches src/.")
else: print("changed:", ", ".join(changed))
restore_terminal_goals(W.parents[3] / 'workbench/workbench.desktop.main.js', HERE, check=check)
if check: sys.exit(0)
# Keep the theme command implementation in step with its injected controls.
sky_extension = Path.home() / '.vscode/extensions/local-custom.daylight-sky-0.0.1/extension.js'
sky_source = HERE / 'daylight-sky/extension.js'
if sky_extension.exists() and sky_extension.read_bytes() != sky_source.read_bytes():
    backup = HERE / 'backups' / ('daylight-sky.extension.js.before-apply-' + datetime.now().strftime('%y%m%d-%H%M%S-%f'))
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(sky_extension, backup)
    shutil.copyfile(sky_source, sky_extension)
    print('Updated Daylight Sky time controls.')
appearance_target = sky_extension.with_name('appearance.js')
appearance_source = HERE / 'src/world/host-appearance.js'
if sky_extension.exists() and (not appearance_target.exists() or appearance_target.read_bytes() != appearance_source.read_bytes()):
    shutil.copyfile(appearance_source, appearance_target)
# Reserve layout space for the ground decorations as well as updating artwork.
restore_statusbar(W.parents[3] / 'workbench/workbench.desktop.main.js', HERE)
if changed:
    bk = HERE / "backups" / f"workbench.html.before-apply-{datetime.now():%y%m%d-%H%M%S-%f}"
    bk.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(W, bk); W.write_text(out); print(f"applied. backup: {bk.name}")
if no_reload: sys.exit(0)
reload = subprocess.run(["osascript", "-e", 'tell application "Visual Studio Code" to activate',
                "-e", "delay 0.5", "-e", 'tell application "System Events" to tell process "Code" to keystroke "p" using {command down, shift down}',
                "-e", "delay 0.4", "-e", 'tell application "System Events" to keystroke "Developer: Reload Window"', "-e", "delay 0.4",
                "-e", 'tell application "System Events" to key code 36'], capture_output=True, text=True)
if reload.returncode:
    print("Reload request failed: " + reload.stderr.strip(), file=sys.stderr)
    print("Allow your terminal in System Settings > Privacy & Security > Accessibility, then retry.", file=sys.stderr)
    sys.exit(1)
print("asked VS Code to reload. If it did not, Cmd+Shift+P > Developer: Reload Window.")
