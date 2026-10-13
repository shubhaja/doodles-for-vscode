#!/usr/bin/env python3
"""Run in a regular macOS terminal; --request queues a finished edit for reload."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import uuid

HERE = Path(__file__).resolve().parent
STATE = HERE / '.reload-helper'


def write_json(path, value):
    temporary = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    os.replace(temporary, path)


def read_json(path):
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, ValueError):
        return {}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--request', action='store_true', help='Queue one apply-and-reload')
    parser.add_argument('--status', action='store_true', help='Show the last result')
    args = parser.parse_args()
    STATE.mkdir(exist_ok=True)
    request_path, result_path = STATE / 'request.json', STATE / 'result.json'
    if args.request:
        token = uuid.uuid4().hex
        write_json(request_path, {'id': token, 'requested_at': time.time()})
        print(f'Queued reload {token}. The helper must be running in a regular terminal.')
        return
    if args.status:
        print(json.dumps({'request': read_json(request_path), 'result': read_json(result_path)}, indent=2))
        return
    # Only one helper may apply edits. The request supplies no command or path.
    with (STATE / 'lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            parser.exit(1, 'A reload helper is already running.\n')
        last = read_json(result_path).get('id')
        print('Doodles reload helper ready. Keep this terminal open; Ctrl+C stops it.', flush=True)
        while True:
            request = read_json(request_path)
            token = request.get('id')
            if isinstance(token, str) and token and token != last:
                print('Applying finished edits and requesting a VS Code reload…', flush=True)
                try:
                    result = subprocess.run([sys.executable, str(HERE / 'apply.py')],
                                            capture_output=True, text=True, timeout=45)
                    output = result.stdout + result.stderr
                    success = result.returncode == 0
                except subprocess.TimeoutExpired:
                    output, success = 'Apply/reload timed out. Check VS Code before retrying.', False
                write_json(result_path, {'id': token, 'success': success,
                                         'finished_at': time.time(), 'output': output})
                print(output, flush=True)
                # Failed requests require an explicit retry, avoiding reload loops.
                last = token
            time.sleep(0.5)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nDoodles reload helper stopped.')
