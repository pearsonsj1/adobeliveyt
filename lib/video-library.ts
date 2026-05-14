import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllVideoIndexForLibrary } from "@/lib/video-index-pagination";

export interface LibraryVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  tags: string[];
  published_at: string | null;
}

export function mapIndexRowToLibraryVideo(v: {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string;
  video_url: string;
  duration: string | null;
  tags: string[] | null;
  published_at: string | null;
}): LibraryVideo {
  return {
    id: v.id,
    title: v.title,
    description: v.description ?? "",
    thumbnail_url: v.thumbnail_url,
    video_url: v.video_url,
    duration: v.duration ?? "",
    tags: v.tags ?? [],
    published_at: v.published_at ?? null,
  };
}

/** Single round-trip total row count (for `/videos` shell + JSON-LD). */
export async function getVideoIndexTotalCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase.from("video_index").select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

/** Newest-first sample for structured data only — not the full library. */
export async function getVideoIndexSampleForSeo(
  supabase: SupabaseClient,
  limit: number,
): Promise<LibraryVideo[]> {
  const { data, error } = await supabase
    .from("video_index")
    .select("id, title, description, thumbnail_url, video_url, duration, tags, published_at")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data?.length) return [];
  return data.map((v) => mapIndexRowToLibraryVideo(v));
}

/** Full library for client/API (paginates past PostgREST default cap). */
export async function loadFullVideoLibrary(supabase: SupabaseClient): Promise<LibraryVideo[]> {
  const rows = await fetchAllVideoIndexForLibrary(supabase);
  return rows.map((v) => mapIndexRowToLibraryVideo(v));
}
