import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CHANNEL_ID = "UCVMJPRXrBIOFDBZEaF-_pEA";
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
  ["Education Edition", /education edition/i],
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
  ["Substance", "substance"],
  ["Acrobat", "acrobat"],
];

// Series name goes first so the video card badge shows the series.
// Tool tags are always extracted from the title and appended — this lets the
// video library filter page match series episodes when filtering by tool.
// Tool matching is title-only: descriptions contain boilerplate links that cause false positives.
function inferTags(title: string, description = ""): string[] {
  const fullText = `${title} ${description}`;
  const lowerTitle = title.toLowerCase();
  const toolTags: string[] = [];
  const seen = new Set<string>();
  for (const [tool, kw] of TOOL_KEYWORDS) {
    if (!seen.has(tool) && lowerTitle.includes(kw)) {
      seen.add(tool);
      toolTags.push(tool);
    }
  }
  for (const [series, pattern] of SERIES_PATTERNS) {
    if (pattern.test(fullText)) return [series, ...toolTags];
  }
  return toolTags;
}

function bestThumb(thumbs: Record<string, { url: string } | undefined>): string {
  return thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "";
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

    // ── Step 1: resolve uploads playlist ID from channel ──────────────────────
    // The uploads playlist contains every public video with no result cap,
    // unlike the search API which silently truncates at ~500 results.
    const channelRes = await fetch(
      `${BASE}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`
    );
    const channelData = await channelRes.json();

    if (channelData?.error?.errors?.[0]?.reason === "quotaExceeded") {
      return new Response(JSON.stringify({ error: "quota_exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploadsPlaylistId: string =
      channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return new Response(JSON.stringify({ error: "Could not resolve uploads playlist" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: page through uploads playlist (all videos, no cap) ────────────
    type PlaylistMeta = { title: string; thumbnail: string; publishedAt: string; videoUrl: string };
    const allVideoIds: string[] = [];
    const videoMeta: Record<string, PlaylistMeta> = {};

    let pageToken: string | undefined = undefined;
    do {
      const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
      const playlistUrl =
        `${BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${tokenParam}&key=${apiKey}`;
      const playlistRes = await fetch(playlistUrl);
      const playlistData = await playlistRes.json();

      if (playlistData?.error?.errors?.[0]?.reason === "quotaExceeded") {
        return new Response(JSON.stringify({ error: "quota_exceeded", indexed: allVideoIds.length }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!playlistData?.items?.length) break;

      for (const item of playlistData.items) {
        const id: string = item.snippet?.resourceId?.videoId;
        if (!id || videoMeta[id]) continue;
        allVideoIds.push(id);
        videoMeta[id] = {
          title: decodeHtmlEntities(item.snippet.title ?? ""),
          thumbnail: bestThumb(item.snippet.thumbnails ?? {}),
          publishedAt: item.snippet.publishedAt,
          videoUrl: `https://www.youtube.com/watch?v=${id}`,
        };
      }

      pageToken = playlistData.nextPageToken ?? undefined;
    } while (pageToken);

    // ── Step 3: also grab upcoming/live streams via search (playlist misses them) ─
    for (const eventType of ["upcoming", "live"]) {
      let sPageToken: string | undefined = undefined;
      let pages = 0;
      do {
        const tokenParam = sPageToken ? `&pageToken=${encodeURIComponent(sPageToken)}` : "";
        const searchUrl =
          `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&eventType=${eventType}&maxResults=50${tokenParam}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData?.error?.errors?.[0]?.reason === "quotaExceeded") break;
        if (!searchData?.items?.length) break;

        for (const item of searchData.items) {
          const id: string = item.id?.videoId;
          if (!id || videoMeta[id]) continue;
          allVideoIds.push(id);
          videoMeta[id] = {
            title: decodeHtmlEntities(item.snippet.title ?? ""),
            thumbnail: bestThumb(item.snippet.thumbnails ?? {}),
            publishedAt: item.snippet.publishedAt,
            videoUrl: `https://www.youtube.com/watch?v=${id}`,
          };
        }
        sPageToken = searchData.nextPageToken ?? undefined;
        pages++;
      } while (sPageToken && pages < 3);
    }

    // ── Step 4: enrich with full video details in batches of 50 ───────────────
    type VideoDetails = {
      duration: string; tags: string[]; description: string;
      isLiveStream: boolean; scheduledTime: string | null;
      actualStartTime: string | null; streamStatus: string | null;
      liveBroadcastContent: string;
    };
    const enriched: Record<string, VideoDetails> = {};

    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batch = allVideoIds.slice(i, i + 50);
      const statsUrl =
        `${BASE}/videos?part=snippet,contentDetails,statistics,status,liveStreamingDetails&id=${batch.join(",")}&key=${apiKey}`;
      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();

      if (statsData?.error?.errors?.[0]?.reason === "quotaExceeded") break;
      if (!statsData?.items) continue;

      for (const v of statsData.items) {
        if (v.status?.privacyStatus !== "public") continue;

        const live = v.liveStreamingDetails;
        const broadcastContent: string = v.snippet?.liveBroadcastContent ?? "none";
        const isLiveStream = !!(live || broadcastContent !== "none");

        let streamStatus: string | null = null;
        let scheduledTime: string | null = null;
        let actualStartTime: string | null = null;

        if (isLiveStream) {
          if (broadcastContent === "upcoming") {
            streamStatus = "upcoming";
            scheduledTime = live?.scheduledStartTime ?? null;
          } else if (broadcastContent === "live") {
            streamStatus = "live";
            scheduledTime = live?.scheduledStartTime ?? null;
            actualStartTime = live?.actualStartTime ?? null;
          } else if (live) {
            streamStatus = "completed";
            scheduledTime = live?.scheduledStartTime ?? null;
            actualStartTime = live?.actualStartTime ?? null;
          }
        }

        enriched[v.id] = {
          duration: v.contentDetails?.duration ? parseDuration(v.contentDetails.duration) : "",
          tags: inferTags(v.snippet?.title ?? "", v.snippet?.description ?? ""),
          description: decodeHtmlEntities(v.snippet?.description ?? ""),
          isLiveStream,
          scheduledTime,
          actualStartTime,
          streamStatus,
          liveBroadcastContent: broadcastContent,
        };
      }
    }

    // ── Step 5: upsert ─────────────────────────────────────────────────────────
    const videos = allVideoIds
      .filter((id) => enriched[id])
      .map((id) => ({
        id,
        title: videoMeta[id].title,
        description: enriched[id].description,
        thumbnail_url: videoMeta[id].thumbnail,
        video_url: videoMeta[id].videoUrl,
        published_at: videoMeta[id].publishedAt || null,
        duration: enriched[id].duration,
        tags: enriched[id].tags,
        is_live_stream: enriched[id].isLiveStream,
        scheduled_time: enriched[id].scheduledTime,
        actual_start_time: enriched[id].actualStartTime,
        stream_status: enriched[id].streamStatus,
      }));

    if (videos.length === 0) {
      return new Response(JSON.stringify({ ok: true, indexed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.rpc("upsert_video_index", { videos });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sync completed streams into past_streams table
    const completedStreams = videos.filter(
      (v) => v.is_live_stream && v.stream_status === "completed" && v.actual_start_time
    );
    if (completedStreams.length > 0) {
      const pastRows = completedStreams.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        thumbnail_url: v.thumbnail_url,
        video_url: v.video_url,
        actual_start_time: v.actual_start_time,
        tools: v.tags.length ? v.tags : ["Adobe Live"],
        host: "Adobe Live",
      }));
      await supabase.from("past_streams").upsert(pastRows, { onConflict: "id", ignoreDuplicates: false });
    }

    return new Response(JSON.stringify({
      ok: true,
      indexed: videos.length,
      live_streams: videos.filter((v) => v.is_live_stream).length,
      upcoming: videos.filter((v) => v.stream_status === "upcoming").length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
