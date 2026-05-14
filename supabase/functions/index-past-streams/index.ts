import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE = "https://www.googleapis.com/youtube/v3";

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

function bestThumb(thumbs: Record<string, { url: string } | undefined>): string {
  return thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "";
}

const SERIES_PATTERNS: [string, RegExp][] = [
  ["File New",          /file new/i],
  ["Office Hours",      /office hours/i],
  ["On the Spot",       /on the spot/i],
  ["Feature Friday",    /feature friday/i],
  ["Cinema Collective", /cinema collective/i],
  ["Studio Sessions",   /studio sessions/i],
  ["The Unlock",        /\bthe unlock\b/i],
  ["Brand Slam",        /brand slam/i],
  ["The Wrap-Up",       /wrap[\s-]?up/i],
];

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
  ["Substance 3D", "substance"],
  ["Acrobat", "acrobat"],
];

function inferTools(text: string): string[] {
  for (const [series, pattern] of SERIES_PATTERNS) {
    if (pattern.test(text)) return [series];
  }
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const [tool, kw] of TOOL_KEYWORDS) {
    if (!seen.has(tool) && lower.includes(kw)) {
      seen.add(tool);
      result.push(tool);
    }
  }
  return result.length ? result : ["Adobe Live"];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Get all video IDs from video_index (already crawled)
    const { data: indexRows, error: indexErr } = await supabase
      .from("video_index")
      .select("id, title, description, thumbnail_url, video_url")
      .order("published_at", { ascending: false });

    if (indexErr || !indexRows?.length) {
      return new Response(JSON.stringify({ error: "Could not read video_index", detail: indexErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get already-indexed past stream IDs to skip re-fetching details
    const { data: existingRows } = await supabase.from("past_streams").select("id");
    const existingIds = new Set<string>((existingRows ?? []).map((r: { id: string }) => r.id));

    // Only fetch details for IDs we haven't classified yet
    const uncheckedIds = indexRows.map((r: { id: string }) => r.id).filter((id: string) => !existingIds.has(id));

    if (!uncheckedIds.length) {
      return new Response(JSON.stringify({ ok: true, total: existingIds.size, new: 0, message: "All up to date" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch-fetch liveStreamingDetails for unchecked IDs (50 per API call)
    type LiveDetails = { actualStartTime?: string; actualEndTime?: string; title?: string; description?: string; thumbnail?: string };
    const detailsMap = new Map<string, LiveDetails>();

    for (let i = 0; i < uncheckedIds.length; i += 50) {
      const batch = uncheckedIds.slice(i, i + 50);
      const url = `${BASE}/videos?part=snippet,liveStreamingDetails&id=${batch.join(",")}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.error?.errors?.[0]?.reason === "quotaExceeded") {
        return new Response(JSON.stringify({ error: "quota_exceeded", indexed: detailsMap.size }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (data?.items) {
        for (const v of data.items) {
          detailsMap.set(v.id, {
            actualStartTime: v.liveStreamingDetails?.actualStartTime,
            actualEndTime: v.liveStreamingDetails?.actualEndTime,
            title: v.snippet?.title ? decodeHtmlEntities(v.snippet.title) : undefined,
            description: v.snippet?.description ? decodeHtmlEntities(v.snippet.description) : undefined,
            thumbnail: bestThumb(v.snippet?.thumbnails ?? {}),
          });
        }
      }
    }

    // Build rows for videos that are confirmed completed live streams (have actualEndTime)
    const indexById = new Map(indexRows.map((r: { id: string; title: string; description: string; thumbnail_url: string; video_url: string }) => [r.id, r]));
    const rows: Array<{
      id: string; title: string; description: string; thumbnail_url: string;
      video_url: string; actual_start_time: string | null; tools: string[]; host: string;
    }> = [];

    for (const [id, details] of detailsMap.entries()) {
      // Only keep completed live streams — must have actualEndTime
      if (!details.actualEndTime) continue;

      const indexed = indexById.get(id);
      const title = details.title ?? indexed?.title ?? "";
      const description = details.description ?? indexed?.description ?? "";
      const thumbnail = details.thumbnail || indexed?.thumbnail_url || "";

      rows.push({
        id,
        title,
        description,
        thumbnail_url: thumbnail,
        video_url: indexed?.video_url ?? `https://www.youtube.com/watch?v=${id}`,
        actual_start_time: details.actualStartTime ?? null,
        tools: inferTools(`${title} ${description}`),
        host: "Adobe Live",
      });
    }

    if (!rows.length) {
      return new Response(JSON.stringify({ ok: true, total: existingIds.size, new: 0, checked: uncheckedIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: upsertErr } = await supabase
      .from("past_streams")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, new: rows.length, checked: uncheckedIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
