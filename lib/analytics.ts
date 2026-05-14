const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function post(table: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_ANON) return;
  fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export function trackSearch(query: string, resultsCount: number, toolFilter: string) {
  if (!query.trim()) return;
  post("search_queries", { query: query.trim(), results_count: resultsCount, tool_filter: toolFilter });
}

export function trackSearchClick(query: string, clickedVideoId: string, toolFilter: string) {
  if (!query.trim()) return;
  post("search_queries", { query: query.trim(), results_count: 0, clicked_video_id: clickedVideoId, tool_filter: toolFilter });
}

export function trackTimeSpent(videoId: string, secondsSpent: number, clickedYoutube: boolean) {
  if (secondsSpent < 3) return;
  post("page_time_spent", { video_id: videoId, seconds_spent: secondsSpent, clicked_youtube: clickedYoutube });
}

export function trackYouTubeCTA(videoId: string, videoTitle: string, sourcePage: string) {
  post("youtube_cta_clicks", { video_id: videoId, video_title: videoTitle, source_page: sourcePage });
}

export function trackContentClick(
  contentId: string,
  contentTitle: string,
  contentType: string,
  section: string,
  tags: string[]
) {
  post("content_clicks", {
    content_id: contentId,
    content_title: contentTitle,
    content_type: contentType,
    section,
    tags,
  });
}

export function addUtm(url: string, params: { source?: string; medium?: string; campaign?: string; content?: string }) {
  try {
    const u = new URL(url);
    if (params.source) u.searchParams.set("utm_source", params.source);
    if (params.medium) u.searchParams.set("utm_medium", params.medium);
    if (params.campaign) u.searchParams.set("utm_campaign", params.campaign);
    if (params.content) u.searchParams.set("utm_content", params.content);
    return u.toString();
  } catch {
    return url;
  }
}
