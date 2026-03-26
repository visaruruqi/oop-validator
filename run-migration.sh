#!/bin/bash
# ============================================================================
# run-migration.sh
#
# Runs Claude Code with the full migration prompt, unattended.
# Sends a push notification to your phone when done.
#
# SETUP (one time):
#
#   Option A — ntfy.sh (free, no account needed, works on iOS + Android):
#     1. Install ntfy app on your phone:
#        - iOS: https://apps.apple.com/app/ntfy/id1625396347
#        - Android: https://play.google.com/store/apps/details?id=io.heckel.ntfy
#     2. In the app, subscribe to a topic (pick a unique name like "visar-oop-validator")
#     3. Set NTFY_TOPIC below to that topic name
#
#   Option B — macOS desktop notification only (no phone):
#     No setup needed, just uses osascript
#
# USAGE:
#   cd /Users/visaruruqi/Desktop/projects/visaruruqi/oop-validator
#   bash run-migration.sh
#
# ============================================================================

set -e

# ---- CONFIGURATION ----
NTFY_TOPIC="visar-oop-validator"   # Change this to your ntfy topic
PROJECT_DIR="/Users/visaruruqi/Desktop/projects/visaruruqi/oop-validator"
PROMPT_FILE="$PROJECT_DIR/docs/specs/prompt.txt"
# ---- END CONFIGURATION ----

cd "$PROJECT_DIR"

echo "🚀 Starting Claude Code migration..."
echo "   Project: $PROJECT_DIR"
echo "   Prompt:  $PROMPT_FILE"
echo ""

# Read the prompt from file
PROMPT=$(cat "$PROMPT_FILE")

# Run Claude Code with the prompt piped in
# --dangerously-skip-permissions: lets Claude run commands without asking
# --verbose: shows what it's doing
# The prompt is passed via --print won't work here, we need interactive mode
# So we use the -p flag to pass a prompt directly

claude -p "$PROMPT" --dangerously-skip-permissions 2>&1 | tee migration-output.log

EXIT_CODE=${PIPESTATUS[0]}

# ---- NOTIFICATION ----

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ $EXIT_CODE -eq 0 ]; then
    MESSAGE="✅ oop-validator migration completed successfully at $TIMESTAMP"
else
    MESSAGE="❌ oop-validator migration exited with code $EXIT_CODE at $TIMESTAMP"
fi

# Phone notification via ntfy.sh (free push notification service)
curl -s -d "$MESSAGE" "https://ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 || true

# macOS desktop notification as backup
osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\"" 2>/dev/null || true

echo ""
echo "========================================"
echo "$MESSAGE"
echo "Full output saved to: migration-output.log"
echo "========================================"
