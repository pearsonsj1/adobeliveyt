import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Accept videoId via query param (GET) or JSON body (POST)
    let videoId: string | null = url.searchParams.get("videoId");
    if (!videoId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      videoId = body.videoId ?? null;
    }

    if (!videoId) {
      return new Response(JSON.stringify({ error: "videoId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Check if we already have a transcript (fetched within 30 days)
    const { data: existing } = await supabase
      .from("video_index")
      .select("transcript, transcript_fetched_at")
      .eq("id", videoId)
      .maybeSingle();

    if (existing?.transcript && existing.transcript_fetched_at) {
      const age = Date.now() - new Date(existing.transcript_fetched_at).getTime();
      if (age < 30 * 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ transcript: existing.transcript, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const transcript = await fetchYouTubeTranscript(videoId);

    // Persist to DB regardless of whether transcript was found (so we don't retry immediately)
    await supabase
      .from("video_index")
      .update({
        transcript: transcript ?? null,
        transcript_fetched_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    return new Response(JSON.stringify({ transcript: transcript ?? null, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Step 1: fetch the video page to get the timedtext URL
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    // Extract captionTracks from ytInitialPlayerResponse
    const match = html.match(/"captionTracks":\s*(\[.*?\])/s);
    if (!match) return null;

    let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>;
    try {
      tracks = JSON.parse(match[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"));
    } catch {
      return null;
    }

    if (!tracks.length) return null;

    // Prefer English auto-generated, then English manual, then first available
    const preferred =
      tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ??
      tracks.find((t) => t.languageCode === "en") ??
      tracks.find((t) => t.languageCode?.startsWith("en")) ??
      tracks[0];

    if (!preferred?.baseUrl) return null;

    // Step 2: fetch the timedtext XML
    const captionRes = await fetch(preferred.baseUrl);
    if (!captionRes.ok) return null;
    const xml = await captionRes.text();

    // Step 3: parse XML and extract plain text
    const textBlocks = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
    if (!textBlocks.length) return null;

    const raw = textBlocks
      .map(([, content]) =>
        content
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/<[^>]+>/g, "")
          .trim()
      )
      .filter(Boolean)
      .join(" ");

    // Collapse whitespace and deduplicate adjacent identical phrases
    return raw.replace(/\s+/g, " ").trim() || null;
  } catch {
    return null;
  }
}
