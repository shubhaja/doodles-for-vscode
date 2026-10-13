#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if python3 apply.py --no-reload; then
  echo 'Doodles applied. In VS Code press Cmd+Shift+P and run Developer: Reload Window.'
else
  echo 'Restore could not finish.'
  echo 'If the error says Operation not permitted for /Applications/Visual Studio Code.app:'
  echo 'Open System Settings > Privacy & Security > App Management and enable Terminal.'
  echo 'Quit Terminal, then double-click Restore Doodles.command in Finder again.'
  echo 'Run it from Finder, outside the sandboxed doodle/Codex terminal.'
  echo 'If it still fails, share the error above.'
fi
read -r '?Press Return to close.'
