#!/usr/bin/env python3
"""Keep installed decorations current without reloading the editor."""
import argparse
import hashlib
import os
from pathlib import Path
import plistlib
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
LABEL = 'local.doodles.auto-apply'


def fingerprint(include_workbench=True):
    digest = hashlib.sha256()
    paths = [HERE / 'apply.py', HERE / 'restore_support.py', HERE / 'daylight-sky/extension.js']
    paths += sorted(p for p in (HERE / 'src').rglob('*')
                    if p.suffix in {'.js', '.css', '.png'})
    for path in paths:
        digest.update(str(path.relative_to(HERE)).encode())
        digest.update(path.read_bytes())
    if not include_workbench:
        return digest.digest()
    # Reapply after an application update as well as after source edits.
    workbench = Path('/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html')
    try:
        stat = workbench.stat()
        digest.update(f'{stat.st_ino}:{stat.st_mtime_ns}:{stat.st_size}'.encode())
    except FileNotFoundError:
        digest.update(b'VS Code not installed')
    return digest.digest()


def install():
    directory = Path.home() / 'Library/LaunchAgents'
    directory.mkdir(parents=True, exist_ok=True)
    logs = HERE / '.reload-helper'
    logs.mkdir(exist_ok=True)
    target = directory / (LABEL + '.plist')
    config = {
        'Label': LABEL,
        'ProgramArguments': [sys.executable, str(Path(__file__).resolve())],
        'RunAtLoad': True,
        'KeepAlive': True,
        'ThrottleInterval': 10,
        'StandardOutPath': str(logs / 'auto-apply.log'),
        'StandardErrorPath': str(logs / 'auto-apply.log'),
    }
    target.write_bytes(plistlib.dumps(config))
    domain = f'gui/{os.getuid()}'
    subprocess.run(['launchctl', 'bootout', domain + '/' + LABEL], capture_output=True)
    subprocess.run(['launchctl', 'bootstrap', domain, str(target)], check=True)
    print('Automatic apply installed. Saved edits apply in the background; use Developer: Reload Window to see them.')
    print(f'Log: {logs / "auto-apply.log"}')


def watch():
    applied = pending = None
    changed_at = retry_at = 0
    print('Watching doodles source. Reload VS Code to see saved changes.', flush=True)
    while True:
        try:
            current = fingerprint()
            now = time.monotonic()
            if current != pending:
                pending, changed_at = current, now
            # Wait for a quiet second so a multi-file save is not applied halfway.
            if current != applied and now - changed_at >= 1 and now >= retry_at:
                source_before = fingerprint(False)
                result = subprocess.run([sys.executable, str(HERE / 'apply.py'), '--no-reload'],
                                        capture_output=True, text=True, timeout=45)
                print(result.stdout + result.stderr, flush=True)
                if result.returncode == 0:
                    # The apply itself changes the installed page's timestamp.
                    # If source changed during apply, the next pass must retry.
                    after = fingerprint()
                    applied = after if source_before == fingerprint(False) else None
                retry_at = time.monotonic() + (2 if result.returncode == 0 else 30)
        except (OSError, subprocess.TimeoutExpired) as error:
            print(f'Automatic apply failed: {error}', flush=True)
            time.sleep(30)
        time.sleep(0.5)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install', action='store_true')
    args = parser.parse_args()
    if args.install:
        install()
    else:
        watch()
