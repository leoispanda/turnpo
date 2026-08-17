#!/bin/zsh
set -e
cd "$(dirname "$0")"

for PYTHON_BIN in /usr/local/bin/python3 /opt/homebrew/bin/python3 /usr/bin/python3; do
  if [[ -x "$PYTHON_BIN" ]]; then
    break
  fi
done

if [[ ! -x "$PYTHON_BIN" ]]; then
  print -u2 "选股神器找不到 Python 3。"
  exit 1
fi

exec "$PYTHON_BIN" scripts/start_pdc_local.py "$@"
