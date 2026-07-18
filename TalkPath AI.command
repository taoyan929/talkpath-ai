#!/bin/bash

set -u

COMMAND_DIR="$(cd "$(dirname "$0")" && pwd -P)"
LAUNCHER="$COMMAND_DIR/scripts/start-talkpath-local.sh"

if [ ! -f "$LAUNCHER" ]; then
  printf 'TalkPath AI launcher was not found at:\n%s\n' "$LAUNCHER" >&2
  printf 'Press Return to close this window.\n'
  read -r _
  exit 1
fi

exec /bin/bash "$LAUNCHER"
