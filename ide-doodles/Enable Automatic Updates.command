#!/bin/zsh
cd -- "${0:A:h}" || exit 1
python3 auto-apply.py --install
if [ $? -ne 0 ]; then
  echo 'Setup failed. Please share the error above.'
else
  echo 'Setup complete. Wait a few seconds, then reload VS Code.'
fi
read -r '?Press Return to close.'
