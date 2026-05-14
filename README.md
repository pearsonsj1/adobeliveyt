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
2. Set the same variables in the project **Environment** UI (use the **anon** key, not the service role, for `NEXT_PUBLIC_*` unless you know you need otherwise).
3. Build command: `npm run build`; publish/output per host defaults for Next.js.

`netlify.toml` is included for Netlify.

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
