#!/bin/bash

REPO_URL="https://github.com/rorywalsh/cabbage3"
REPO_NAME="cabbage3-minimal"
CABBAGE_BRANCH="develop"
VS_CABBAGE_BRANCH="main"
CHANGELOG_FILE="changelog.md"
TEMP_FILE=$(mktemp)

# Initialize changelog if it doesn't exist
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "# Cabbage3 (develop) and vscabbage (main) Combined Changelog" > "$CHANGELOG_FILE"
    echo "" >> "$CHANGELOG_FILE"
    echo "| Message | Repo | Date | Commit |" >> "$CHANGELOG_FILE"
    echo "|---------|------|------|--------|" >> "$CHANGELOG_FILE"
fi

echo "Cloning $REPO_URL (branch: $CABBAGE_BRANCH)..."
[ -d "$REPO_NAME" ] && rm -rf "$REPO_NAME"
git clone --branch "$CABBAGE_BRANCH" --depth=100 "$REPO_URL" "$REPO_NAME" >/dev/null 2>&1 || {
    echo "❌ Failed to clone repository"
    exit 1
}

# Function to extract last known commit hash from changelog
get_last_hash() {
    local repo=$1
    # Get the first commit hash for this repo from the table (4th column)
    awk -v repo="$repo" -F '|' '$3 == repo {print $4; exit}' "$CHANGELOG_FILE" 2>/dev/null | tr -d ' '
}

# Get last known commits
LAST_CABBAGE=$(get_last_hash "cabbage3")
LAST_VSCABBAGE=$(get_last_hash "vscabbage")

echo "Last known commits:"
echo "  cabbage3 (develop): ${LAST_CABBAGE:-None}"
echo "  vscabbage (main): ${LAST_VSCABBAGE:-None}"

# Function to collect commits with their dates
collect_commits() {
    local repo_name=$1
    local repo_path=$2
    local last_hash=$3
    local branch=$4
    
    (
        cd "$repo_path" || exit 1
        # Ensure we're on the correct branch
        git checkout "$branch" >/dev/null 2>&1
        git pull origin "$branch" >/dev/null 2>&1
        
        local range="HEAD"
        [ -n "$last_hash" ] && range="$last_hash..HEAD"
        
        git log "$range" --pretty=format:"%ad %H" --date=short --no-merges | while read -r date hash; do
            local msg=$(git show -s --format=%s "$hash")
            # Output fields in correct order: msg repo date hash
            printf "%s\t%s\t%s\t%s\n" "$msg" "$repo_name" "$date" "$hash"
        done
    )
}

# Collect all new commits with dates for sorting
echo -e "\nCollecting commits from both repositories..."
{
    collect_commits "cabbage3" "$REPO_NAME" "$LAST_CABBAGE" "$CABBAGE_BRANCH"
    collect_commits "vscabbage" "." "$LAST_VSCABBAGE" "$VS_CABBAGE_BRANCH"
} > "$TEMP_FILE.commits"

# Sort all commits by date (newest first) and format as markdown table rows
sort -r -k3 "$TEMP_FILE.commits" | while IFS=$'\t' read -r msg repo date hash; do
    # Clean the message (replace pipes with dashes and truncate to 100 chars)
    clean_msg=$(echo "$msg" | sed 's/|/-/g' | cut -c 1-100)
    # Format into table columns
    printf "| %-100s | %-9s | %-10s | %-40s |\n" "$clean_msg" "$repo" "$date" "$hash"
done > "$TEMP_FILE"

# Count new commits
NEW_COMMITS=$(grep -c "^|" "$TEMP_FILE" || echo 0)

if [ "$NEW_COMMITS" -eq 0 ]; then
    echo -e "\n✅ No new commits found."
    rm -f "$TEMP_FILE" "$TEMP_FILE.commits"
    rm -rf "$REPO_NAME"
    exit 0
fi

echo -e "\n✨ Found $NEW_COMMITS new commits"

# Update changelog
echo -e "\nUpdating $CHANGELOG_FILE..."
{
    # Keep the header
    head -n 4 "$CHANGELOG_FILE" 2>/dev/null || {
        echo "#Combined Change Log for Cabbage and vscabbage"
        echo ""
        echo "| Message | Repo | Date | Commit |"
        echo "|---------|------|------|--------|"
    }
    
    # Add new commits
    cat "$TEMP_FILE"
    
    # Add old commits (excluding header lines)
    tail -n +5 "$CHANGELOG_FILE" 2>/dev/null | grep "^|" || true
} > "$CHANGELOG_FILE.tmp" && mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"

# Clean up
rm -f "$TEMP_FILE" "$TEMP_FILE.commits"
rm -rf "$REPO_NAME"

echo -e "\n✅ Changelog updated successfully!"
echo "You can view it with: less $CHANGELOG_FILE"