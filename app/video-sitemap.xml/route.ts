import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAllVideoIndexForVideoSitemap } from "@/lib/video-index-pagination";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SITE_URL = "https://adobelive.com";

async function getAllIndexedVideos() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return await fetchAllVideoIndexForVideoSitemap(supabase);
  } catch {
    return [];
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const videos = await getAllIndexedVideos();

  const entries = videos
    .map((v) => {
      const pubDate = v.published_at ? new Date(v.published_at).toISOString() : "";
      // Point <loc> at the internal detail page so crawlers index our page,
      // not the YouTube URL directly. The video:player_loc still points to
      // the YouTube embed so Google can find and play the video.
      const internalUrl = `${SITE_URL}/videos/${v.id}`;
      return `
  <url>
    <loc>${escapeXml(internalUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(v.thumbnail_url)}</video:thumbnail_loc>
      <video:title>${escapeXml(v.title)}</video:title>
      <video:description>${escapeXml((v.description ?? "").slice(0, 2048))}</video:description>
      <video:player_loc>${escapeXml(`https://www.youtube.com/embed/${v.id}`)}</video:player_loc>
      ${v.duration ? `<video:duration>${isoDurationToSeconds(v.duration)}</video:duration>` : ""}
      ${pubDate ? `<video:publication_date>${pubDate}</video:publication_date>` : ""}
      ${(v.tags ?? []).length ? `<video:tag>${escapeXml((v.tags ?? []).join(", "))}</video:tag>` : ""}
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
    ${pubDate ? `<lastmod>${pubDate}</lastmod>` : ""}
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${SITE_URL}</loc>
    <video:video>
      <video:thumbnail_loc>${SITE_URL}/og-image.jpg</video:thumbnail_loc>
      <video:title>Adobe Live — Free Adobe Tutorials &amp; Live Creative Streams</video:title>
      <video:description>Watch free live Adobe tutorials on YouTube. Learn Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly &amp; more.</video:description>
      <video:player_loc>https://www.youtube.com/@AdobeLiveCommunity/live</video:player_loc>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>yes</video:live>
    </video:video>
  </url>${entries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

function isoDurationToSeconds(duration: string): number {
  // Handles "H:MM:SS" and "M:SS" formats stored in the DB
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
