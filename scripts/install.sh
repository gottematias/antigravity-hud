#!/usr/bin/env sh
set -eu

case $0 in
  */*) SCRIPT_DIR=${0%/*} ;;
  *) SCRIPT_DIR=. ;;
esac
SCRIPT_DIR=$(CDPATH= cd -- "${SCRIPT_DIR:-/}" && pwd)

NODE_BIN="node"
if ! command -v node >/dev/null 2>&1; then
  if [ -x "${VOLTA_HOME:-$HOME/.volta}/bin/node" ]; then
    NODE_BIN="${VOLTA_HOME:-$HOME/.volta}/bin/node"
  elif [ -x "/opt/homebrew/bin/node" ]; then
    NODE_BIN="/opt/homebrew/bin/node"
  elif [ -x "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
  fi
fi

exec "$NODE_BIN" "$SCRIPT_DIR/install.js" "$@"
