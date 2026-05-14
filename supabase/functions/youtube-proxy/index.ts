import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CHANNEL_ID = "UCVMJPRXrBIOFDBZEaF-_pEA";
const BASE = "https://www.googleapis.com/youtube/v3";

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

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint param" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ytUrl: string;

    switch (endpoint) {
      case "live": {
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&maxResults=3&key=${apiKey}`;
        break;
      }
      case "upcoming": {
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&eventType=upcoming&type=video&order=date&maxResults=8&key=${apiKey}`;
        break;
      }
      case "recent": {
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&maxResults=20&key=${apiKey}`;
        break;
      }
      case "popular": {
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=viewCount&maxResults=15&publishedAfter=${sixMonthsAgo}&key=${apiKey}`;
        break;
      }
      case "videos_stats": {
        const ids = url.searchParams.get("ids");
        if (!ids) {
          return new Response(JSON.stringify({ error: "Missing ids param" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ytUrl = `${BASE}/videos?part=snippet,statistics,contentDetails,status&id=${ids}&key=${apiKey}`;
        break;
      }
      case "live_stats": {
        const ids = url.searchParams.get("ids");
        if (!ids) {
          return new Response(JSON.stringify({ error: "Missing ids param" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ytUrl = `${BASE}/videos?part=snippet,liveStreamingDetails,statistics&id=${ids}&key=${apiKey}`;
        break;
      }
      case "playlists": {
        ytUrl = `${BASE}/playlists?part=snippet,contentDetails&channelId=${CHANNEL_ID}&maxResults=50&key=${apiKey}`;
        break;
      }
      case "playlists_by_ids": {
        const ids = url.searchParams.get("ids");
        if (!ids) {
          return new Response(JSON.stringify({ error: "Missing ids param" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ytUrl = `${BASE}/playlists?part=snippet,contentDetails&id=${ids}&key=${apiKey}`;
        break;
      }
      case "channel": {
        ytUrl = `${BASE}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${apiKey}`;
        break;
      }
      case "playlist_videos": {
        const playlistId = url.searchParams.get("playlistId");
        if (!playlistId) {
          return new Response(JSON.stringify({ error: "Missing playlistId param" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Fetch up to 20 playlist items (videoIds + titles + thumbnails)
        ytUrl = `${BASE}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=20&key=${apiKey}`;
        break;
      }
      case "playlist_video_stats": {
        const ids = url.searchParams.get("ids");
        if (!ids) {
          return new Response(JSON.stringify({ error: "Missing ids param" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ytUrl = `${BASE}/videos?part=snippet,statistics,contentDetails,status&id=${ids}&key=${apiKey}`;
        break;
      }
      case "playlist_info": {
        const playlistId = url.searchParams.get("playlistId");
        if (!playlistId) {
          return new Response(JSON.stringify({ error: "Missing playlistId param" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ytUrl = `${BASE}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`;
        break;
      }
      case "shorts": {
        // Fetch recent videos then filter client-side to ≤60s (videoDuration=short covers ≤4min, so we filter by duration after)
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&videoDuration=short&order=date&maxResults=20&key=${apiKey}`;
        break;
      }
      case "channel_videos": {
        // Paginated fetch of all channel videos, ordered by date
        const pageToken = url.searchParams.get("pageToken");
        const pageTokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&maxResults=50${pageTokenParam}&key=${apiKey}`;
        break;
      }
      case "past_streams": {
        // Fetch completed broadcasts from this channel ordered by date
        ytUrl = `${BASE}/search?part=snippet&channelId=${CHANNEL_ID}&eventType=completed&type=video&order=date&maxResults=20&key=${apiKey}`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown endpoint" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const res = await fetch(ytUrl);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
