#!/bin/bash
#
# Opinionated one-command commits. Picks a category, enforces one format:
#
#     type(scope): one-line message
#
# Multi-line pastes are accepted: the first line becomes the subject, the
# rest becomes the commit body. The changelog only ever uses the subject.
#
# Usage:
#     bash commit.sh [-t type] [-s scope] [-m "message"] [-b "body"] [--push] [--no-push] [--dry-run]
#     bash commit.sh --trigger-build [--no-release] [--push] [--dry-run]
#
# --trigger-build (vscabbage repo only) makes an empty commit on main that
# starts the packaging workflow, which rebuilds cabbage develop fresh. The
# backend SHA is embedded in the subject; --no-release adds a no_build body
# so CI builds the .vsix artifacts without cutting a release.
#
# Anything not passed as a flag is prompted for. Works in any repo.
# Examples:
#     bash commit.sh -t fix -s widgets -m "stop flicker on resize" --push
#     bash commit.sh   # fully interactive

set -u

TYPES="feat fix engine ui opcode build docs chore"

describe() {
    case "$1" in
        feat)    echo "new feature or capability" ;;
        fix)     echo "bug fix" ;;
        engine)  echo "audio engine / backend core" ;;
        ui)      echo "widgets / frontend UI" ;;
        opcode)  echo "Csound opcodes" ;;
        build)   echo "build system / CI" ;;
        docs)    echo "documentation" ;;
        chore)   echo "maintenance and chores" ;;
    esac
}

usage() {
    sed -n '2,18p' "$0"
    echo ""
    echo "Types:"
    local i=1
    for t in $TYPES; do
        printf "  %d) %-8s %s\n" "$i" "$t" "$(describe "$t")"
        i=$((i + 1))
    done
}

TYPE=""; SCOPE=""; MESSAGE=""; BODY=""; BODY_GIVEN=0; PUSH="ask"; DRY_RUN=0
TRIGGER_BUILD=0; NO_RELEASE=0; ALLOW_EMPTY=""

while [ $# -gt 0 ]; do
    case "$1" in
        -t|--type)    TYPE="${2:-}"; shift 2 ;;
        -s|--scope)   SCOPE="${2:-}"; shift 2 ;;
        -m|--message) MESSAGE="${2:-}"; shift 2 ;;
        -b|--body)    BODY="${2:-}"; BODY_GIVEN=1; shift 2 ;;
        -p|--push)    PUSH="yes"; shift ;;
        --no-push)    PUSH="no"; shift ;;
        -n|--dry-run) DRY_RUN=1; shift ;;
        --trigger-build) TRIGGER_BUILD=1; shift ;;
        --no-release) NO_RELEASE=1; shift ;;
        -h|--help)    usage; exit 0 ;;
        *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not inside a git repository."; exit 1; }

if [ "$NO_RELEASE" = "1" ] && [ "$TRIGGER_BUILD" != "1" ]; then
    echo "--no-release only applies with --trigger-build. Aborting."
    exit 1
fi

# Backend-pickup trigger mode: an empty commit on vscabbage main whose only
# purpose is to start the packaging workflow (which always builds cabbage
# develop fresh, so this is how backend-only changes get packaged).
# Hard-aborts on any detected issue; on success it composes SUBJECT/BODY and
# falls through to the shared confirm/commit/push tail below.
if [ "$TRIGGER_BUILD" = "1" ]; then
    [ -n "$TYPE" ] && { echo "--type cannot be combined with --trigger-build. Aborting."; exit 1; }
    [ -n "$SCOPE" ] && { echo "--scope cannot be combined with --trigger-build. Aborting."; exit 1; }
    [ -n "$MESSAGE" ] && { echo "--message cannot be combined with --trigger-build. Aborting."; exit 1; }
    [ "$BODY_GIVEN" = "1" ] && { echo "--body cannot be combined with --trigger-build. Aborting."; exit 1; }

    # The packaging workflow lives in vscabbage; triggering from anywhere
    # else would push a meaningless commit.
    if ! git remote -v | grep -q "rorywalsh/vscabbage"; then
        echo "Not in the vscabbage repository."
        echo "cd to your vscabbage checkout and retry. Aborting."
        exit 1
    fi

    # Only pushes to main start a build; a trigger anywhere else is a no-op.
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$BRANCH" != "main" ]; then
        echo "Trigger mode requires the main branch (only pushes to main build)."
        echo "Currently on '$BRANCH'. Aborting."
        exit 1
    fi

    # Pushing a trigger also pushes any unpushed local commits, and a dirty
    # tree means unrelated work is in flight: refuse to mix the two. Untracked
    # files are excluded here — they are never pushed and the trigger commit is
    # empty, so they can't leak into it.
    if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
        echo "Working tree is not clean. Commit or stash your changes first."
        echo "Aborting (refusing to push a trigger alongside other work)."
        exit 1
    fi

    if ! git rev-parse --verify --quiet origin/main >/dev/null; then
        echo "Cannot resolve origin/main. Run 'git fetch origin' first. Aborting."
        exit 1
    fi
    AHEAD=$(git rev-list --count origin/main..HEAD)
    BEHIND=$(git rev-list --count HEAD..origin/main)
    if [ "$AHEAD" != "0" ]; then
        echo "Local main is $AHEAD commit(s) ahead of origin/main:"
        git log --oneline origin/main..HEAD
        echo "Push those first (or move them aside). Aborting."
        exit 1
    fi
    if [ "$BEHIND" != "0" ]; then
        echo "Local main is $BEHIND commit(s) behind origin/main."
        echo "Pull/rebase first. Aborting."
        exit 1
    fi

    # Record the backend commit this trigger picks up.
    CABBAGE_SHA=$(git ls-remote https://github.com/rorywalsh/cabbage.git refs/heads/develop 2>/dev/null | cut -f1 | tr -d '[:space:]')
    if [ -z "$CABBAGE_SHA" ]; then
        echo "Could not resolve cabbage develop SHA (network?). Aborting."
        exit 1
    fi
    CABBAGE_SHORT=$(echo "$CABBAGE_SHA" | cut -c 1-12)

    # Keep the literal phrase "triggering build": get-commits.sh filters it
    # out of CHANGELOG.md. The no_build marker goes in the body so the
    # subject stays clean; head_commit.message covers the body too.
    SUBJECT="build: triggering build for cabbage develop @ $CABBAGE_SHORT"
    BODY=""
    if [ "$NO_RELEASE" = "1" ]; then
        BODY="no_build"
    fi
    # The tree is guaranteed clean above, so only an empty commit is possible.
    ALLOW_EMPTY="--allow-empty"
fi

# The sections below are skipped in trigger mode (guarded): SUBJECT/BODY are
# already composed above.
if [ "$TRIGGER_BUILD" != "1" ]; then
# Nothing staged? Offer to stage everything (the lazy default).
# Dry runs never touch the index.
if [ "$DRY_RUN" != "1" ] && git diff --cached --quiet; then
    printf "Nothing staged. Stage everything? [Y/n] "
    read -r answer
    answer=${answer%$'\r'}
    if [ -z "$answer" ] || [ "$answer" = "Y" ] || [ "$answer" = "y" ]; then
        git add -A
    fi
    git diff --cached --quiet && { echo "Nothing to commit. Aborting."; exit 1; }
fi
fi # not trigger mode

if [ "$TRIGGER_BUILD" != "1" ]; then
# Category (the forcing function).
valid_type() {
    for t in $TYPES; do
        [ "$1" = "$t" ] && return 0
    done
    return 1
}
if ! valid_type "$TYPE"; then
    if [ -n "$TYPE" ]; then
        echo "Unknown type: $TYPE"
    fi
    echo "Pick a category:"
    i=1
    for t in $TYPES; do
        printf "  %d) %-8s %s\n" "$i" "$t" "$(describe "$t")"
        i=$((i + 1))
    done
    printf "Type [1-8 or name]: "
    read -r TYPE
    TYPE=${TYPE%$'\r'}
    if [[ $TYPE =~ ^[1-8]$ ]]; then
        i=1
        for t in $TYPES; do
            [ "$i" = "$TYPE" ] && { TYPE=$t; break; }
            i=$((i + 1))
        done
    fi
    valid_type "$TYPE" || { echo "Invalid type. Aborting."; exit 1; }
fi

# Scope is optional but encouraged.
if [ -z "$SCOPE" ]; then
    printf "Scope (optional, e.g. widgets, engine, ci) [Enter to skip]: "
    read -r SCOPE
    SCOPE=${SCOPE%$'\r'}
fi
SCOPE=$(echo "$SCOPE" | tr -d ' |:()')

# The one line (first pasted line wins; the rest becomes the body).
if [ -z "$MESSAGE" ]; then
    printf "One-line message: "
    read -r MESSAGE
    MESSAGE=${MESSAGE%$'\r'}
fi
# A -m value containing newlines splits into subject + body.
case "$MESSAGE" in
    *$'\n'*)
        if [ "$BODY_GIVEN" = "0" ]; then
            BODY=$(printf '%s\n' "$MESSAGE" | tail -n +2)
        fi
        MESSAGE=$(printf '%s\n' "$MESSAGE" | head -n 1)
        ;;
esac
MESSAGE=$(echo "$MESSAGE" | sed 's/\r$//;s/^ *//;s/ *$//')
[ -z "$MESSAGE" ] && { echo "Empty message. Aborting."; exit 1; }
case "$MESSAGE" in
    *"|"*) echo "Subject must not contain '|'. Aborting."; exit 1 ;;
esac
if [ "${#MESSAGE}" -gt 72 ]; then
    echo "Note: message is ${#MESSAGE} chars (over 72) — kept as-is."
fi

# Optional body. In a terminal, offer a paste prompt (pipes keep the old
# flow untouched so scripted answers still land on the right prompts).
# COMMIT_PROMPT_BODY=1 forces the prompt (testing / scripting).
if [ "$BODY_GIVEN" = "0" ] && { [ -t 0 ] || [ "${COMMIT_PROMPT_BODY:-0}" = "1" ]; }; then
    printf "Body (optional paste; a short pause or . alone finishes, Enter to skip): "
    read -r firstline
    firstline=${firstline%$'\r'}
    if [ -n "$firstline" ] && [ "$firstline" != "." ]; then
        BODY="$firstline"
        # Pasted lines arrive back-to-back, so an idle timeout ends input
        # instead of hanging forever waiting for '.'. '.' still ends early.
        while IFS= read -t 5 -r line; do
            line=${line%$'\r'}
            [ "$line" = "." ] && break
            BODY="$BODY
$line"
        done
    fi
fi
# Normalise the body: strip carriage returns and leading blank lines.
BODY=$(printf '%s\n' "$BODY" | sed 's/\r$//' | sed '/./,$!d')
[ -z "$(echo "$BODY" | tr -d '[:space:]')" ] && BODY=""

if [ -n "$SCOPE" ]; then
    SUBJECT="$TYPE($SCOPE): $MESSAGE"
else
    SUBJECT="$TYPE: $MESSAGE"
fi
fi # not trigger mode

echo ""
echo "  $SUBJECT"
if [ -n "$BODY" ]; then
    echo ""
    echo "$BODY"
fi
echo ""
if [ "$DRY_RUN" = "1" ]; then
    echo "(dry run — not committed)"
    exit 0
fi
printf "Commit with this message? [Y/n] "
read -r answer
answer=${answer%$'\r'}
if [ -n "$answer" ] && [ "$answer" != "Y" ] && [ "$answer" != "y" ]; then
    echo "Aborted."
    exit 1
fi

if [ -n "$BODY" ]; then
    # shellcheck disable=SC2086: ALLOW_EMPTY is either empty or one flag.
    git commit $ALLOW_EMPTY -m "$SUBJECT" -m "$BODY" || exit 1
else
    # shellcheck disable=SC2086: ALLOW_EMPTY is either empty or one flag.
    git commit $ALLOW_EMPTY -m "$SUBJECT" || exit 1
fi

if [ "$PUSH" = "ask" ]; then
    printf "Push now? [y/N] "
    read -r answer
    answer=${answer%$'\r'}
    [ "$answer" = "y" ] || [ "$answer" = "Y" ] && PUSH="yes" || PUSH="no"
fi
[ "$PUSH" = "yes" ] && git push
