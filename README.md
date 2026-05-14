# Adobe Live Community (`adobeliveyt`)

Next.js site for **Adobe Live** on YouTube: schedules, tools, series, courses, video pages, and Supabase-backed indexing.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-gmt1swpw)

## Prerequisites

- **Node.js** 18.x or 20.x (LTS recommended)
- **npm** (comes with Node)
- **Git** — on macOS, install [Xcode Command Line Tools](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools) (`xcode-select --install`) so `git` works in Terminal

## Quick start

```bash
cd adobeliveyt   # or your local project folder name
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project URL and anon key ([Dashboard → Settings → API](https://supabase.com/dashboard)).

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server (after `build`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | For `/admin` | Server-only. Lets the analytics dashboard **read** `search_queries`, `page_time_spent`, and `youtube_cta_clicks` (RLS otherwise blocks anon reads). Never expose as `NEXT_PUBLIC_*`. |
| `ADOBE_LIVE_CHANNEL_ID` | No | YouTube channel ID (default is set in `lib/youtube.ts`) |

\*The app degrades gracefully in some places without them, but **YouTube proxy, DB index, analytics, and most pages need Supabase** to behave correctly.

## Bolt (Supabase only through Bolt)

If your database is attached via Bolt and you **do not** use [supabase.com](https://supabase.com) directly, put sensitive values in **Bolt**, not in the repo:

1. Open your Bolt project.
2. Click the **database** icon (top center).
3. Open **Secrets** in the left menu.
4. **Create secret** → name: **`YOUTUBE_API_KEY`** → value: your YouTube Data API key (from Google Cloud).

That name must match `supabase/functions/youtube-proxy/index.ts`, which reads `Deno.env.get("YOUTUBE_API_KEY")`. Bolt injects these secrets when your **server / edge functions** run so the key never ships to the browser.

See Bolt’s docs: [Database: Secrets settings](https://support.bolt.new/cloud/database/secrets).

## Deploying (Netlify / Vercel)

1. Connect this repo to your host.
2. Set the same variables in the project **Environment** UI (use the **anon** key, not the service role, for `NEXT_PUBLIC_*` unless you know you need otherwise). Add **`SUPABASE_SERVICE_ROLE_KEY`** (service role) as a **server-only** secret so `/admin` analytics can read event tables.
3. Build command: `npm run build`; publish/output per host defaults for Next.js.

`netlify.toml` is included for Netlify.

## Scheduled full index (recommended)

The Edge Function **`index-all-videos`** walks the channel uploads playlist and refreshes **`video_index`** (library, blog, schedule data, etc.). To keep **YouTube API usage predictable** (about **one full index per day**) while still picking up new uploads within ~24 hours:

1. In GitHub: **Settings → Secrets and variables → Actions** → add:
   - **`SUPABASE_URL`** — same value as `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://xxxx.supabase.co`).
   - **`SUPABASE_SERVICE_ROLE_KEY`** — service role key (Dashboard → Settings → API). Never expose this in the client; it is only used server-side in Actions.
2. The workflow **`.github/workflows/index-all-videos-daily.yml`** runs on a **daily cron** (07:10 UTC by default) and can be run manually via **Actions → Daily index-all-videos → Run workflow**.

If the job fails, open the log: it prints **HTTP status** and the first part of the response body. **Exit code 22** (older runs) meant curl’s **`-f`** flag saw a non-2xx response — typical causes: **`SUPABASE_URL`** typo or trailing junk (must be like `https://xxxx.supabase.co`), **wrong key** (use **`service_role`**, not anon), **`index-all-videos` not deployed** to that project (404), or **`YOUTUBE_API_KEY` missing** in Supabase Edge Function secrets (often **503** in the body). Fix secrets, redeploy the function, then **Re-run workflow**.

**HTTP 404** specifically means the Edge Function URL is wrong or **`index-all-videos` was never deployed** to this project. Deploy from the repo root (requires [Supabase CLI](https://supabase.com/docs/guides/cli) and a linked project):

```bash
supabase login
supabase link --project-ref <your-project-ref>   # Dashboard → Project Settings → General → Reference ID
supabase secrets set YOUTUBE_API_KEY=<your-youtube-data-api-key>   # Dashboard → Edge Functions → Secrets, or CLI
supabase functions deploy index-all-videos
```

Confirm in **Dashboard → Edge Functions** that **`index-all-videos`** appears, then re-run the GitHub Action.

Site-side “stale index” triggers (`/videos`, `getSchedule`) only fire if the index is older than **`INDEX_ALL_VIDEOS_STALE_MS`** (48 hours) in `lib/indexing-config.ts`, so they act as a **backup** if the cron misses a day instead of doubling full indexes after every daily cron.

## First-time Git + GitHub

If this folder is not a git repository yet (e.g. you started from a ZIP):

```bash
./scripts/init-git-and-commit.sh
```

Then on GitHub: **New repository** → create empty repo → add remote and push:

```bash
git remote add origin https://github.com/pearsonsj1/adobeliveyt.git
git branch -M main
git push -u origin main
```

Or run the helper (same result as the three lines above):

```bash
./scripts/connect-and-push.sh
```

Or with GitHub CLI: `gh repo create pearsonsj1/adobeliveyt --private --source=. --push` (after `gh auth login`).

## License

See [LICENSE](./LICENSE) (MIT).
