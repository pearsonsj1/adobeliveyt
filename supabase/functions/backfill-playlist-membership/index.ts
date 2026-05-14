import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * One-shot backfill: for every known tool / series / course / mobile-template playlist,
 * list YouTube playlistItems and merge each video id into `video_index.playlist_ids`.
 *
 * Secrets (Supabase → Edge Functions):
 *   YOUTUBE_API_KEY            — already used by youtube-proxy
 *   BACKFILL_PLAYLIST_SECRET   — long random string; required in header `x-backfill-secret`
 *
 * Invoke (replace host + keys):
 *   curl -sS -X POST \
 *     'https://<PROJECT_REF>.supabase.co/functions/v1/backfill-playlist-membership' \
 *     -H "Authorization: Bearer <SERVICE_ROLE_JWT>" \
 *     -H "x-backfill-secret: <BACKFILL_PLAYLIST_SECRET>"
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-backfill-secret",
};

/** All curated playlist ids from lib/youtube.ts (tools, series, ALOD courses, mobile templates). */
const PLAYLIST_IDS: string[] = [
  // Tools
  "PLMMOwZoEbhuwaTuOc60tRTsokYGTdEG39",
  "PLMMOwZoEbhuz4RamFC4qMOUXpHWZgyS3E",
  "PLMMOwZoEbhuyX2RL5LE8pThYxcwHjF8Mv",
  "PLMMOwZoEbhuw4NszLQhE9uX_IdD5rpWA0",
  "PLMMOwZoEbhuwMImBhitwZ6PhRQak0615K",
  "PLMMOwZoEbhuxPY2JftdLPXxIIcO7QRBu_",
  "PLMMOwZoEbhuwZ1J8GmHW19P8pylsT7Z2_",
  "PLMMOwZoEbhuzC6Mqvwovl8Y8ZeF6mXWtk",
  "PLMMOwZoEbhuwBffb0yYDkImol577KtqWI",
  "PLMMOwZoEbhuwXLF-GsAbSTcDwbJBsa_WZ",
  // Recurring series
  "PLMMOwZoEbhuwLunOhnaXOXzb0HKV97rdB",
  "PLMMOwZoEbhuzRyIncsXfVJypjhQ6K9ap_",
  "PLMMOwZoEbhuxxeB4psdkHW0Wa6Fpnut3Y",
  "PLMMOwZoEbhuzbfHjflwjqGKSgW9PqziJY",
  "PLMMOwZoEbhuy-cPYlB9_bUAwnyWi6wQ8s",
  "PLMMOwZoEbhuxWHHeBpBp9QX4R1ObvH0iA",
  // ALOD / instructor courses
  "PLMMOwZoEbhuxQKC6pFbFA3RFf9Lbw5ihP",
  "PLMMOwZoEbhuyt3azcxF5wsm-QYsIuJBc3",
  "PLMMOwZoEbhuyr_MCFH-H2RSwOKKSqaDcN",
  "PLMMOwZoEbhuymbswkrtT3xk1RdzsWx5TG",
  "PLMMOwZoEbhuxoPPvHfLYVfv9VCPmezV6T",
  "PLMMOwZoEbhuy1K5d9VuQI2f8nI1PkSg8S",
  "PLMMOwZoEbhuxDXQ-uVPSzyrUO75FuS8ag",
  "PLMMOwZoEbhuxNHXxjQOAK4NXtXk2XA2CQ",
  "PLMMOwZoEbhuzeHz0McFvDWPnKyWQklCle",
  "PLMMOwZoEbhuxHSfFSVZkTwUPAMRytAjJ1",
  "PLMMOwZoEbhuy18CNICklwQ7S8xL7Jqdli",
  "PLMMOwZoEbhuyEpqgKFu6H90kgxHeJgEsf",
  "PLMMOwZoEbhuzKw38xhKeJ2qjmXzb0zkyn",
  "PLMMOwZoEbhuysel2w6FDuTIjfD9c21Aju",
  "PLMMOwZoEbhuwpXwGuVkChKeoMaXoJlpKq",
  "PLMMOwZoEbhuw035aCDkvH0DN_OPuWqQeK",
  "PLMMOwZoEbhuxcHtPzILVAv59UV0Oe6myx",
  "PLMMOwZoEbhuw-bDGYfMyxKdGd1T4mJPO9",
  // Mobile templates rail
  "PLMMOwZoEbhuxurfqKv-ZEt95uOU63laIE",
];

const YT = "https://www.googleapis.com/youtube/v3";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const expected = Deno.env.get("BACKFILL_PLAYLIST_SECRET");
    if (!expected) {
      return new Response(JSON.stringify({ error: "BACKFILL_PLAYLIST_SECRET not set on project" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (req.headers.get("x-backfill-secret") !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const uniquePlaylists = [...new Set(PLAYLIST_IDS)];
    let rowsMerged = 0;
    const playlistErrors: { playlistId: string; message: string }[] = [];

    for (const playlistId of uniquePlaylists) {
      let pageToken: string | undefined;
      try {
        for (;;) {
          const u = new URL(`${YT}/playlistItems`);
          u.searchParams.set("part", "contentDetails");
          u.searchParams.set("playlistId", playlistId);
          u.searchParams.set("maxResults", "50");
          u.searchParams.set("key", apiKey);
          if (pageToken) u.searchParams.set("pageToken", pageToken);

          const ytRes = await fetch(u.toString());
          const ytJson = await ytRes.json() as {
            items?: Array<{ contentDetails?: { videoId?: string } }>;
            nextPageToken?: string;
            error?: { message?: string };
          };

          if (!ytRes.ok || ytJson.error) {
            throw new Error(ytJson.error?.message ?? `HTTP ${ytRes.status}`);
          }

          const ids = (ytJson.items ?? [])
            .map((i) => i.contentDetails?.videoId)
            .filter((x): x is string => typeof x === "string" && x.length > 0);

          if (ids.length > 0) {
            const { data, error } = await supabase.rpc("merge_playlist_for_video_ids", {
              p_playlist_id: playlistId,
              p_video_ids: ids,
            });
            if (error) throw new Error(error.message);
            rowsMerged += Number(data ?? 0);
          }

          pageToken = ytJson.nextPageToken;
          if (!pageToken) break;
          await new Promise((r) => setTimeout(r, 50));
        }
      } catch (e) {
        playlistErrors.push({ playlistId, message: String(e) });
      }
    }

    return new Response(
      JSON.stringify({
        ok: playlistErrors.length === 0,
        playlists: uniquePlaylists.length,
        rowsMerged,
        errors: playlistErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
