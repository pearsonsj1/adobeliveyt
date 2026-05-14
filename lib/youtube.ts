export interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  scheduledTime: string | null;
  viewerCount: number | null;
  isLive: boolean;
  videoUrl: string;
  host: string | null;
  description: string;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
  videoUrl: string;
  description: string;
  tags: string[];
}

export interface ToolPlaylist {
  tool: string;
  playlistId: string;
  playlistUrl: string;
  videoCount: number;
  thumbnail: string;
  description?: string;
}

export interface PlaylistVideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
  position: number;
  description: string;
}

export interface RecurringSeries {
  id: string;
  title: string;
  description: string;
  playlistId: string;
  playlistUrl: string;
  videoCount: number;
  thumbnail: string;
  cadence: string;
}

export interface CoursePlaylist {
  id: string;
  title: string;
  instructor: string;
  playlistId: string;
  playlistUrl: string;
  videoCount: number;
  thumbnail: string;
  tool: string;
  tags: string[];
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  videoUrl: string;
  tools: string[];
  host: string | null;
  thumbnail: string;
  isLive?: boolean;
  viewerCount?: number | null;
}

// ---------------------------------------------------------------------------
// Edge function proxy URL + Supabase cache
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const PROXY = `${SUPABASE_URL}/functions/v1/youtube-proxy`;
const CHANNEL_ID = process.env.ADOBE_LIVE_CHANNEL_ID ?? "UCVMJPRXrBIOFDBZEaF-_pEA";

// Live status refreshes once per hour; video content every 24 h; everything else every 48 h.
// Stale data is always served rather than discarding it on quota exhaustion.
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;
const VIDEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_CACHE_TTL_MS = 60 * 60 * 1000;

// YouTube quota resets at midnight Pacific. We mark quota exhaustion in the DB
// and clear it after 24 hours so the next day's quota gets used automatically.
const QUOTA_KEY = "quota_state";
const QUOTA_RESET_MS = 24 * 60 * 60 * 1000;

type QuotaState = { exhausted: boolean; since: string };

function dbHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "apikey": SUPABASE_ANON_KEY,
  };
}

async function readQuotaState(): Promise<QuotaState | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/youtube_cache?key=eq.${QUOTA_KEY}&select=data,cached_at`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const rows = await res.json() as { data: QuotaState; cached_at: string }[];
    if (!rows.length) return null;
    const age = Date.now() - new Date(rows[0].cached_at).getTime();
    if (age > QUOTA_RESET_MS) {
      // Past 24 h — clear exhaustion flag
      await writeQuotaState(false);
      return { exhausted: false, since: new Date().toISOString() };
    }
    return rows[0].data;
  } catch {
    return null;
  }
}

async function writeQuotaState(exhausted: boolean): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/youtube_cache`, {
      method: "POST",
      headers: { ...dbHeaders(), "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({
        key: QUOTA_KEY,
        data: { exhausted, since: new Date().toISOString() } satisfies QuotaState,
        cached_at: new Date().toISOString(),
        stale_ok: false,
      }),
      cache: "no-store",
    });
  } catch { /* best-effort */ }
}

// Returns true if the YouTube API quota is currently exhausted.
// Reads from the DB — never makes a live API call.
export async function checkQuotaExhausted(): Promise<boolean> {
  const state = await readQuotaState();
  return state?.exhausted === true;
}

// Returns the count of public (non-upcoming) videos in the index.
// Reads from DB only — no YouTube API quota cost.
export async function getVideoCount(): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return 0;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/video_index?select=id&stream_status=neq.upcoming&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
        },
        next: { revalidate: 86400 }, // recompute at most once per day
      }
    );
    const countHeader = res.headers.get("content-range");
    // content-range: 0-0/350
    const total = countHeader ? parseInt(countHeader.split("/")[1] ?? "0", 10) : 0;
    return isNaN(total) ? 0 : total;
  } catch {
    return 0;
  }
}

function mapIndexRows(rows: { id: string; title: string; thumbnail_url: string; video_url: string; published_at: string; duration: string; tags: string[] }[]): VideoItem[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    thumbnail: r.thumbnail_url,
    duration: r.duration ?? "",
    publishedAt: r.published_at,
    viewCount: 0,
    videoUrl: r.video_url,
    description: "",
    tags: r.tags ?? [],
  }));
}

// Fallback for recent videos: 6 most recently published non-stream videos from the index.
export async function getRecentVideosFromIndex(): Promise<VideoItem[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/video_index?select=id,title,thumbnail_url,video_url,published_at,duration,tags&is_live_stream=eq.false&or=(stream_status.is.null,stream_status.neq.upcoming)&order=published_at.desc&limit=24`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!res.ok) return [];
    return mapIndexRows(await res.json()).filter((v) => !isShortFormatVideo(v)).slice(0, 6);
  } catch {
    return [];
  }
}

// Fallback for popular videos: 10 most recently published non-stream videos from the past 90 days.
// The index has no view_count column, so recency within a 3-month window is the best approximation
// of what the live "popular" API query returns (most-viewed in last 3 months).
export async function getPopularVideosFromIndex(): Promise<VideoItem[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/video_index?select=id,title,thumbnail_url,video_url,published_at,duration,tags&is_live_stream=eq.false&or=(stream_status.is.null,stream_status.neq.upcoming)&published_at=gte.${encodeURIComponent(since)}&order=published_at.desc&limit=30`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = await res.json();
    const take = (raw: typeof rows) => mapIndexRows(raw).filter((v) => !isShortFormatVideo(v)).slice(0, 10);
    if (rows.length < 5) {
      const fallback = await fetch(
        `${SUPABASE_URL}/rest/v1/video_index?select=id,title,thumbnail_url,video_url,published_at,duration,tags&is_live_stream=eq.false&or=(stream_status.is.null,stream_status.neq.upcoming)&order=published_at.desc&limit=40`,
        { headers: dbHeaders(), cache: "no-store" },
      );
      if (fallback.ok) return take(await fallback.json());
    }
    return take(rows);
  } catch {
    return [];
  }
}

async function proxyFetch(endpoint: string, extra?: Record<string, string>): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const params = new URLSearchParams({ endpoint, ...extra });
  const res = await fetch(`${PROXY}?${params}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 403) {
    // Mark quota exhaustion in the DB so subsequent requests skip live calls
    await writeQuotaState(true);
    return null;
  }
  if (!res.ok) return null;
  const json = await res.json();
  if (json?.error?.errors?.[0]?.reason === "quotaExceeded") {
    await writeQuotaState(true);
    return null;
  }
  if (json?.error) return null;
  // Successful call — clear any stale exhaustion flag
  if (json?.items !== undefined) writeQuotaState(false).catch(() => {});
  return json;
}

// Server-side only — uses service role key to read/write the youtube_cache table.
// When a fresh fetch returns a falsy/empty result (quota hit or network error),
// stale cached data is served rather than discarding it.
// Pass emptyIsValid=true for data where an empty array is a legitimate live result
// (e.g. live streams) so stale data doesn't linger after the event ends.
async function withCache<T>(key: string, fn: () => Promise<T>, ttlMs = CACHE_TTL_MS, emptyIsValid = false): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return fn();

  const headers = dbHeaders();
  let staleData: T | undefined;

  try {
    const readRes = await fetch(
      `${SUPABASE_URL}/rest/v1/youtube_cache?key=eq.${encodeURIComponent(key)}&select=data,cached_at`,
      { headers, cache: "no-store" },
    );
    if (readRes.ok) {
      const rows = await readRes.json() as { data: T; cached_at: string }[];
      if (rows.length > 0) {
        staleData = rows[0].data;
        const age = Date.now() - new Date(rows[0].cached_at).getTime();
        if (age < ttlMs) return staleData;
      }
    }
  } catch { /* fall through to fetch */ }

  let fresh: T;
  try {
    fresh = await fn();
  } catch (_e) {
    if (staleData !== undefined) return staleData;
    throw _e;
  }

  // For live data (emptyIsValid=true), an empty array means nothing is live — trust it.
  // For everything else, an empty result likely means a quota hit, so serve stale.
  const isEmpty = fresh === null || fresh === undefined ||
    (Array.isArray(fresh) && fresh.length === 0);
  if (isEmpty && staleData !== undefined && !emptyIsValid) return staleData;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/youtube_cache`, {
      method: "POST",
      headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ key, data: fresh, cached_at: new Date().toISOString(), stale_ok: true }),
      cache: "no-store",
    });
  } catch { /* best-effort */ }

  return fresh;
}

// ---------------------------------------------------------------------------
// YouTube response types (minimal)
// ---------------------------------------------------------------------------

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
    publishedAt: string;
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

interface YTVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
    publishedAt: string;
    tags?: string[];
  };
  statistics?: { viewCount?: string; likeCount?: string };
  contentDetails?: { duration?: string };
  status?: { privacyStatus?: string };
  liveStreamingDetails?: {
    scheduledStartTime?: string;
    actualStartTime?: string;
    concurrentViewers?: string;
  };
}

interface YTPlaylistItem {
  id: string;
  snippet: {
    title: string;
    thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
  };
  contentDetails: { itemCount: number };
}

interface YTSearchResponse { items?: YTSearchItem[] }
interface YTVideoResponse { items?: YTVideoItem[] }
interface YTPlaylistResponse { items?: YTPlaylistItem[] }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bestThumb(thumbs: YTSearchItem["snippet"]["thumbnails"]): string {
  return thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? "";
}

function videoUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;/g, "'");
}

// ISO 8601 duration → "H:MM:SS" / "M:SS"
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** Total seconds from ISO 8601 duration (YouTube contentDetails.duration). */
function isoDurationTotalSeconds(iso: string): number | null {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const s = parseInt(match[3] ?? "0", 10);
  return h * 3600 + m * 60 + s;
}

/** True for ≤60s wall time (Shorts) from ISO duration. */
function isShortLikeIso(iso: string): boolean {
  if (!iso || iso === "P0D") return false;
  const t = isoDurationTotalSeconds(iso);
  return t !== null && t > 0 && t <= 60;
}

/** True for Shorts URLs or display durations ≤60s (index / API fallbacks). */
export function isShortFormatVideo(v: Pick<VideoItem, "duration" | "videoUrl">): boolean {
  if (v.videoUrl.includes("/shorts/")) return true;
  const parts = v.duration.split(":").map((x) => parseInt(x, 10));
  if (!v.duration || parts.length === 0 || parts.some((n) => Number.isNaN(n))) return false;
  let sec = 0;
  if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
  else sec = parts[0];
  return sec > 0 && sec <= 60;
}

// Known recurring series — detected by title pattern before tool inference.
// These are tagged as series names rather than guessing a tool from limited context.
const SERIES_PATTERNS: [string, RegExp][] = [
  ["File New",            /file new/i],
  ["Office Hours",        /office hours/i],
  ["On the Spot",         /on the spot/i],
  ["Feature Friday",      /feature friday/i],
  ["Cinema Collective",   /cinema collective/i],
  ["Studio Sessions",     /studio sessions/i],
  ["The Unlock",          /\bthe unlock\b/i],
  ["Brand Slam",          /brand slam/i],
  ["The Wrap-Up",         /wrap[\s-]?up/i],
  ["Education Edition",   /education edition/i],
];

// Adobe tool keywords — only used when no series is detected
const TOOL_KEYWORDS: [string, string][] = [
  ["Photoshop", "photoshop"],
  ["Illustrator", "illustrator"],
  ["After Effects", "after effects"],
  ["Premiere", "premiere"],
  ["Lightroom", "lightroom"],
  ["Firefly", "firefly"],
  ["Express", "adobe express"],
  ["InDesign", "indesign"],
  ["Fresco", "fresco"],
  ["Dimension", "dimension"],
  ["Substance", "substance"],
  ["Acrobat", "acrobat"],
];

// Returns series name if recognized, else tool names found in the title, else empty array.
// Tool matching is intentionally title-only: descriptions contain boilerplate links
// (e.g. "Try Adobe Express NOW") that would produce false positives on every video.
// Series patterns still check full text since series names appear in both.
function inferTools(title: string, description = ""): string[] {
  const fullText = `${title} ${description}`;
  // 1. Check for known series first — more reliable than keyword matching
  for (const [series, pattern] of SERIES_PATTERNS) {
    if (pattern.test(fullText)) return [series];
  }
  // 2. Tool keywords matched against title only to avoid boilerplate false positives
  const lowerTitle = title.toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const [tool, kw] of TOOL_KEYWORDS) {
    if (!seen.has(tool) && lowerTitle.includes(kw)) {
      seen.add(tool);
      result.push(tool);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Mock fallback data (used when API key is not set)
// ---------------------------------------------------------------------------

// These use real video IDs from the @AdobeLiveCommunity channel as verified fallbacks
const MOCK_LIVE: LiveStream[] = [
  {
    id: "GcMyg5Zzdfg",
    title: "The File New Show — Weekly Livestream",
    thumbnail: "https://i.ytimg.com/vi/GcMyg5Zzdfg/hqdefault.jpg",
    scheduledTime: null,
    viewerCount: null,
    isLive: false,
    videoUrl: "https://www.youtube.com/watch?v=GcMyg5Zzdfg",
    host: "Adobe Live Community",
    description: "Weekly news, trends, and conversations for designers and creators.",
  },
];

const MOCK_UPCOMING: LiveStream[] = [
  {
    id: "A_Zvrp0DurE",
    title: "Office Hours — Live Q&A with Adobe",
    thumbnail: "https://i.ytimg.com/vi/A_Zvrp0DurE/hqdefault.jpg",
    scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    viewerCount: null,
    isLive: false,
    videoUrl: "https://www.youtube.com/watch?v=A_Zvrp0DurE",
    host: "Adobe Live Community",
    description: "Live Q&A and open creative sessions with Adobe experts.",
  },
  {
    id: "LR52uemd_H8",
    title: "Adobe Live: Studio Session",
    thumbnail: "https://i.ytimg.com/vi/LR52uemd_H8/hqdefault.jpg",
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    viewerCount: null,
    isLive: false,
    videoUrl: "https://www.youtube.com/watch?v=LR52uemd_H8",
    host: "Adobe Live Community",
    description: "In-depth creative process streams — watch designers work in real time.",
  },
  {
    id: "I-rtmS9Xxa0",
    title: "Feature Fridays — New Adobe Tools",
    thumbnail: "https://i.ytimg.com/vi/I-rtmS9Xxa0/hqdefault.jpg",
    scheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    viewerCount: null,
    isLive: false,
    videoUrl: "https://www.youtube.com/watch?v=I-rtmS9Xxa0",
    host: "Adobe Live Community",
    description: "A focused look at one new or notable Adobe feature, explained fast.",
  },
];

const MOCK_RECENT_VIDEOS: VideoItem[] = [
  { id: "GcMyg5Zzdfg", title: "The File New Show — Episode Highlight", thumbnail: "https://i.ytimg.com/vi/GcMyg5Zzdfg/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=GcMyg5Zzdfg", description: "", tags: [] },
  { id: "A_Zvrp0DurE", title: "Office Hours — Live Q&A Session", thumbnail: "https://i.ytimg.com/vi/A_Zvrp0DurE/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=A_Zvrp0DurE", description: "", tags: [] },
  { id: "LR52uemd_H8", title: "Adobe Live Studio Session", thumbnail: "https://i.ytimg.com/vi/LR52uemd_H8/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=LR52uemd_H8", description: "", tags: [] },
  { id: "35jRC_Yh1FE", title: "On the Spot with Magdiel Lopez", thumbnail: "https://i.ytimg.com/vi/35jRC_Yh1FE/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=35jRC_Yh1FE", description: "", tags: ["Illustrator"] },
  { id: "uAWRoCSG7Yg", title: "The Cinema Collective — Creative Process", thumbnail: "https://i.ytimg.com/vi/uAWRoCSG7Yg/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 9 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=uAWRoCSG7Yg", description: "", tags: [] },
  { id: "jQsB1P6l_gM", title: "Education Edition — Classroom Session", thumbnail: "https://i.ytimg.com/vi/jQsB1P6l_gM/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 11 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=jQsB1P6l_gM", description: "", tags: [] },
];

const MOCK_POPULAR_VIDEOS: VideoItem[] = [
  { id: "tgqIuySQUDU", title: "Branding Design & Logo Creation", thumbnail: "https://i.ytimg.com/vi/tgqIuySQUDU/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 30 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=tgqIuySQUDU", description: "", tags: ["Illustrator"] },
  { id: "aGu5NbQUXqQ", title: "Brand Building & Identity Design", thumbnail: "https://i.ytimg.com/vi/aGu5NbQUXqQ/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 60 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=aGu5NbQUXqQ", description: "", tags: ["Illustrator"] },
  { id: "YegPJJm8o-I", title: "Hand Lettering & Small Business Branding", thumbnail: "https://i.ytimg.com/vi/YegPJJm8o-I/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 45 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=YegPJJm8o-I", description: "", tags: ["Illustrator"] },
  { id: "KYigRBUyzxQ", title: "Digital Fashion & 3D Garment Texturing", thumbnail: "https://i.ytimg.com/vi/KYigRBUyzxQ/hqdefault.jpg", duration: "", publishedAt: new Date(Date.now() - 50 * 86400000).toISOString(), viewCount: 0, videoUrl: "https://www.youtube.com/watch?v=KYigRBUyzxQ", description: "", tags: ["Substance 3D"] },
];

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: "GcMyg5Zzdfg", title: "The File New Show", description: "Weekly news, trends, and conversations for designers and creators.", scheduledTime: new Date(Date.now() + 1 * 3600000).toISOString(), videoUrl: "https://www.youtube.com/watch?v=GcMyg5Zzdfg", tools: [], host: "Adobe Live Community", thumbnail: "https://i.ytimg.com/vi/GcMyg5Zzdfg/hqdefault.jpg" },
  { id: "A_Zvrp0DurE", title: "Office Hours", description: "Live creative discussion with Andrew Hochradel and Nick Longo — graphic design, branding, and open Q&A.", scheduledTime: new Date(Date.now() + 3 * 3600000).toISOString(), videoUrl: "https://www.youtube.com/watch?v=A_Zvrp0DurE", tools: [], host: "Adobe Live Community", thumbnail: "https://i.ytimg.com/vi/A_Zvrp0DurE/hqdefault.jpg" },
  { id: "LR52uemd_H8", title: "Studio Session", description: "Monthly interview series spotlighting artists, designers, and creative leaders sharing their stories.", scheduledTime: new Date(Date.now() + 26 * 3600000).toISOString(), videoUrl: "https://www.youtube.com/watch?v=LR52uemd_H8", tools: [], host: "Adobe Live Community", thumbnail: "https://i.ytimg.com/vi/LR52uemd_H8/hqdefault.jpg" },
  { id: "35jRC_Yh1FE", title: "On the Spot with Magdiel Lopez", description: "Live graphic design challenge series — Magdiel Lopez creates bold visual concepts in real time from audience suggestions.", scheduledTime: new Date(Date.now() + 28 * 3600000).toISOString(), videoUrl: "https://www.youtube.com/watch?v=35jRC_Yh1FE", tools: ["Illustrator"], host: "Adobe Live Community", thumbnail: "https://i.ytimg.com/vi/35jRC_Yh1FE/hqdefault.jpg" },
  { id: "I-rtmS9Xxa0", title: "Feature Fridays", description: "Deep dives into specific Adobe features and tools with expert guests.", scheduledTime: new Date(Date.now() + 48 * 3600000).toISOString(), videoUrl: "https://www.youtube.com/watch?v=I-rtmS9Xxa0", tools: [], host: "Adobe Live Community", thumbnail: "https://i.ytimg.com/vi/I-rtmS9Xxa0/hqdefault.jpg" },
  { id: "uAWRoCSG7Yg", title: "The Cinema Collective", description: "Filmmakers, editors, and post-production professionals covering the craft and industry of cinema.", scheduledTime: new Date(Date.now() + 50 * 3600000).toISOString(), videoUrl: "https://www.youtube.com/watch?v=uAWRoCSG7Yg", tools: [], host: "Adobe Live Community", thumbnail: "https://i.ytimg.com/vi/uAWRoCSG7Yg/hqdefault.jpg" },
];

const MOCK_TOOL_PLAYLISTS: ToolPlaylist[] = [
  { tool: "Photoshop",     playlistId: "PLMMOwZoEbhuwaTuOc60tRTsokYGTdEG39", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwaTuOc60tRTsokYGTdEG39", videoCount: 142, thumbnail: "https://i.ytimg.com/vi/GcMyg5Zzdfg/hqdefault.jpg" },
  { tool: "Illustrator",   playlistId: "PLMMOwZoEbhuz4RamFC4qMOUXpHWZgyS3E", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuz4RamFC4qMOUXpHWZgyS3E", videoCount: 98,  thumbnail: "https://i.ytimg.com/vi/35jRC_Yh1FE/hqdefault.jpg" },
  { tool: "After Effects", playlistId: "PLMMOwZoEbhuyX2RL5LE8pThYxcwHjF8Mv", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuyX2RL5LE8pThYxcwHjF8Mv", videoCount: 87,  thumbnail: "https://i.ytimg.com/vi/LR52uemd_H8/hqdefault.jpg" },
  { tool: "Premiere",  playlistId: "PLMMOwZoEbhuw4NszLQhE9uX_IdD5rpWA0", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuw4NszLQhE9uX_IdD5rpWA0", videoCount: 76,  thumbnail: "https://i.ytimg.com/vi/uAWRoCSG7Yg/hqdefault.jpg" },
  { tool: "Lightroom",     playlistId: "PLMMOwZoEbhuwMImBhitwZ6PhRQak0615K", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwMImBhitwZ6PhRQak0615K", videoCount: 64,  thumbnail: "https://i.ytimg.com/vi/jQsB1P6l_gM/hqdefault.jpg" },
  { tool: "Firefly",       playlistId: "PLMMOwZoEbhuxPY2JftdLPXxIIcO7QRBu_", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxPY2JftdLPXxIIcO7QRBu_", videoCount: 43,  thumbnail: "https://i.ytimg.com/vi/I-rtmS9Xxa0/hqdefault.jpg" },
  { tool: "Express",       playlistId: "PLMMOwZoEbhuwZ1J8GmHW19P8pylsT7Z2_", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwZ1J8GmHW19P8pylsT7Z2_", videoCount: 38,  thumbnail: "https://i.ytimg.com/vi/A_Zvrp0DurE/hqdefault.jpg" },
  { tool: "InDesign",      playlistId: "PLMMOwZoEbhuzC6Mqvwovl8Y8ZeF6mXWtk", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuzC6Mqvwovl8Y8ZeF6mXWtk", videoCount: 55,  thumbnail: "https://i.ytimg.com/vi/YegPJJm8o-I/hqdefault.jpg" },
  { tool: "Fresco",        playlistId: "PLMMOwZoEbhuwBffb0yYDkImol577KtqWI", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwBffb0yYDkImol577KtqWI", videoCount: 24,  thumbnail: "https://i.ytimg.com/vi/KYigRBUyzxQ/hqdefault.jpg" },
  { tool: "Substance 3D",  playlistId: "PLMMOwZoEbhuwXLF-GsAbSTcDwbJBsa_WZ", playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwXLF-GsAbSTcDwbJBsa_WZ", videoCount: 31,  thumbnail: "https://i.ytimg.com/vi/KYigRBUyzxQ/hqdefault.jpg" },
];

// ---------------------------------------------------------------------------
// Fetch video details (duration, stats) for a list of IDs
// ---------------------------------------------------------------------------

async function fetchVideoDetails(ids: string[]): Promise<Map<string, YTVideoItem>> {
  if (!ids.length) return new Map();
  const data = await proxyFetch("videos_stats", { ids: ids.join(",") }) as YTVideoResponse | null;
  const map = new Map<string, YTVideoItem>();
  if (data?.items) {
    for (const item of data.items) map.set(item.id, item);
  }
  return map;
}

async function fetchLiveDetails(ids: string[]): Promise<Map<string, YTVideoItem>> {
  if (!ids.length) return new Map();
  const data = await proxyFetch("live_stats", { ids: ids.join(",") }) as YTVideoResponse | null;
  const map = new Map<string, YTVideoItem>();
  if (data?.items) {
    for (const item of data.items) map.set(item.id, item);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public API — live streams (shared fetch + Supabase youtube_cache key live_now)
// ---------------------------------------------------------------------------

/** YouTube search + live details; no cache read/write — used by getLiveNow / refreshLiveNowCache. */
async function fetchLiveStreamsFromApi(): Promise<LiveStream[]> {
  try {
    const search = await proxyFetch("live") as YTSearchResponse | null;
    if (!search?.items?.length) return [];

    const ids = search.items.map((i) => i.id.videoId);
    const details = await fetchLiveDetails(ids);

    return search.items.map((item): LiveStream => {
      const vid = details.get(item.id.videoId);
      const viewers = vid?.liveStreamingDetails?.concurrentViewers
        ? parseInt(vid.liveStreamingDetails.concurrentViewers)
        : null;
      return {
        id: item.id.videoId,
        title: decodeHtmlEntities(item.snippet.title),
        thumbnail: bestThumb(item.snippet.thumbnails),
        scheduledTime: null,
        viewerCount: viewers,
        isLive: true,
        videoUrl: videoUrl(item.id.videoId),
        host: item.snippet.channelTitle,
        description: decodeHtmlEntities(item.snippet.description),
      };
    });
  } catch {
    return [];
  }
}

async function writeYoutubeCacheData(key: string, data: unknown): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/youtube_cache`, {
      method: "POST",
      headers: { ...dbHeaders(), "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ key, data, cached_at: new Date().toISOString(), stale_ok: true }),
      cache: "no-store",
    });
  } catch { /* best-effort */ }
}

/** Force a live check and refresh `live_now` in Supabase (for hour-aligned client polling). */
export async function refreshLiveNowCache(): Promise<LiveStream[]> {
  const fresh = await fetchLiveStreamsFromApi();
  await writeYoutubeCacheData("live_now", fresh);
  return fresh;
}

export async function getLiveNow(): Promise<LiveStream[]> {
  return withCache("live_now", fetchLiveStreamsFromApi, LIVE_CACHE_TTL_MS, true);
}

async function getUpcomingStreamsFromIndex(): Promise<LiveStream[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const now = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/video_index?select=id,title,description,thumbnail_url,video_url,scheduled_time&stream_status=eq.upcoming&scheduled_time=gte.${encodeURIComponent(now)}&order=scheduled_time.asc&limit=10`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = await res.json() as { id: string; title: string; description: string; thumbnail_url: string; video_url: string; scheduled_time: string }[];
    return rows.map((r): LiveStream => ({
      id: r.id,
      title: r.title,
      thumbnail: r.thumbnail_url,
      scheduledTime: r.scheduled_time,
      viewerCount: null,
      isLive: false,
      videoUrl: r.video_url,
      host: "Adobe Live",
      description: r.description ?? "",
    }));
  } catch {
    return [];
  }
}

// Always reads from the DB — no cache, no API quota, always complete and correctly ordered.
// If the DB has nothing, fires a background re-index so data populates on next load.
export async function getUpcomingStreams(): Promise<LiveStream[]> {
  const streams = await getUpcomingStreamsFromIndex();
  if (streams.length === 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
    fetch(`${SUPABASE_URL}/functions/v1/index-all-videos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      cache: "no-store",
    }).catch(() => {});
  }
  return streams;
}

export async function getRecentVideos(): Promise<VideoItem[]> {
  return withCache("recent_videos", async () => {
    try {
      const search = await proxyFetch("recent") as YTSearchResponse | null;
      if (!search?.items?.length) return [];

      const ids = search.items.map((i) => i.id.videoId);
      const details = await fetchVideoDetails(ids);

      return search.items
        .filter((item) => {
          if (item.snippet.liveBroadcastContent !== "none") return false;
          const vid = details.get(item.id.videoId);
          if (!vid || vid.status?.privacyStatus !== "public") return false;
          const dur = vid.contentDetails?.duration ?? "";
          if (dur === "P0D") return false;
          if (isShortLikeIso(dur)) return false;
          return true;
        })
        .slice(0, 6)
        .map((item): VideoItem => {
          const vid = details.get(item.id.videoId)!;
          const tags = inferTools(item.snippet.title, item.snippet.description);
          return {
            id: item.id.videoId,
            title: decodeHtmlEntities(item.snippet.title),
            thumbnail: bestThumb(item.snippet.thumbnails),
            duration: vid.contentDetails?.duration ? parseDuration(vid.contentDetails.duration) : "",
            publishedAt: item.snippet.publishedAt,
            viewCount: parseInt(vid.statistics?.viewCount ?? "0"),
            videoUrl: videoUrl(item.id.videoId),
            description: decodeHtmlEntities(item.snippet.description),
            tags,
          };
        });
    } catch {
      return [];
    }
  }, VIDEO_CACHE_TTL_MS);
}

export async function getShorts(): Promise<VideoItem[]> {
  return withCache("shorts", async () => {
    try {
      const search = await proxyFetch("shorts") as YTSearchResponse | null;
      if (!search?.items?.length) return [];

      const ids = search.items.map((i) => i.id.videoId);
      const details = await fetchVideoDetails(ids);

      return search.items
        .filter((item) => {
          if (item.snippet.liveBroadcastContent !== "none") return false;
          const vid = details.get(item.id.videoId);
          if (!vid || vid.status?.privacyStatus !== "public") return false;
          const dur = vid.contentDetails?.duration ?? "";
          if (dur === "P0D") return false;
          // Keep only videos ≤60 seconds
          const match = dur.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
          if (!match) return false;
          const mins = parseInt(match[1] ?? "0");
          const secs = parseInt(match[2] ?? "0");
          return mins === 0 && secs <= 60;
        })
        .map((item): VideoItem => {
          const vid = details.get(item.id.videoId)!;
          return {
            id: item.id.videoId,
            title: decodeHtmlEntities(item.snippet.title),
            thumbnail: bestThumb(item.snippet.thumbnails),
            duration: vid.contentDetails?.duration ? parseDuration(vid.contentDetails.duration) : "",
            publishedAt: item.snippet.publishedAt,
            viewCount: parseInt(vid.statistics?.viewCount ?? "0"),
            videoUrl: `https://www.youtube.com/shorts/${item.id.videoId}`,
            description: decodeHtmlEntities(item.snippet.description),
            tags: inferTools(item.snippet.title, item.snippet.description),
          };
        });
    } catch {
      return [];
    }
  }, VIDEO_CACHE_TTL_MS);
}

export const MOBILE_TEMPLATES_PLAYLIST_ID = "PLMMOwZoEbhuxurfqKv-ZEt95uOU63laIE";

export async function getPopularVideos(): Promise<VideoItem[]> {
  return withCache("popular_videos", async () => {
    try {
      const search = await proxyFetch("popular") as YTSearchResponse | null;
      if (!search?.items?.length) return [];

      const ids = search.items.map((i) => i.id.videoId);
      const details = await fetchVideoDetails(ids);

      return search.items
        .filter((item) => {
          if (item.snippet.liveBroadcastContent !== "none") return false;
          const vid = details.get(item.id.videoId);
          if (!vid || vid.status?.privacyStatus !== "public") return false;
          const dur = vid.contentDetails?.duration ?? "";
          if (dur === "P0D") return false;
          if (isShortLikeIso(dur)) return false;
          return true;
        })
        .slice(0, 10)
        .map((item): VideoItem => {
          const vid = details.get(item.id.videoId)!;
          const tags = inferTools(item.snippet.title, item.snippet.description);
          return {
            id: item.id.videoId,
            title: decodeHtmlEntities(item.snippet.title),
            thumbnail: bestThumb(item.snippet.thumbnails),
            duration: vid.contentDetails?.duration ? parseDuration(vid.contentDetails.duration) : "",
            publishedAt: item.snippet.publishedAt,
            viewCount: parseInt(vid.statistics?.viewCount ?? "0"),
            videoUrl: videoUrl(item.id.videoId),
            description: decodeHtmlEntities(item.snippet.description),
            tags,
          };
        });
    } catch {
      return [];
    }
  }, VIDEO_CACHE_TTL_MS);
}

// Real playlist IDs from @AdobeLiveCommunity channel
const TOOL_PLAYLIST_IDS: { tool: string; id: string }[] = [
  { tool: "Photoshop",     id: "PLMMOwZoEbhuwaTuOc60tRTsokYGTdEG39" },
  { tool: "Illustrator",   id: "PLMMOwZoEbhuz4RamFC4qMOUXpHWZgyS3E" },
  { tool: "After Effects", id: "PLMMOwZoEbhuyX2RL5LE8pThYxcwHjF8Mv" },
  { tool: "Premiere",  id: "PLMMOwZoEbhuw4NszLQhE9uX_IdD5rpWA0" },
  { tool: "Lightroom",     id: "PLMMOwZoEbhuwMImBhitwZ6PhRQak0615K" },
  { tool: "Firefly",       id: "PLMMOwZoEbhuxPY2JftdLPXxIIcO7QRBu_" },
  { tool: "Express",       id: "PLMMOwZoEbhuwZ1J8GmHW19P8pylsT7Z2_" },
  { tool: "InDesign",      id: "PLMMOwZoEbhuzC6Mqvwovl8Y8ZeF6mXWtk" },
  { tool: "Fresco",        id: "PLMMOwZoEbhuwBffb0yYDkImol577KtqWI" },
  { tool: "Substance 3D",  id: "PLMMOwZoEbhuwXLF-GsAbSTcDwbJBsa_WZ" },
];

const FALLBACK_TOOL_PLAYLISTS: ToolPlaylist[] = TOOL_PLAYLIST_IDS.map(({ tool, id }) => ({
  tool,
  playlistId: id,
  playlistUrl: `https://www.youtube.com/playlist?list=${id}`,
  videoCount: 0,
  thumbnail: "",
}));

export async function getToolPlaylists(): Promise<ToolPlaylist[]> {
  return withCache("tool_playlists", async () => {
    try {
      const ids = TOOL_PLAYLIST_IDS.map((p) => p.id).join(",");
      const data = await proxyFetch("playlists_by_ids", { ids }) as YTPlaylistResponse | null;
      if (!data?.items?.length) return FALLBACK_TOOL_PLAYLISTS;

      const byId = new Map<string, YTPlaylistItem>();
      for (const item of data.items) byId.set(item.id, item);

      return TOOL_PLAYLIST_IDS.map(({ tool, id }) => {
        const item = byId.get(id);
        if (!item) {
          return FALLBACK_TOOL_PLAYLISTS.find((m) => m.tool === tool) ?? FALLBACK_TOOL_PLAYLISTS[0];
        }
        return {
          tool,
          playlistId: id,
          playlistUrl: `https://www.youtube.com/playlist?list=${id}`,
          videoCount: item.contentDetails.itemCount,
          thumbnail: bestThumb(item.snippet.thumbnails),
        };
      });
    } catch {
      return FALLBACK_TOOL_PLAYLISTS;
    }
  });
}

// Hardcoded recurring series with real playlist IDs
const RECURRING_SERIES: RecurringSeries[] = [
  {
    id: "file-new",
    title: "The File New Show",
    description: "A weekly designer and creator news show hosted by Ryan Selvy. Each episode covers industry updates in design, tech, branding, and the creator world — rebrands, resources, typography, platform changes, and cultural moments that matter to creatives.",
    playlistId: "PLMMOwZoEbhuwLunOhnaXOXzb0HKV97rdB",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwLunOhnaXOXzb0HKV97rdB",
    videoCount: 101,
    thumbnail: "https://i.ytimg.com/vi/GcMyg5Zzdfg/hqdefault.jpg",
    cadence: "Weekly",
  },
  {
    id: "office-hours",
    title: "Office Hours",
    description: "A live creative discussion series hosted by Andrew Hochradel and Nick Longo where designers dive into graphic design, branding strategy, typography, packaging, and Adobe Creative Cloud workflows. Featuring recurring segments like Brand Slam plus open community Q&A.",
    playlistId: "PLMMOwZoEbhuzRyIncsXfVJypjhQ6K9ap_",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuzRyIncsXfVJypjhQ6K9ap_",
    videoCount: 113,
    thumbnail: "https://i.ytimg.com/vi/A_Zvrp0DurE/hqdefault.jpg",
    cadence: "Weekly",
  },
  {
    id: "studio-sessions",
    title: "Adobe Live: Studio Sessions",
    description: "A monthly interview series hosted by Andrew Hochradel and Emily Poulin that spotlights the voices behind the work — artists, designers, illustrators, and creative leaders sharing their stories, struggles, and the lessons they've learned along the way.",
    playlistId: "PLMMOwZoEbhuxxeB4psdkHW0Wa6Fpnut3Y",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxxeB4psdkHW0Wa6Fpnut3Y",
    videoCount: 18,
    thumbnail: "https://i.ytimg.com/vi/LR52uemd_H8/hqdefault.jpg",
    cadence: "Series",
  },
  {
    id: "on-the-spot",
    title: "On the Spot with Magdiel Lopez",
    description: "A live graphic design challenge series where multidisciplinary designer Magdiel Lopez takes live audience suggestions and transforms spontaneous ideas into finished designs in real time using Adobe Photoshop — no preparation, no scripts, just raw creative instinct.",
    playlistId: "PLMMOwZoEbhuzbfHjflwjqGKSgW9PqziJY",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuzbfHjflwjqGKSgW9PqziJY",
    videoCount: 26,
    thumbnail: "https://i.ytimg.com/vi/35jRC_Yh1FE/hqdefault.jpg",
    cadence: "Weekly",
  },
  {
    id: "cinema-collective",
    title: "The Cinema Collective",
    description: "A series for filmmakers, editors, and post-production professionals covering topics from professional editing techniques and film industry news to coverage of events like NAB — bringing the cinema and creative video world to Adobe Live.",
    playlistId: "PLMMOwZoEbhuy-cPYlB9_bUAwnyWi6wQ8s",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuy-cPYlB9_bUAwnyWi6wQ8s",
    videoCount: 7,
    thumbnail: "https://i.ytimg.com/vi/uAWRoCSG7Yg/hqdefault.jpg",
    cadence: "Weekly",
  },
  {
    id: "education-edition",
    title: "Education Edition",
    description: "A live creative series for educators, students, and creative classrooms. Teachers and education experts demonstrate how to use Adobe Express, Creative Cloud, and generative AI tools to transform classroom projects — covering digital storytelling, infographics, video, and more.",
    playlistId: "PLMMOwZoEbhuxWHHeBpBp9QX4R1ObvH0iA",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxWHHeBpBp9QX4R1ObvH0iA",
    videoCount: 64,
    thumbnail: "https://i.ytimg.com/vi/jQsB1P6l_gM/hqdefault.jpg",
    cadence: "Monthly",
  },
];

export async function getRecurringSeries(): Promise<RecurringSeries[]> {
  return withCache("recurring_series", async () => RECURRING_SERIES);
}

// getSchedule reads upcoming streams from the video_index DB (always current,
// no quota cost) and overlays real-time live status from the YouTube API (short TTL).
export async function getSchedule(): Promise<ScheduleItem[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  return withCache("schedule", async () => {
    try {
      // 1. Read all upcoming streams from the DB — covers the full future window
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/video_index?select=id,title,description,thumbnail_url,video_url,tags,scheduled_time,actual_start_time,stream_status&stream_status=in.(upcoming,live)&order=scheduled_time.asc`,
        { headers: dbHeaders(), cache: "no-store" },
      );
      const dbRows = res.ok
        ? (await res.json() as Array<{
            id: string; title: string; description: string; thumbnail_url: string;
            video_url: string; tags: string[]; scheduled_time: string | null;
            actual_start_time: string | null; stream_status: string;
          }>)
        : [];

      // 2. Check which streams are actually live right now — reuses the same cache key as
      // getLiveNow() so both functions share a single API call per hour.
      const liveNowFull = await withCache("live_now", fetchLiveStreamsFromApi, LIVE_CACHE_TTL_MS, true);
      const liveSet = new Set<string>(liveNowFull.map((s) => s.id));

      // 3. Re-index only when upcoming data is stale (>4 h) to avoid redundant API quota use.
      (async () => {
        try {
          const staleRes = await fetch(
            `${SUPABASE_URL}/rest/v1/video_index?select=last_seen_at&stream_status=in.(upcoming,live)&order=last_seen_at.desc&limit=1`,
            { headers: dbHeaders(), cache: "no-store" },
          );
          const staleRows = staleRes.ok ? await staleRes.json() as { last_seen_at: string }[] : [];
          const lastSeen = staleRows[0]?.last_seen_at;
          const ageMs = lastSeen ? Date.now() - new Date(lastSeen).getTime() : Infinity;
          if (ageMs > 4 * 60 * 60 * 1000) {
            fetch(`${SUPABASE_URL}/functions/v1/index-all-videos`, {
              method: "POST",
              headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
              cache: "no-store",
            }).catch(() => {});
          }
        } catch { /* best-effort */ }
      })();

      return dbRows
        .filter((r) => r.scheduled_time)
        .map((r): ScheduleItem => {
          const tools = r.tags?.length ? r.tags : inferTools(r.title, r.description);
          const isLive = liveSet.has(r.id) || r.stream_status === "live";
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            scheduledTime: r.scheduled_time!,
            videoUrl: r.video_url,
            tools: tools.length ? tools : ["Adobe Live"],
            host: "Adobe Live",
            thumbnail: r.thumbnail_url,
            isLive,
          };
        })
        .sort((a, b) => {
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
        });
    } catch {
      return [];
    }
  }, LIVE_CACHE_TTL_MS); // 1-hour TTL — matches live check cadence
}

// Read all past streams from the persistent past_streams table.
// On first load (< 10 rows), triggers a background index so data populates
// without blocking the page render.
export async function getPastStreams(): Promise<ScheduleItem[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/past_streams?select=id,title,description,thumbnail_url,video_url,actual_start_time,tools,host&order=actual_start_time.desc&limit=500`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = await res.json() as Array<{
      id: string;
      title: string;
      description: string;
      thumbnail_url: string;
      video_url: string;
      actual_start_time: string | null;
      tools: string[];
      host: string | null;
    }>;

    // Kick off a background index on first visit so data populates
    if (rows.length < 10) {
      fetch(`${SUPABASE_URL}/functions/v1/index-past-streams`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        cache: "no-store",
      }).catch(() => {});
    }

    return rows
      .filter((r) => r.actual_start_time)
      .map((r): ScheduleItem => ({
        id: r.id,
        title: r.title,
        description: r.description,
        scheduledTime: r.actual_start_time!,
        videoUrl: r.video_url,
        tools: r.tools?.length ? r.tools : ["Adobe Live"],
        host: r.host,
        thumbnail: r.thumbnail_url,
        isLive: false,
      }));
  } catch {
    return [];
  }
}

// Instructor-led course playlists from @AdobeLiveCommunity
const COURSE_PLAYLISTS: CoursePlaylist[] = [
  {
    id: "aaron-nace",
    title: "Photo Editing & Color Grading Techniques",
    instructor: "Aaron Nace",
    playlistId: "PLMMOwZoEbhuxQKC6pFbFA3RFf9Lbw5ihP",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxQKC6pFbFA3RFf9Lbw5ihP",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/ZmGe6Pd3gVQ/hqdefault.jpg",
    tool: "Photoshop",
    tags: ["Photoshop", "Lightroom"],
  },
  {
    id: "jesus-ramirez",
    title: "Photo Editing & Compositing Techniques",
    instructor: "Jesús Ramirez",
    playlistId: "PLMMOwZoEbhuyt3azcxF5wsm-QYsIuJBc3",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuyt3azcxF5wsm-QYsIuJBc3",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/Kl46iSQuSZs/hqdefault.jpg",
    tool: "Photoshop",
    tags: ["Photoshop"],
  },
  {
    id: "idara-ekoph",
    title: "Portrait Photo Editing & Color Grading",
    instructor: "Idara Ekoph",
    playlistId: "PLMMOwZoEbhuyr_MCFH-H2RSwOKKSqaDcN",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuyr_MCFH-H2RSwOKKSqaDcN",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/9O3xHJHCNJs/hqdefault.jpg",
    tool: "Lightroom",
    tags: ["Lightroom", "Photoshop"],
  },
  {
    id: "matthew-tjokro",
    title: "Vector Illustration, Effects & Texture Techniques",
    instructor: "Matthew Tjokro",
    playlistId: "PLMMOwZoEbhuymbswkrtT3xk1RdzsWx5TG",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuymbswkrtT3xk1RdzsWx5TG",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/cbNxbZBQuWM/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator", "Photoshop"],
  },
  {
    id: "spencer-nugent",
    title: "Illustration & Visual Design Techniques",
    instructor: "Spencer Nugent",
    playlistId: "PLMMOwZoEbhuxoPPvHfLYVfv9VCPmezV6T",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxoPPvHfLYVfv9VCPmezV6T",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/gr1Bl9Av2VQ/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator"],
  },
  {
    id: "tyler-pate",
    title: "Pen Tool & Vector Illustration Techniques",
    instructor: "Tyler Pate",
    playlistId: "PLMMOwZoEbhuy1K5d9VuQI2f8nI1PkSg8S",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuy1K5d9VuQI2f8nI1PkSg8S",
    videoCount: 4,
    thumbnail: "https://i.ytimg.com/vi/FPRmP9qpcoA/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator"],
  },
  {
    id: "jess-goldsmith",
    title: "Typography & Text-Based Design",
    instructor: "Jess Goldsmith",
    playlistId: "PLMMOwZoEbhuxDXQ-uVPSzyrUO75FuS8ag",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxDXQ-uVPSzyrUO75FuS8ag",
    videoCount: 7,
    thumbnail: "https://i.ytimg.com/vi/RBPKZYjAvEk/hqdefault.jpg",
    tool: "InDesign",
    tags: ["InDesign", "Illustrator"],
  },
  {
    id: "liz-mosley",
    title: "Brand Identity Design",
    instructor: "Liz Mosley",
    playlistId: "PLMMOwZoEbhuxNHXxjQOAK4NXtXk2XA2CQ",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxNHXxjQOAK4NXtXk2XA2CQ",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/L4Nn-RTIe10/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator", "InDesign"],
  },
  {
    id: "steven-overturf",
    title: "Branding Design, Logo Creation & Vector Illustration",
    instructor: "Steven Overturf",
    playlistId: "PLMMOwZoEbhuzeHz0McFvDWPnKyWQklCle",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuzeHz0McFvDWPnKyWQklCle",
    videoCount: 5,
    thumbnail: "https://i.ytimg.com/vi/tgqIuySQUDU/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator"],
  },
  {
    id: "brittney-megann",
    title: "Brand Building & Brand Identity Design",
    instructor: "Brittney Megann",
    playlistId: "PLMMOwZoEbhuxHSfFSVZkTwUPAMRytAjJ1",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxHSfFSVZkTwUPAMRytAjJ1",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/aGu5NbQUXqQ/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator", "Express"],
  },
  {
    id: "izzy-poirier",
    title: "Generative AI for Branding & Campaign Design",
    instructor: "Izzy Poirier",
    playlistId: "PLMMOwZoEbhuy18CNICklwQ7S8xL7Jqdli",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuy18CNICklwQ7S8xL7Jqdli",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/_Xbs5rszqoY/hqdefault.jpg",
    tool: "Firefly",
    tags: ["Firefly", "Express"],
  },
  {
    id: "natalie-brown",
    title: "Hand Lettering & Small Business Branding",
    instructor: "Natalie Brown",
    playlistId: "PLMMOwZoEbhuyEpqgKFu6H90kgxHeJgEsf",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuyEpqgKFu6H90kgxHeJgEsf",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/YegPJJm8o-I/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator", "Photoshop"],
  },
  {
    id: "chris-grubisa",
    title: "Video Editing & Content Production Techniques",
    instructor: "Chris Grubisa",
    playlistId: "PLMMOwZoEbhuzKw38xhKeJ2qjmXzb0zkyn",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuzKw38xhKeJ2qjmXzb0zkyn",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/Kly2kyKwOm0/hqdefault.jpg",
    tool: "Premiere",
    tags: ["Premiere", "After Effects"],
  },
  {
    id: "james-bonanno",
    title: "Video Editing Techniques & Storytelling",
    instructor: "James Bonanno",
    playlistId: "PLMMOwZoEbhuysel2w6FDuTIjfD9c21Aju",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuysel2w6FDuTIjfD9c21Aju",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/R7U_7Ne5l3s/hqdefault.jpg",
    tool: "Premiere",
    tags: ["Premiere"],
  },
  {
    id: "fabiola-lara",
    title: "Content Creation for Artists",
    instructor: "Fabiola Lara",
    playlistId: "PLMMOwZoEbhuwpXwGuVkChKeoMaXoJlpKq",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuwpXwGuVkChKeoMaXoJlpKq",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/bRjiz8NRtAQ/hqdefault.jpg",
    tool: "Express",
    tags: ["Express", "Firefly"],
  },
  {
    id: "stephy-fung",
    title: "Digital Fashion & 3D Garment Texturing",
    instructor: "Stephy Fung",
    playlistId: "PLMMOwZoEbhuw035aCDkvH0DN_OPuWqQeK",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuw035aCDkvH0DN_OPuWqQeK",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/KYigRBUyzxQ/hqdefault.jpg",
    tool: "Substance 3D",
    tags: ["Substance 3D", "Photoshop"],
  },
  {
    id: "jacob-paris",
    title: "Turn Digital Designs into Physical Art",
    instructor: "Jacob Paris",
    playlistId: "PLMMOwZoEbhuxcHtPzILVAv59UV0Oe6myx",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuxcHtPzILVAv59UV0Oe6myx",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/q06IantN7gg/hqdefault.jpg",
    tool: "Illustrator",
    tags: ["Illustrator", "Photoshop"],
  },
  {
    id: "ryan-selvy",
    title: "Troubleshooting, Speed & Productivity Tips",
    instructor: "Ryan Selvy",
    playlistId: "PLMMOwZoEbhuw-bDGYfMyxKdGd1T4mJPO9",
    playlistUrl: "https://www.youtube.com/playlist?list=PLMMOwZoEbhuw-bDGYfMyxKdGd1T4mJPO9",
    videoCount: 8,
    thumbnail: "https://i.ytimg.com/vi/N-sWUFYGf6k/hqdefault.jpg",
    tool: "Photoshop",
    tags: ["Photoshop", "Lightroom"],
  },
];

export async function getCourses(): Promise<CoursePlaylist[]> {
  return withCache("courses", async () => COURSE_PLAYLISTS);
}

// ---------------------------------------------------------------------------
// Playlist videos + info
// ---------------------------------------------------------------------------

interface YTPlaylistItemResponse {
  items?: Array<{
    snippet: {
      title: string;
      position: number;
      publishedAt: string;
      thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
      resourceId: { videoId: string };
    };
    contentDetails: { videoId: string };
  }>;
}

interface YTPlaylistInfoResponse {
  items?: Array<{
    snippet: {
      title: string;
      description: string;
      thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
    };
    contentDetails: { itemCount: number };
  }>;
}

async function getPlaylistVideosFromIndex(playlistId: string): Promise<PlaylistVideoItem[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/video_index?select=id,title,thumbnail_url,video_url,published_at,duration,tags,description&playlist_id=eq.${encodeURIComponent(playlistId)}&is_live_stream=eq.false&order=published_at.asc&limit=200`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = await res.json() as Array<{
      id: string; title: string; thumbnail_url: string; video_url: string;
      published_at: string | null; duration: string; tags: string[]; description: string;
    }>;
    return rows.map((r, i): PlaylistVideoItem => ({
      id: r.id,
      title: r.title,
      thumbnail: r.thumbnail_url,
      duration: r.duration ?? "",
      publishedAt: r.published_at ?? "",
      viewCount: 0,
      position: i,
      description: r.description ?? "",
    }));
  } catch {
    return [];
  }
}

export async function getPlaylistVideos(playlistId: string): Promise<PlaylistVideoItem[]> {
  return withCache(`playlist_videos:${playlistId}`, async () => {
    try {
      const data = await proxyFetch("playlist_videos", { playlistId }) as YTPlaylistItemResponse | null;
      if (!data?.items?.length) {
        // API returned nothing (quota exhausted or error) — fall back to DB index
        return getPlaylistVideosFromIndex(playlistId);
      }

      const videoIds = data.items.map((i) => i.contentDetails.videoId).join(",");
      const statsData = await proxyFetch("playlist_video_stats", { ids: videoIds }) as YTVideoResponse | null;
      const statsMap = new Map<string, YTVideoItem>();
      if (statsData?.items) {
        for (const v of statsData.items) statsMap.set(v.id, v);
      }

      return data.items
        .filter((item) => statsMap.get(item.contentDetails.videoId)?.status?.privacyStatus === "public")
        .map((item): PlaylistVideoItem => {
          const vid = statsMap.get(item.contentDetails.videoId)!;
          return {
            id: item.contentDetails.videoId,
            title: decodeHtmlEntities(item.snippet.title),
            thumbnail: bestThumb(item.snippet.thumbnails),
            duration: vid.contentDetails?.duration ? parseDuration(vid.contentDetails.duration) : "",
            publishedAt: item.snippet.publishedAt,
            viewCount: parseInt(vid.statistics?.viewCount ?? "0"),
            position: item.snippet.position,
            description: vid.snippet?.description ?? "",
          };
        });
    } catch {
      return getPlaylistVideosFromIndex(playlistId);
    }
  });
}

export async function getPlaylistDescription(playlistId: string): Promise<string> {
  try {
    const data = await proxyFetch("playlist_info", { playlistId }) as YTPlaylistInfoResponse | null;
    return data?.items?.[0]?.snippet?.description ?? "";
  } catch {
    return "";
  }
}

export async function getPlaylistInfo(playlistId: string): Promise<{ title: string; description: string }> {
  return withCache(`playlist_info:${playlistId}`, async () => {
    try {
      const data = await proxyFetch("playlist_info", { playlistId }) as YTPlaylistInfoResponse | null;
      const item = data?.items?.[0];
      return {
        title: item?.snippet?.title ?? "",
        description: item?.snippet?.description ?? "",
      };
    } catch {
      return { title: "", description: "" };
    }
  });
}

// ---------------------------------------------------------------------------
// Video index — persists every surfaced video to Supabase for sitemap use
// ---------------------------------------------------------------------------

export async function indexVideos(videos: VideoItem[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !videos.length) return;
  try {
    const payload = videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail_url: v.thumbnail,
      video_url: v.videoUrl,
      published_at: v.publishedAt || null,
      duration: v.duration,
      tags: v.tags,
    }));
    await fetch(`${SUPABASE_URL}/functions/v1/index-videos`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videos: payload }),
      cache: "no-store",
    });
  } catch { /* best-effort */ }
}

export async function indexPlaylistVideos(playlistId: string, videos: PlaylistVideoItem[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !videos.length) return;
  try {
    const payload = videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail_url: v.thumbnail,
      video_url: `https://www.youtube.com/watch?v=${v.id}`,
      published_at: v.publishedAt || null,
      duration: v.duration,
      tags: [] as string[],
      playlist_id: playlistId,
    }));
    await fetch(`${SUPABASE_URL}/functions/v1/index-videos`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videos: payload }),
      cache: "no-store",
    });
  } catch { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// Formatting utilities
// ---------------------------------------------------------------------------

export function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function formatScheduledTime(iso: string): string {
  const date = new Date(iso);
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "Starting soon";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours === 0) return `In ${mins}m`;
  if (hours < 24) return `In ${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return `${days}d ${remH}h — ${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`;
}
