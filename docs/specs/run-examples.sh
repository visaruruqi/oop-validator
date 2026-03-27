#!/bin/zsh
# ============================================================================
# run-examples.sh
#
# Runs Claude Code to create the sample forms with router.
# Sends push notification when done.
#
# USAGE:
#   cd /Users/visaruruqi/Desktop/projects/visaruruqi/oop-validator
#   zsh run-examples.sh
#
# ============================================================================

set -e

NTFY_TOPIC="visar-oop-validator"
PROJECT_DIR="/Users/visaruruqi/Desktop/projects/visaruruqi/oop-validator"
PROMPT_FILE="$PROJECT_DIR/docs/specs/prompt-sample-forms.txt"
LOG_FILE="$PROJECT_DIR/examples-output.log"

cd "$PROJECT_DIR"

echo "🚀 Starting Claude Code — creating example forms..."
echo "   Prompt: $PROMPT_FILE"
echo "   Log:    $LOG_FILE"
echo ""

PROMPT=$(cat "$PROMPT_FILE")

claude -p "$PROMPT" --dangerously-skip-permissions 2>&1 | tee "$LOG_FILE"
EXIT_CODE=$pipestatus[1]

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ $EXIT_CODE -eq 0 ]; then
    MESSAGE="✅ oop-validator examples completed at $TIMESTAMP"
else
    MESSAGE="❌ oop-validator examples failed (exit $EXIT_CODE) at $TIMESTAMP"
fi

curl -s -d "$MESSAGE" "https://ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 || true
osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\"" 2>/dev/null || true

echo ""
echo "========================================"
echo "$MESSAGE"
echo "Log: $LOG_FILE"
echo "========================================"
