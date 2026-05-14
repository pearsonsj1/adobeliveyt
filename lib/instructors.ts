import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchAllVideoIndexRows } from "@/lib/video-index-pagination";
import { getCourses, isShortFormatVideo, type CoursePlaylist } from "@/lib/youtube";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function slugifyInstructor(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "instructor";
}

export function instructorProfilePath(name: string): string {
  return `/instructors/${slugifyInstructor(name)}`;
}

/** ASCII fold for matching descriptions that omit accents (e.g. Jesus vs Jesús). */
function foldAscii(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").trim();
}

/** Distinct name strings to search in titles and descriptions (original + ASCII if different). */
export function instructorNameSearchPatterns(name: string): string[] {
  const raw = name.trim();
  const folded = foldAscii(raw);
  const set = new Set<string>();
  if (raw.length >= 3) set.add(raw);
  if (folded.length >= 3 && folded !== raw) set.add(folded);
  return Array.from(set);
}

/**
 * Escape characters reserved in PostgREST `or` / `ilike` filter values.
 * @see https://postgrest.org/en/stable/references/api/tables_views.html#reserved-characters
 */
function escapePostgrestIlikeToken(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/([,*()])/g, "\\$1");
}

export type InstructorProfileLink = {
  url: string;
  label: string;
};

export type InstructorAppearanceVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  published_at: string | null;
  duration: string;
  tags: string[];
  /** True when this row is also a lesson inside one of this instructor’s course playlists. */
  inCoursePlaylist: boolean;
};

function mergeVideoRowsById<T extends { id: string; published_at: string | null }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of rows) {
    if (!byId.has(r.id)) byId.set(r.id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
  );
}

function shouldSkipExtractedUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes("adobe.com") || u.includes("adobe.ly")) return true;
  if (u.includes("behance.net/adobe")) return true;
  if (u.includes("youtu.be/")) return true;
  if (/youtube\.com\/watch\?/i.test(u)) return true;
  if (/youtube\.com\/shorts\//i.test(u)) return true;
  if (/youtube\.com\/live\//i.test(u)) return true;
  if (u.includes("stock.adobe.com")) return true;
  return false;
}

function labelForProfileUrl(hostname: string, pathname: string): string {
  const h = hostname.replace(/^www\./, "");
  if (h === "twitter.com" || h === "x.com") return "X";
  if (h === "instagram.com") return "Instagram";
  if (h === "threads.net") return "Threads";
  if (h === "facebook.com") return "Facebook";
  if (h === "linkedin.com") return "LinkedIn";
  if (h === "behance.net") return "Behance";
  if (h === "dribbble.com") return "Dribbble";
  if (h === "github.com") return "GitHub";
  if (h === "vimeo.com") return "Vimeo";
  if (h === "tiktok.com") return "TikTok";
  if (h === "twitch.tv") return "Twitch";
  if (h === "linktr.ee") return "Linktree";
  if (h === "bio.site") return "Bio.site";
  if (h === "youtube.com" || h === "m.youtube.com") {
    if (pathname.includes("/@") || pathname.includes("/c/") || pathname.includes("/user/") || pathname.includes("/channel/")) {
      return "YouTube channel";
    }
    return "YouTube";
  }
  return h.replace(/^www\./, "");
}

const LINK_PRIORITY: Record<string, number> = {
  X: 0,
  Instagram: 1,
  YouTube: 2,
  "YouTube channel": 2,
  LinkedIn: 3,
  Behance: 4,
  Dribbble: 5,
  GitHub: 6,
  TikTok: 7,
  Twitch: 8,
  Threads: 9,
  Facebook: 10,
  Vimeo: 11,
  Linktree: 12,
  "Bio.site": 13,
};

/**
 * Pull external profile URLs from video description copy (socials, portfolio, link-in-bio services).
 */
export function extractInstructorProfileLinks(descriptions: (string | null | undefined)[]): InstructorProfileLink[] {
  const urlRe = /https?:\/\/[^\s\)<>\]"']+/gi;
  const seen = new Set<string>();
  const out: InstructorProfileLink[] = [];

  for (const text of descriptions) {
    if (!text) continue;
    let m: RegExpExecArray | null;
    const re = new RegExp(urlRe.source, urlRe.flags);
    while ((m = re.exec(text)) !== null) {
      let raw = m[0].replace(/[),.;]+$/g, "");
      raw = raw.replace(/&amp;/g, "&");
      if (shouldSkipExtractedUrl(raw)) continue;
      let parsed: URL;
      try {
        parsed = new URL(raw);
      } catch {
        continue;
      }
      if (!["http:", "https:"].includes(parsed.protocol)) continue;
      const host = parsed.hostname.toLowerCase();
      if (host.endsWith("adobelive.com")) continue;

      parsed.hash = "";
      const norm = parsed.toString().replace(/\/+$/, "");
      const key = norm.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const label = labelForProfileUrl(parsed.hostname, parsed.pathname);
      out.push({ url: norm, label });
    }
  }

  out.sort((a, b) => {
    const pa = LINK_PRIORITY[a.label] ?? 50;
    const pb = LINK_PRIORITY[b.label] ?? 50;
    if (pa !== pb) return pa - pb;
    return a.label.localeCompare(b.label) || a.url.localeCompare(b.url);
  });
  return out;
}

/**
 * Short credit / bio lines from descriptions that mention the instructor and contain a link or handle-like token.
 */
export function extractInstructorDescriptionHighlights(
  name: string,
  descriptions: (string | null | undefined)[],
  max = 5,
): string[] {
  const patterns = instructorNameSearchPatterns(name).map((p) => p.toLowerCase());
  const seen = new Set<string>();

  for (const d of descriptions) {
    if (!d) continue;
    const low = d.toLowerCase();
    if (!patterns.some((p) => low.includes(p))) continue;
    const lines = d
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 24 && l.length < 400);
    for (const line of lines) {
      if (!/(https?:\/\/|\bwww\.|[@#]\w)/i.test(line)) continue;
      const one = line.replace(/\s+/g, " ").trim();
      if (seen.has(one)) continue;
      seen.add(one);
      if (seen.size >= max * 3) break;
    }
    if (seen.size >= max * 3) break;
  }

  return Array.from(seen).slice(0, max);
}

type VideoIndexRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string;
  video_url: string;
  published_at: string | null;
  duration: string | null;
  tags: string[] | null;
  playlist_ids: string[] | null;
  is_live_stream: boolean;
  stream_status: string | null;
};

async function fetchInstructorAppearanceRows(
  supabase: SupabaseClient,
  name: string,
): Promise<VideoIndexRow[]> {
  const patterns = instructorNameSearchPatterns(name);
  if (patterns.length === 0) return [];

  const orParts = patterns.flatMap((p) => {
    const token = escapePostgrestIlikeToken(p);
    return [`title.ilike.*${token}*`, `description.ilike.*${token}*`];
  });
  const nameOr = orParts.join(",");

  const rows = await fetchAllVideoIndexRows<VideoIndexRow>((rangeFrom, rangeTo) =>
    supabase
      .from("video_index")
      .select(
        "id, title, description, thumbnail_url, video_url, published_at, duration, tags, playlist_ids, is_live_stream, stream_status",
      )
      .eq("is_live_stream", false)
      .or(nameOr)
      .order("published_at", { ascending: false })
      .range(rangeFrom, rangeTo),
  );

  const merged = mergeVideoRowsById(rows);
  return merged.filter((r) => r.stream_status == null || r.stream_status !== "upcoming");
}

const MAX_APPEARANCES_ON_PROFILE = 180;

export async function getInstructorAppearancesAndLinks(
  name: string,
  coursePlaylistIds: string[],
): Promise<{
  appearances: InstructorAppearanceVideo[];
  profileLinks: InstructorProfileLink[];
  highlights: string[];
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { appearances: [], profileLinks: [], highlights: [] };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const rows = await fetchInstructorAppearanceRows(supabase, name);

  const playlistSet = new Set(coursePlaylistIds);
  const appearances: InstructorAppearanceVideo[] = [];

  for (const r of rows) {
    if (isShortFormatVideo({ duration: r.duration ?? "", videoUrl: r.video_url })) continue;
    const inCoursePlaylist = Boolean(r.playlist_ids?.some((id) => playlistSet.has(id)));
    appearances.push({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      thumbnail_url: r.thumbnail_url,
      video_url: r.video_url,
      published_at: r.published_at,
      duration: r.duration ?? "",
      tags: r.tags ?? [],
      inCoursePlaylist,
    });
    if (appearances.length >= MAX_APPEARANCES_ON_PROFILE) break;
  }

  const descs = appearances.map((a) => a.description);
  const profileLinks = extractInstructorProfileLinks(descs);
  const highlights = extractInstructorDescriptionHighlights(name, descs);

  return { appearances, profileLinks, highlights };
}

export type InstructorSummary = {
  name: string;
  slug: string;
  courseCount: number;
  thumbnail: string;
  tools: string[];
};

export async function getInstructorSummaries(): Promise<InstructorSummary[]> {
  const courses = await getCourses();
  const map = new Map<string, CoursePlaylist[]>();
  for (const c of courses) {
    const list = map.get(c.instructor) ?? [];
    list.push(c);
    map.set(c.instructor, list);
  }
  return Array.from(map.entries())
    .map(([name, cs]) => ({
      name,
      slug: slugifyInstructor(name),
      courseCount: cs.length,
      thumbnail: cs[0]?.thumbnail ?? "",
      tools: Array.from(new Set(cs.map((x) => x.tool))).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getInstructorBySlug(slug: string): Promise<{
  name: string;
  slug: string;
  courses: CoursePlaylist[];
  appearances: InstructorAppearanceVideo[];
  profileLinks: InstructorProfileLink[];
  highlights: string[];
} | null> {
  const courses = await getCourses();
  const match = courses.find((c) => slugifyInstructor(c.instructor) === slug);
  if (!match) return null;
  const name = match.instructor;
  const myCourses = courses
    .filter((c) => c.instructor === name)
    .sort((a, b) => a.title.localeCompare(b.title));
  const coursePlaylistIds = myCourses.map((c) => c.playlistId);
  const { appearances, profileLinks, highlights } = await getInstructorAppearancesAndLinks(name, coursePlaylistIds);

  return {
    name,
    slug,
    courses: myCourses,
    appearances,
    profileLinks,
    highlights,
  };
}

/** Rank courses by overlap between video tags and course tool / course tags (retention + internal links). */
export function inferRelatedCoursesForVideo(
  videoTags: string[],
  courses: CoursePlaylist[],
  limit = 4
): CoursePlaylist[] {
  const tagSet = new Set(videoTags.map((t) => t.toLowerCase().trim()).filter(Boolean));
  const scored = courses.map((c) => {
    let score = 0;
    const tool = c.tool.toLowerCase();
    if (tagSet.has(tool)) score += 4;
    for (const t of c.tags) {
      const tl = t.toLowerCase();
      if (tagSet.has(tl)) score += 3;
    }
    for (const vt of Array.from(tagSet)) {
      if (vt.length < 3) continue;
      if (tool.includes(vt) || vt.includes(tool)) score += 2;
      for (const ct of c.tags) {
        const cl = ct.toLowerCase();
        if (cl.includes(vt) || vt.includes(cl)) score += 1;
      }
    }
    return { c, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title))
    .slice(0, limit)
    .map((x) => x.c);
}
