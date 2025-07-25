#!/bin/bash

REPO_URL="https://github.com/rorywalsh/cabbage3"
REPO_NAME="cabbage3-minimal"
CABBAGE_BRANCH="develop"
VS_CABBAGE_BRANCH="main"
CHANGELOG_FILE="CHANGELOG.md"
TEMP_FILE=$(mktemp)

# Initialize changelog with optimized table format
if [ ! -f "$CHANGELOG_FILE" ]; then
    cat > "$CHANGELOG_FILE" <<EOF
# Cabbage3 (develop) and vscabbage (main) Combined Changelog

| Message                                | Repo      | Date       | Commit                            |
|----------------------------------------|-----------|------------|-----------------------------------|
EOF
fi

echo "Cloning $REPO_URL (branch: $CABBAGE_BRANCH)..."
[ -d "$REPO_NAME" ] && rm -rf "$REPO_NAME"
git clone --branch "$CABBAGE_BRANCH" --depth=100 "$REPO_URL" "$REPO_NAME" >/dev/null 2>&1 || {
    echo "Failed to clone repository"
    exit 1
}

# Function to extract last known commit hash from changelog
get_last_hash() {
    local repo=$1
    # Get the most recent commit hash for this repo from the table
    awk -v repo="$repo" -F '|' '$3 == repo {gsub(/ /, "", $4); print $4; exit}' "$CHANGELOG_FILE" 2>/dev/null
}

# Get last known commits
LAST_CABBAGE=$(get_last_hash "cabbage3")
LAST_VSCABBAGE=$(get_last_hash "vscabbage")

echo "Last known commits:"
echo "  cabbage3 (develop): ${LAST_CABBAGE:-None}"
echo "  vscabbage (main): ${LAST_VSCABBAGE:-None}"

# Function to collect commits with proper date sorting and filtering
collect_commits() {
    local repo_name=$1
    local repo_path=$2
    local last_hash=$3
    local branch=$4
    
    (
        cd "$repo_path" || exit 1
        git checkout "$branch" >/dev/null 2>&1
        git pull origin "$branch" >/dev/null 2>&1
        
        local range="HEAD"
        [ -n "$last_hash" ] && range="$last_hash..HEAD"
        
        # Get commits with Unix timestamp for accurate sorting
        git log "$range" --pretty=format:"%at %H %ad" --date=short --no-merges | while read -r ts hash date; do
            local msg=$(git show -s --format=%s "$hash")
            
            # Skip version bump and changelog update commits
            if [[ "$msg" == *"bump"*"version"* ]] || 
               [[ "$msg" == *"update"*"changelog"* ]] ||
               [[ "$msg" == *"bumping version"* ]] ||
               [[ "$msg" == *"triggering build"* ]] ||
               [[ "$msg" == *"updating changelog"* ]]; then
                continue
            fi
            
            # Output: timestamp|message|repo|date|hash
            printf "%s|%s|%s|%s|%s\n" "$ts" "$msg" "$repo_name" "$date" "$hash"
        done
    )
}

# Collect all new commits with proper timestamp
echo -e "\nCollecting commits from both repositories..."
{
    collect_commits "cabbage3" "$REPO_NAME" "$LAST_CABBAGE" "$CABBAGE_BRANCH"
    collect_commits "vscabbage" "." "$LAST_VSCABBAGE" "$VS_CABBAGE_BRANCH"
} > "$TEMP_FILE.commits"

# Sort by timestamp (newest first) and format as markdown table
sort -t'|' -k1,1nr "$TEMP_FILE.commits" | while IFS='|' read -r ts msg repo date hash; do
    # Clean and format the message (replace pipes, truncate to 60 chars)
    clean_msg=$(echo "$msg" | sed 's/|/-/g' | cut -c 1-60)
    # Format into table columns
    printf "| %-60s | %-9s | %-10s | %-40s |\n" "$clean_msg" "$repo" "$date" "$hash"
done > "$TEMP_FILE"

# Count new commits
NEW_COMMITS=$(grep -c "^|" "$TEMP_FILE" || echo 0)

if [ "$NEW_COMMITS" -eq 0 ]; then
    echo -e "\n✅ No new commits found (after filtering)."
    rm -f "$TEMP_FILE" "$TEMP_FILE.commits"
    rm -rf "$REPO_NAME"
    exit 0
fi

echo -e "\n✨ Found $NEW_COMMITS new commits (after filtering)"

# Update changelog
echo -e "\nUpdating $CHANGELOG_FILE..."
{
    # Keep the header
    head -n 4 "$CHANGELOG_FILE" 2>/dev/null
    
    # Add new commits
    cat "$TEMP_FILE"
    
    # Add old commits (excluding header lines)
    tail -n +4 "$CHANGELOG_FILE" 2>/dev/null | grep "^|" || true
} > "$CHANGELOG_FILE.tmp" && mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"

# Clean up
rm -f "$TEMP_FILE" "$TEMP_FILE.commits"
rm -rf "$REPO_NAME"

echo -e "\nChangelog updated with commits sorted by date (newest first)!"
echo "You can view it with: less $CHANGELOG_FILE"