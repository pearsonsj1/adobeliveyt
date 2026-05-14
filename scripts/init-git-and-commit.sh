#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -d .git ]]; then
  echo "Already a git repository (.git exists). Nothing to do."
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed or not on PATH."
  echo "On macOS, install Xcode Command Line Tools: xcode-select --install"
  exit 1
fi

git init
git checkout -b main 2>/dev/null || git checkout -b master
git add -A
git status
git commit -m "Initial commit: Adobe Live Next.js site" || {
  echo "Commit failed (maybe nothing to commit or user.name not set)."
  echo "Configure: git config user.email \"you@example.com\" && git config user.name \"Your Name\""
  exit 1
}

echo ""
echo "Done. Next:"
echo "  1. Create an empty repo on GitHub"
echo "  2. git remote add origin https://github.com/YOUR_USER/REPO.git"
echo "  3. git push -u origin main   (or: master)"
