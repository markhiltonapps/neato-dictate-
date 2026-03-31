#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "This script will stop Neato Dictate, remove the installed app, and delete caches, databases, and preferences."
read -r -p "Continue with the full uninstall? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

remove_target() {
  local target="$1"
  if [[ -e "$target" ]]; then
    echo "Removing $target"
    rm -rf "$target" 2>/dev/null || sudo rm -rf "$target"
  fi
}

echo "Stopping running Neato Dictate/Electron processes..."
pkill -f "Neato Dictate" 2>/dev/null || true
pkill -f "neato-dictate" 2>/dev/null || true
pkill -f "Electron Helper.*Neato Dictate" 2>/dev/null || true

echo "Removing /Applications/Neato Dictate.app (requires admin)..."
remove_target "/Applications/Neato Dictate.app"

echo "Purging Application Support data..."
remove_target "$HOME/Library/Application Support/Neato Dictate"
remove_target "$HOME/Library/Application Support/neato-dictate"
remove_target "$HOME/Library/Application Support/Neato Dictate-dev"
remove_target "$HOME/Library/Application Support/com.neatoventures.neatodictate"
remove_target "$HOME/Library/Application Support/com.neatoventures.neatodictate.Neato Dictate"

echo "Removing caches, logs, and saved state..."
remove_target "$HOME/Library/Caches/neato-dictate"
remove_target "$HOME/Library/Caches/com.neatoventures.neatodictate.Neato Dictate"
remove_target "$HOME/Library/Preferences/com.neatoventures.neatodictate.Neato Dictate.plist"
remove_target "$HOME/Library/Preferences/com.neatoventures.neatodictate.helper.plist"
remove_target "$HOME/Library/Logs/Neato Dictate"
remove_target "$HOME/Library/Saved Application State/com.neatoventures.neatodictate.Neato Dictate.savedState"

echo "Cleaning temporary files..."
shopt -s nullglob
for tmp in /tmp/neato-dictate*; do
  remove_target "$tmp"
done
for crash in "$HOME/Library/Application Support/CrashReporter"/Neato Dictate_*; do
  remove_target "$crash"
done
shopt -u nullglob

read -r -p "Remove downloaded Whisper models and caches (~/.cache/whisper, ~/Library/Application Support/whisper)? [y/N]: " wipe_models
if [[ "$wipe_models" =~ ^[Yy]$ ]]; then
  remove_target "$HOME/.cache/whisper"
  remove_target "$HOME/Library/Application Support/whisper"
  remove_target "$HOME/Library/Application Support/Neato Dictate/models"
fi

ENV_FILE="$PROJECT_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  read -r -p "Remove the local environment file at $ENV_FILE? [y/N]: " wipe_env
  if [[ "$wipe_env" =~ ^[Yy]$ ]]; then
    echo "Removing $ENV_FILE"
    rm -f "$ENV_FILE"
  fi
fi

cat <<'EOF'
macOS keeps microphone, screen recording, and accessibility approvals even after files are removed.
Reset them if you want a truly fresh start:
  tccutil reset Microphone com.neatoventures.neatodictate.app
  tccutil reset Accessibility com.neatoventures.neatodictate.app
  tccutil reset ScreenCapture com.neatoventures.neatodictate.app

Full uninstall complete. Reboot if you removed permissions, then reinstall or run npm scripts on a clean tree.
EOF
