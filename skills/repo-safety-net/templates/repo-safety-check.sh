#!/usr/bin/env bash
# =============================================================================
# repo-safety-check.sh
# =============================================================================
# Pre-action hook that scans for sensitive files about to be shipped outward.
# Returns exit 0 if clean, exit 2 if a danger pattern matched (which blocks
# the action via Claude Code's PreToolUse hook contract).
#
# Reads stdin (Claude Code hook JSON input) to determine the operation type,
# then runs the appropriate scan.
# =============================================================================

set -uo pipefail

# Read hook JSON input
INPUT=$(cat)

# Extract the bash command being run (if available)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

# Patterns that should never appear in shipped output
DANGER_PATTERNS=(
    '\.claude/settings\.local\.json'
    '\.claude/sessions/'
    '\.claude/missions/'
    '\.claude/transcripts/'
    '\.claude/agent-memory/'
    '\.claude/\.local/'
    '\.claude/\.cache/'
    '(^|/)\.env($|\.[^.]*$)'
    '\.pem$'
    '\.key$'
    '\.p12$'
    '\.pfx$'
    '(^|/)id_rsa($|\.)'
    '(^|/)id_ed25519($|\.)'
    'secrets\.(json|yaml|yml)$'
    'credentials\.(json|yaml|yml)$'
    '-service-account.*\.json$'
    '\.map$'
)

# Allow-list (legitimate exceptions)
ALLOW_PATTERNS=(
    '\.env\.(example|template|sample)$'
    'package-lock\.json$'
    'yarn\.lock$'
)

# Check if a path matches any allow pattern
is_allowed() {
    local path="$1"
    for pattern in "${ALLOW_PATTERNS[@]}"; do
        if echo "$path" | grep -qE "$pattern"; then
            return 0
        fi
    done
    return 1
}

# Find matches for a list of files
scan_files() {
    local file_list="$1"
    local matches=()
    while IFS= read -r path; do
        [ -z "$path" ] && continue
        if is_allowed "$path"; then continue; fi
        for pattern in "${DANGER_PATTERNS[@]}"; do
            if echo "$path" | grep -qE "$pattern"; then
                matches+=("$path  (matched: $pattern)")
                break
            fi
        done
    done <<< "$file_list"

    if [ "${#matches[@]}" -gt 0 ]; then
        echo "BLOCKED: repo-safety-net detected sensitive files in this operation:" >&2
        printf '  %s\n' "${matches[@]}" >&2
        echo "" >&2
        echo "If this is intentional, the user must explicitly approve. Otherwise:" >&2
        echo "  - Unstage with: git reset HEAD <file>" >&2
        echo "  - Add to .gitignore (and .npmignore if publishing)" >&2
        echo "  - See repo-safety-net/templates/ for recommended patterns" >&2
        return 2
    fi
    return 0
}

# Determine operation and run appropriate scan
if [[ "$CMD" == *"git add"* ]] || [[ "$CMD" == *"git commit"* ]]; then
    # Scan staged files
    STAGED=$(git diff --cached --name-only 2>/dev/null || true)
    [ -z "$STAGED" ] && exit 0
    scan_files "$STAGED"
    exit $?
fi

if [[ "$CMD" == *"git push"* ]]; then
    # Scan everything new since last push
    UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)
    if [ -n "$UPSTREAM" ]; then
        FILES=$(git diff --name-only "$UPSTREAM"...HEAD 2>/dev/null || true)
    else
        FILES=$(git ls-files 2>/dev/null || true)
    fi
    [ -z "$FILES" ] && exit 0
    scan_files "$FILES"
    exit $?
fi

if [[ "$CMD" == *"npm publish"* ]] || [[ "$CMD" == *"npm pack"* ]]; then
    # Get what npm WOULD publish via dry-run
    if command -v npm >/dev/null 2>&1; then
        FILES=$(npm pack --dry-run --json 2>/dev/null | jq -r '.[0].files[]?.path' 2>/dev/null || true)
        [ -z "$FILES" ] && exit 0
        scan_files "$FILES"
        exit $?
    fi
fi

if [[ "$CMD" == *"docker build"* ]] || [[ "$CMD" == *"docker push"* ]]; then
    # Check for .dockerignore presence at minimum
    if [ ! -f .dockerignore ]; then
        echo "WARNING: docker build/push without .dockerignore — entire repo (incl. .git, node_modules, .claude/) will be in build context." >&2
        echo "Consider running 'cp /path/to/.dockerignore.recommended .dockerignore' first." >&2
        # Warning only, do not block (exit 0 — non-fatal stderr)
    fi
fi

exit 0
