#!/bin/bash

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
RUNTIME_DIR="$PROJECT_ROOT/.talkpath-local"
STOP_SCRIPT="$SCRIPT_DIR/stop-talkpath-local.sh"
LAUNCHER_PID_FILE="$RUNTIME_DIR/launcher.pid"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
LAUNCHER_LOG="$RUNTIME_DIR/launcher.log"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"
BACKEND_PORT="${TALKPATH_BACKEND_PORT:-8000}"
FRONTEND_PORT="${TALKPATH_FRONTEND_PORT:-5173}"
BACKEND_URL="http://localhost:$BACKEND_PORT/api/health"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"
CLEANUP_COMPLETE=0

mkdir -p "$RUNTIME_DIR"
: > "$LAUNCHER_LOG"

log() {
  printf '[TalkPath AI] %s\n' "$1" | tee -a "$LAUNCHER_LOG"
}

load_nvm_if_needed() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # nvm is loaded only to make the user's existing Node.js installation available.
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
  fi
}

require_command() {
  local command_name="$1"
  local help_message="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    log "$help_message"
    exit 1
  fi
}

port_is_occupied() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

read_pid() {
  local pid_file="$1"
  local pid=""

  if [ ! -f "$pid_file" ]; then
    return 1
  fi

  IFS= read -r pid < "$pid_file" || true

  case "$pid" in
    ''|*[!0-9]*)
      return 1
      ;;
    *)
      printf '%s\n' "$pid"
      ;;
  esac
}

launcher_is_running() {
  local launcher_pid="$1"
  local launcher_directory=""
  local launcher_command=""

  if ! kill -0 "$launcher_pid" 2>/dev/null; then
    return 1
  fi

  launcher_directory="$(
    lsof -a -p "$launcher_pid" -d cwd -Fn 2>/dev/null |
      sed -n 's/^n//p' |
      head -n 1
  )"
  launcher_command="$(ps -p "$launcher_pid" -o command= 2>/dev/null || true)"

  [ "$launcher_directory" = "$PROJECT_ROOT" ] &&
    printf '%s\n' "$launcher_command" | grep -F 'start-talkpath-local.sh' >/dev/null 2>&1
}

process_group_exists() {
  local process_group_id="$1"
  kill -0 -- "-$process_group_id" 2>/dev/null || kill -0 "$process_group_id" 2>/dev/null
}

cleanup() {
  if [ "$CLEANUP_COMPLETE" -eq 1 ]; then
    return
  fi

  CLEANUP_COMPLETE=1
  trap - EXIT INT TERM HUP
  log "Stopping local services..."
  /bin/bash "$STOP_SCRIPT" --from-launcher --quiet
  rm -f "$LAUNCHER_PID_FILE"
  log "Launcher closed."
}

wait_for_url() {
  local service_name="$1"
  local url="$2"
  local process_group_id="$3"
  local attempt=0

  while [ "$attempt" -lt 60 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$service_name is ready."
      return 0
    fi

    if ! process_group_exists "$process_group_id"; then
      log "$service_name stopped before it became ready. Check $RUNTIME_DIR/${service_name}.log"
      return 1
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  log "Timed out waiting for $service_name. Check $RUNTIME_DIR/${service_name}.log"
  return 1
}

cd "$PROJECT_ROOT"
load_nvm_if_needed
require_command "node" "Node.js was not found. Install Node.js first, then try again."
require_command "npm" "npm was not found. Install Node.js and npm first, then try again."
require_command "curl" "The macOS curl command is required but was not found."
require_command "lsof" "The macOS lsof command is required but was not found."
require_command "open" "The macOS open command is required but was not found."

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  log "Backend dependencies are missing. Run: cd \"$BACKEND_DIR\" && npm install"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  log "Frontend dependencies are missing. Run: cd \"$FRONTEND_DIR\" && npm install"
  exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  log "backend/.env is missing. Copy backend/.env.example to backend/.env and add your local Gemini configuration."
  exit 1
fi

existing_launcher_pid="$(read_pid "$LAUNCHER_PID_FILE" 2>/dev/null || true)"
if [ -n "$existing_launcher_pid" ] && launcher_is_running "$existing_launcher_pid"; then
  log "TalkPath AI is already running from this launcher."
  if curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
    open "$FRONTEND_URL"
  fi
  exit 0
fi

rm -f "$LAUNCHER_PID_FILE"

if [ -f "$BACKEND_PID_FILE" ] || [ -f "$FRONTEND_PID_FILE" ]; then
  log "Cleaning up stale launcher PID files..."
  /bin/bash "$STOP_SCRIPT" --quiet
fi

if port_is_occupied "$BACKEND_PORT"; then
  log "Port $BACKEND_PORT is already occupied. Stop the existing backend before using this launcher. No process was stopped."
  exit 1
fi

if port_is_occupied "$FRONTEND_PORT"; then
  log "Port $FRONTEND_PORT is already occupied. Stop the existing frontend before using this launcher. No process was stopped."
  exit 1
fi

: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"
printf '%s\n' "$$" > "$LAUNCHER_PID_FILE"
trap cleanup EXIT
trap 'cleanup; exit 0' INT TERM HUP

log "Starting TalkPath AI from $PROJECT_ROOT"
set -m

(
  cd "$BACKEND_DIR" || exit 1
  exec env PORT="$BACKEND_PORT" npm run dev
) >> "$BACKEND_LOG" 2>&1 &
BACKEND_PROCESS_GROUP=$!
printf '%s\n' "$BACKEND_PROCESS_GROUP" > "$BACKEND_PID_FILE"

(
  cd "$FRONTEND_DIR" || exit 1
  exec npm run dev -- --port "$FRONTEND_PORT"
) >> "$FRONTEND_LOG" 2>&1 &
FRONTEND_PROCESS_GROUP=$!
printf '%s\n' "$FRONTEND_PROCESS_GROUP" > "$FRONTEND_PID_FILE"

if ! wait_for_url "backend" "$BACKEND_URL" "$BACKEND_PROCESS_GROUP"; then
  exit 1
fi

if ! wait_for_url "frontend" "$FRONTEND_URL" "$FRONTEND_PROCESS_GROUP"; then
  exit 1
fi

if [ "${TALKPATH_SKIP_BROWSER_OPEN:-0}" = "1" ]; then
  log "Browser opening skipped for this launcher test."
else
  log "Opening $FRONTEND_URL"
  open "$FRONTEND_URL"
fi
log "TalkPath AI is running. Keep this window open; close it or press Control-C to stop both services."

while process_group_exists "$BACKEND_PROCESS_GROUP" && process_group_exists "$FRONTEND_PROCESS_GROUP"; do
  sleep 2
done

log "A service stopped unexpectedly. Check the logs in $RUNTIME_DIR"
exit 1
