import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

/** PostgREST default max rows per request (Supabase); page until exhausted. */
const VIDEO_INDEX_PAGE_SIZE = 1000;

export async function fetchAllVideoIndexRows<T extends Record<string, unknown>>(
  runPage: (rangeFrom: number, rangeTo: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let rangeFrom = 0;
  for (;;) {
    const rangeTo = rangeFrom + VIDEO_INDEX_PAGE_SIZE - 1;
    const { data, error } = await runPage(rangeFrom, rangeTo);
    if (error) break;
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < VIDEO_INDEX_PAGE_SIZE) break;
    rangeFrom += VIDEO_INDEX_PAGE_SIZE;
  }
  return all;
}

/** Full video library (newest first); avoids the implicit ~1000-row PostgREST cap. */
export function fetchAllVideoIndexForLibrary(supabase: SupabaseClient) {
  return fetchAllVideoIndexRows((from, to) =>
    supabase
      .from("video_index")
      .select("id, title, description, thumbnail_url, video_url, duration, tags, published_at")
      .order("published_at", { ascending: false })
      .range(from, to),
  );
}

/** All rows for `/video-sitemap.xml`. */
export function fetchAllVideoIndexForVideoSitemap(supabase: SupabaseClient) {
  return fetchAllVideoIndexRows((from, to) =>
    supabase
      .from("video_index")
      .select("id, title, description, thumbnail_url, video_url, published_at, duration, tags, last_seen_at")
      .order("published_at", { ascending: false })
      .range(from, to),
  );
}
