#!/usr/bin/env bash
# Run in Terminal on your Mac (from any directory, or after: cd /path/to/project)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ORIGIN="https://github.com/pearsonsj1/adobeliveyt.git"

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$ORIGIN"
  echo "Updated remote origin -> $ORIGIN"
else
  git remote add origin "$ORIGIN"
  echo "Added remote origin -> $ORIGIN"
fi

git branch -M main
git push -u origin main
echo "Done. Repo: https://github.com/pearsonsj1/adobeliveyt"
