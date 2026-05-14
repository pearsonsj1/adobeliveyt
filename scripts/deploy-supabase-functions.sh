#!/usr/bin/env bash
# Deploy Edge Functions used by adobelive.com (requires Supabase CLI + `supabase link`).
# https://supabase.com/docs/guides/cli/getting-started
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Install the Supabase CLI, then run this script again:"
  echo "  macOS: brew install supabase/tap/supabase"
  echo "  Other: https://supabase.com/docs/guides/cli/getting-started"
  exit 1
fi

FUNCS=(
  index-all-videos
  index-videos
  youtube-proxy
  fetch-transcript
  index-past-streams
  tag-videos-by-thumbnail
  backfill-playlist-membership
)

echo "Deploying ${#FUNCS[@]} function(s) to the linked Supabase project..."
for name in "${FUNCS[@]}"; do
  echo "---- $name ----"
  supabase functions deploy "$name"
done

echo ""
echo "Done. In Supabase Dashboard → Edge Functions → Secrets, ensure at least:"
echo "  YOUTUBE_API_KEY"
echo "(Bolt: same secret name for Edge Functions.)"
