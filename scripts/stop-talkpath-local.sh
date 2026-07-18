#!/bin/bash

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
RUNTIME_DIR="$PROJECT_ROOT/.talkpath-local"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LAUNCHER_PID_FILE="$RUNTIME_DIR/launcher.pid"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
FROM_LAUNCHER=0
QUIET=0
STOPPED_COUNT=0
SKIPPED_COUNT=0
REQUESTED_LAUNCHER_STOP=0

for argument in "$@"; do
  case "$argument" in
    --from-launcher)
      FROM_LAUNCHER=1
      ;;
    --quiet)
      QUIET=1
      ;;
    *)
      printf 'Unknown option: %s\n' "$argument" >&2
      exit 2
      ;;
  esac
done

log() {
  if [ "$QUIET" -eq 0 ]; then
    printf '[TalkPath AI] %s\n' "$1"
  fi
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

process_group_exists() {
  local process_group_id="$1"
  kill -0 -- "-$process_group_id" 2>/dev/null || kill -0 "$process_group_id" 2>/dev/null
}

process_group_belongs_to() {
  local process_group_id="$1"
  local expected_directory="$2"
  local process_directory=""
  local group_commands=""

  process_directory="$(
    lsof -a -p "$process_group_id" -d cwd -Fn 2>/dev/null |
      sed -n 's/^n//p' |
      head -n 1
  )"

  if [ "$process_directory" = "$expected_directory" ]; then
    return 0
  fi

  group_commands="$(
    ps -ax -o pgid=,command= 2>/dev/null |
      awk -v expected_group="$process_group_id" '$1 == expected_group { $1 = ""; sub(/^ +/, ""); print }'
  )"

  printf '%s\n' "$group_commands" | grep -F "$expected_directory" >/dev/null 2>&1
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

stop_service() {
  local service_name="$1"
  local pid_file="$2"
  local expected_directory="$3"
  local process_group_id=""
  local attempt=0

  if ! process_group_id="$(read_pid "$pid_file")"; then
    rm -f "$pid_file"
    return 0
  fi

  if ! process_group_exists "$process_group_id"; then
    rm -f "$pid_file"
    return 0
  fi

  if ! process_group_belongs_to "$process_group_id" "$expected_directory"; then
    log "Skipped $service_name because PID $process_group_id is not owned by this TalkPath AI launcher."
    rm -f "$pid_file"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return 0
  fi

  log "Stopping $service_name..."
  kill -TERM -- "-$process_group_id" 2>/dev/null || kill -TERM "$process_group_id" 2>/dev/null || true

  while process_group_exists "$process_group_id" && [ "$attempt" -lt 50 ]; do
    sleep 0.1
    attempt=$((attempt + 1))
  done

  if process_group_exists "$process_group_id"; then
    log "$service_name did not stop in time; ending its launcher-owned process group."
    kill -KILL -- "-$process_group_id" 2>/dev/null || kill -KILL "$process_group_id" 2>/dev/null || true
  fi

  rm -f "$pid_file"
  STOPPED_COUNT=$((STOPPED_COUNT + 1))
}

if [ "$FROM_LAUNCHER" -eq 0 ]; then
  launcher_pid="$(read_pid "$LAUNCHER_PID_FILE" 2>/dev/null || true)"

  if [ -n "$launcher_pid" ] && launcher_is_running "$launcher_pid"; then
    log "Asking the TalkPath AI launcher to stop..."
    REQUESTED_LAUNCHER_STOP=1
    kill -TERM "$launcher_pid" 2>/dev/null || true

    launcher_wait_attempt=0
    while kill -0 "$launcher_pid" 2>/dev/null && [ "$launcher_wait_attempt" -lt 80 ]; do
      sleep 0.1
      launcher_wait_attempt=$((launcher_wait_attempt + 1))
    done
  fi
fi

stop_service "frontend" "$FRONTEND_PID_FILE" "$FRONTEND_DIR"
stop_service "backend" "$BACKEND_PID_FILE" "$BACKEND_DIR"
rm -f "$LAUNCHER_PID_FILE"

if [ "$QUIET" -eq 0 ]; then
  if [ "$STOPPED_COUNT" -gt 0 ] || [ "$REQUESTED_LAUNCHER_STOP" -eq 1 ]; then
    log "TalkPath AI services stopped."
  elif [ "$SKIPPED_COUNT" -gt 0 ]; then
    log "No unrelated processes were stopped. Stale PID files were cleaned up."
  else
    log "No launcher-managed TalkPath AI services were running."
  fi
fi
