import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.36";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// All recognizable Adobe apps + recurring series names that appear in thumbnails
const KNOWN_TAGS = [
  // Adobe tools
  "Photoshop", "Illustrator", "After Effects", "Premiere", "Lightroom",
  "Firefly", "Express", "InDesign", "Fresco", "Substance", "Acrobat",
  "Dimension", "Animate", "Dreamweaver", "XD",
  // Recurring series (logos / title cards visible in thumbnail)
  "File New", "Office Hours", "On the Spot", "Feature Friday",
  "Cinema Collective", "Studio Sessions", "The Unlock", "Brand Slam",
];

const SYSTEM_PROMPT = `You are a video thumbnail analyst for the Adobe Live YouTube channel.
Your job is to identify which Adobe applications and recurring show series are visually present in a thumbnail image.

Known tags to detect:
${KNOWN_TAGS.join(", ")}

Rules:
- Only return tags from the known list above.
- Look for app UI, logos, splash screens, application windows, tool panels, or series title cards in the image.
- Do NOT guess from text that names an app — only tag if the app's interface or logo is actually visible in the thumbnail.
- If a series logo/title card (e.g. "Office Hours", "On the Spot") is visible, include it.
- Return ONLY a JSON array of matching tag strings, e.g. ["Photoshop", "Firefly"] or [] if none match.
- Never return tags outside the known list.`;

async function tagThumbnail(
  client: Anthropic,
  thumbnailUrl: string,
): Promise<string[]> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: thumbnailUrl },
            },
            {
              type: "text",
              text: "What Adobe applications or show series are visually present in this thumbnail? Return a JSON array.",
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Extract JSON array from response
    const match = text.match(/\[.*?\]/s);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    // Filter to only known tags
    return parsed.filter((t: unknown) => typeof t === "string" && KNOWN_TAGS.includes(t));
  } catch {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Parse optional params: limit how many to process per call, offset for batching
    let limit = 50;
    let offset = 0;
    let onlyUntagged = true;
    try {
      const body = await req.json();
      if (typeof body.limit === "number") limit = Math.min(body.limit, 200);
      if (typeof body.offset === "number") offset = body.offset;
      if (typeof body.only_untagged === "boolean") onlyUntagged = body.only_untagged;
    } catch { /* no body */ }

    // Fetch videos to tag
    let query = supabase
      .from("video_index")
      .select("id, title, thumbnail_url, tags")
      .neq("thumbnail_url", "")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (onlyUntagged) {
      // Only process videos where tags is empty or just ["Adobe Live"]
      query = query.or("tags.eq.{},tags.eq.{Adobe Live}");
    }

    const { data: videos, error: fetchError } = await query;
    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!videos?.length) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, message: "No videos to tag" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Process in small concurrent batches to stay within rate limits
    const CONCURRENCY = 5;
    let processed = 0;
    let tagged = 0;

    for (let i = 0; i < videos.length; i += CONCURRENCY) {
      const batch = videos.slice(i, i + CONCURRENCY);

      await Promise.all(
        batch.map(async (video) => {
          const newTags = await tagThumbnail(anthropic, video.thumbnail_url);
          processed++;

          // Only update if we got tags back
          if (newTags.length > 0) {
            await supabase
              .from("video_index")
              .update({ tags: newTags, last_seen_at: new Date().toISOString() })
              .eq("id", video.id);
            tagged++;
          }
        }),
      );

      // Small delay between batches to be kind to the API
      if (i + CONCURRENCY < videos.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed, tagged, offset, limit }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
