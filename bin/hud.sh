#!/usr/bin/env sh
set -eu

# Resolve directory of this script
case $0 in
  */*) SCRIPT_DIR=${0%/*} ;;
  *) SCRIPT_DIR=. ;;
esac
SCRIPT_DIR=$(CDPATH= cd -- "${SCRIPT_DIR:-/}" && pwd)

# Function to test if a directory has an executable node
has_node() {
  [ -f "$1/node" ] && [ -x "$1/node" ]
}

NODE_BIN=""
if command -v node >/dev/null 2>&1; then
  NODE_BIN="node"
elif has_node "${VOLTA_HOME:-$HOME/.volta}/bin"; then
  NODE_BIN="${VOLTA_HOME:-$HOME/.volta}/bin/node"
elif has_node "/opt/homebrew/bin"; then
  NODE_BIN="/opt/homebrew/bin/node"
elif has_node "/usr/local/bin"; then
  NODE_BIN="/usr/local/bin/node"
elif has_node "/home/linuxbrew/.linuxbrew/bin"; then
  NODE_BIN="/home/linuxbrew/.linuxbrew/bin/node"
elif [ -d "$HOME/.nvm/versions/node" ]; then
  # Grab the latest installed nvm version
  LATEST_NVM=$(ls -d "$HOME/.nvm/versions/node/"* 2>/dev/null | sort -V | tail -n1)
  if [ -n "$LATEST_NVM" ] && has_node "$LATEST_NVM/bin"; then
    NODE_BIN="$LATEST_NVM/bin/node"
  fi
fi

if [ -z "$NODE_BIN" ]; then
  NODE_BIN="node"
fi

exec "$NODE_BIN" "$SCRIPT_DIR/hud.js"
