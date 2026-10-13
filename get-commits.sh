#!/bin/bash
#
# Combined changelog for the cabbage backend (develop) and the vscabbage
# extension (main).
#
# Run locally, or leave it to the scheduled .github/workflows/changelog.yaml
# workflow. Progress cursors live in .changelog-cursors (committed) so a
# reordered or hand-edited CHANGELOG.md can never corrupt the commit ranges.

REPO_URL="https://github.com/rorywalsh/cabbage"
REPO_NAME="cabbage-minimal"
CABBAGE_BRANCH="develop"
VS_CABBAGE_BRANCH="main"
CHANGELOG_FILE="CHANGELOG.md"
CURSOR_FILE=".changelog-cursors"
TEMP_FILE=$(mktemp)

cd "$(dirname "$0")" || exit 1

# Initialize changelog with optimized table format
if [ ! -f "$CHANGELOG_FILE" ]; then
    cat > "$CHANGELOG_FILE" <<EOF
# Cabbage (develop) and vscabbage (main) Combined Changelog

| Message                                | Repo      | Date       | Commit                            |
|----------------------------------------|-----------|------------|-----------------------------------|
EOF
fi

# Read the cursor for a repo: cursor file first, legacy table lookup as a
# fallback (rows written before the repo move used the "cabbage3" label).
get_last_hash() {
    local repo=$1
    if [ -f "$CURSOR_FILE" ]; then
        local h
        h=$(grep -E "^${repo}=" "$CURSOR_FILE" | cut -d= -f2 | tr -d '[:space:]')
        if [ -n "$h" ]; then
            echo "$h"
            return
        fi
    fi
    local legacy=$repo
    [ "$repo" = "cabbage" ] && legacy="cabbage3"
    awk -v repo=" $legacy " -F '|' '$3 == repo {h=$5; gsub(/ /, "", h); print h; exit}' "$CHANGELOG_FILE" 2>/dev/null
}

# Get last known commits
LAST_CABBAGE=$(get_last_hash "cabbage")
LAST_VSCABBAGE=$(get_last_hash "vscabbage")

echo "Last known commits:"
echo "  cabbage (develop): ${LAST_CABBAGE:-None}"
echo "  vscabbage (main): ${LAST_VSCABBAGE:-None}"

# Function to collect commits with proper date sorting and filtering
collect_commits() {
    local repo_name=$1
    local repo_path=$2
    local last_hash=$3
    local branch=$4
    local is_fresh_clone=$5

    (
        cd "$repo_path" || exit 1
        if [ "$is_fresh_clone" != "1" ]; then
            git checkout "$branch" >/dev/null 2>&1
            git pull origin "$branch" >/dev/null 2>&1
        fi

        local range="HEAD"
        [ -n "$last_hash" ] && range="$last_hash..HEAD"

        # Get commits with Unix timestamp for accurate sorting
        git log "$range" --pretty=format:"%at %H %ad" --date=short --no-merges | while read -r ts hash date; do
            local msg=$(git show -s --format=%s "$hash")
            local msg_lc=$(echo "$msg" | tr '[:upper:]' '[:lower:]')

            # Skip version bump, changelog maintenance and build-trigger commits
            if [[ "$msg_lc" == *"bump"*version* ]] ||
               [[ "$msg_lc" == *"update changelog"* ]] ||
               [[ "$msg_lc" == *"updating changelog"* ]] ||
               [[ "$msg_lc" == *"triggering build"* ]] ||
               [[ "$msg_lc" == *"retriggering"* ]] ||
               [[ "$msg_lc" == *"run_build"* ]]; then
                continue
            fi

            # Output: timestamp|message|repo|date|hash
            printf "%s|%s|%s|%s|%s\n" "$ts" "$msg" "$repo_name" "$date" "$hash"
        done
    )
}

echo "Cloning $REPO_URL (branch: $CABBAGE_BRANCH)..."
[ -d "$REPO_NAME" ] && rm -rf "$REPO_NAME"
git clone --branch "$CABBAGE_BRANCH" "$REPO_URL" "$REPO_NAME" >/dev/null 2>&1 || {
    echo "Failed to clone repository"
    exit 1
}

# Collect all new commits with proper timestamp
echo -e "\nCollecting commits from both repositories..."
{
    collect_commits "cabbage" "$REPO_NAME" "$LAST_CABBAGE" "$CABBAGE_BRANCH" 1
    collect_commits "vscabbage" "." "$LAST_VSCABBAGE" "$VS_CABBAGE_BRANCH" 0
} > "$TEMP_FILE.commits"

# Sort by timestamp (newest first) and format as markdown table
sort -t'|' -k1,1nr "$TEMP_FILE.commits" | while IFS='|' read -r ts msg repo date hash; do
    # Clean and format the message (replace pipes, truncate to 60 chars)
    clean_msg=$(echo "$msg" | sed 's/|/-/g' | cut -c 1-60)
    # Format into table columns
    printf "| %-60s | %-9s | %-10s | %-40s |\n" "$clean_msg" "$repo" "$date" "$hash"
done > "$TEMP_FILE"

# Count new commits (table rows only, not the separator)
NEW_COMMITS=$(grep -c "^| [^ -]" "$TEMP_FILE" || echo 0)

if [ "$NEW_COMMITS" -eq 0 ]; then
    echo -e "\n✅ No new commits found (after filtering)."
    rm -f "$TEMP_FILE" "$TEMP_FILE.commits"
    rm -rf "$REPO_NAME"
    exit 0
fi

echo -e "\n✨ Found $NEW_COMMITS new commits (after filtering)"

# Record the new cursors (current HEAD of each repo)
CABBAGE_HEAD=$(git -C "$REPO_NAME" rev-parse HEAD)
VSCABBAGE_HEAD=$(git rev-parse HEAD)
{
    echo "cabbage=$CABBAGE_HEAD"
    echo "vscabbage=$VSCABBAGE_HEAD"
} > "$CURSOR_FILE"

# Update changelog, dropping any rows already recorded (by commit hash)
echo -e "\nUpdating $CHANGELOG_FILE..."
PYBIN=$(command -v python3 || command -v python)
"$PYBIN" - "$CHANGELOG_FILE" "$TEMP_FILE" <<'PYEOF'
import sys


def row_hash(line):
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) >= 4 and set(cells[3]) != {"-"}:
        return cells[3]
    return None


path, new_path = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    lines = f.readlines()
header, body = lines[:4], lines[4:]
seen = {h for h in (row_hash(l) for l in body if l.startswith("|")) if h}
with open(new_path, encoding="utf-8") as f:
    new_rows = [l for l in f.readlines()
                if l.startswith("|") and row_hash(l) not in seen]
with open(path, "w", encoding="utf-8") as f:
    f.writelines(header + new_rows + body)
print("prepended %d new unique rows" % len(new_rows))
PYEOF

# Clean up
rm -f "$TEMP_FILE" "$TEMP_FILE.commits"
rm -rf "$REPO_NAME"

echo -e "\nChangelog updated with commits sorted by date (newest first)!"
echo "You can view it with: less $CHANGELOG_FILE"

git add CHANGELOG.md .changelog-cursors
