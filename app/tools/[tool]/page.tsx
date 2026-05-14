import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { fetchAllVideoIndexRows } from "@/lib/video-index-pagination";
import { isShortFormatVideo } from "@/lib/youtube";
import {
  getToolPlaylistConfigBySlug,
  indexTagFiltersForToolSlug,
  TOOL_PLAYLIST_CONFIG,
  youtubePlaylistUrl,
} from "@/lib/tool-playlists";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const TOOL_META: Record<string, { name: string; color: string; desc: string; tag: string }> = {
  "photoshop":    { name: "Photoshop",    color: "#31A8FF", tag: "Photoshop",    desc: "Photo editing, compositing, retouching, and AI-powered design with Adobe Photoshop." },
  "illustrator":  { name: "Illustrator",  color: "#FF9A00", tag: "Illustrator",  desc: "Vector illustration, logo design, and typography with Adobe Illustrator." },
  "premiere":     { name: "Premiere Pro", color: "#9999FF", tag: "Premiere",     desc: "Video editing, color grading, and professional post-production with Adobe Premiere Pro." },
  "after-effects":{ name: "After Effects",color: "#9999FF", tag: "After Effects",desc: "Motion graphics, visual effects, and animation with Adobe After Effects." },
  "lightroom":    { name: "Lightroom",    color: "#31A8FF", tag: "Lightroom",    desc: "Photo organization, editing, and color correction with Adobe Lightroom." },
  "firefly":      { name: "Firefly",      color: "#FA0F00", tag: "Firefly",      desc: "Generative AI for images, vectors, and creative ideation with Adobe Firefly." },
  "express":      { name: "Adobe Express",color: "#FF9A00", tag: "Express",      desc: "Quick design for social media, flyers, and templates with Adobe Express." },
  "indesign":     { name: "InDesign",     color: "#FF3366", tag: "InDesign",     desc: "Layout design for print, editorial, and digital publishing with Adobe InDesign." },
  "fresco":       { name: "Fresco",       color: "#00C2A8", tag: "Fresco",       desc: "Digital painting and illustration with Adobe Fresco." },
  "substance-3d": { name: "Substance 3D", color: "#FF6C37", tag: "Substance 3D", desc: "3D texturing, materials, and rendering with Adobe Substance 3D." },
};

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  published_at: string | null;
  duration: string;
  tags: string[];
  description: string;
}

export async function generateStaticParams() {
  return TOOL_PLAYLIST_CONFIG.map((c) => ({ tool: c.slug }));
}

export async function generateMetadata({ params }: { params: { tool: string } }): Promise<Metadata> {
  const meta = TOOL_META[params.tool];
  if (!meta) return { title: "Not Found" };
  return {
    title: `${meta.name} Tutorials — Adobe Live`,
    description: `Free ${meta.name} tutorials from Adobe Live. ${meta.desc}`,
    alternates: { canonical: `${SITE_URL}/tools/${params.tool}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/tools/${params.tool}`,
      title: `${meta.name} Tutorials — Adobe Live`,
      description: `Free ${meta.name} tutorials from Adobe Live. ${meta.desc}`,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: `${meta.name} Tutorials` }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function mergeVideoRowsById<T extends { id: string; published_at: string | null }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of rows) {
    if (!byId.has(r.id)) byId.set(r.id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
  );
}

export default async function ToolPage({ params }: { params: { tool: string } }) {
  const meta = TOOL_META[params.tool];
  if (!meta) notFound();

  const playlistCfg = getToolPlaylistConfigBySlug(params.tool);
  const officialPlaylistUrl = playlistCfg ? youtubePlaylistUrl(playlistCfg.playlistId) : null;

  type VideoRow = {
    id: string;
    title: string;
    thumbnail_url: string;
    video_url: string;
    published_at: string | null;
    duration: string | null;
    tags: string[] | null;
    description: string | null;
  };
  const selectCols = "id, title, thumbnail_url, video_url, published_at, duration, tags, description";
  const streamOr = "stream_status.is.null,stream_status.neq.upcoming";

  let rows: VideoRow[] = [];
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const combined: VideoRow[] = [];

    for (const tag of indexTagFiltersForToolSlug(params.tool, meta.tag)) {
      const part = await fetchAllVideoIndexRows<VideoRow>((rangeFrom, rangeTo) =>
        supabase
          .from("video_index")
          .select(selectCols)
          .eq("is_live_stream", false)
          .or(streamOr)
          .contains("tags", [tag])
          .order("published_at", { ascending: false })
          .range(rangeFrom, rangeTo),
      );
      combined.push(...part);
    }

    if (playlistCfg) {
      const byPlaylist = await fetchAllVideoIndexRows<VideoRow>((rangeFrom, rangeTo) =>
        supabase
          .from("video_index")
          .select(selectCols)
          .eq("is_live_stream", false)
          .or(streamOr)
          .contains("playlist_ids", [playlistCfg.playlistId])
          .order("published_at", { ascending: false })
          .range(rangeFrom, rangeTo),
      );
      combined.push(...byPlaylist);
    }

    rows = mergeVideoRowsById(combined);
  }

  const videos: Video[] = rows
    .map((v) => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      video_url: v.video_url,
      published_at: v.published_at,
      duration: v.duration ?? "",
      tags: v.tags ?? [],
      description: v.description ?? "",
    }))
    .filter((v) => !isShortFormatVideo({ duration: v.duration, videoUrl: v.video_url }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${meta.name} Tutorials — Adobe Live`,
        description: `Free ${meta.name} tutorials from Adobe Live. ${meta.desc}`,
        url: `${SITE_URL}/tools/${params.tool}`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools` },
            { "@type": "ListItem", position: 3, name: meta.name, item: `${SITE_URL}/tools/${params.tool}` },
          ],
        },
      },
      {
        "@type": "ItemList",
        name: `${meta.name} Tutorials`,
        numberOfItems: videos.length,
        itemListElement: videos.slice(0, 50).map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "VideoObject",
            name: v.title,
            thumbnailUrl: v.thumbnail_url,
            uploadDate: v.published_at,
            url: `${SITE_URL}/videos/${v.id}`,
            embedUrl: `https://www.youtube.com/embed/${v.id}`,
            isAccessibleForFree: true,
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-white/60 transition-colors">Tools</Link>
          <span>/</span>
          <span className="text-white/45">{meta.name}</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: meta.color }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: meta.color }}>{meta.name}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">{meta.name} Tutorials</h1>
          <p className="text-white/50 text-base max-w-xl">{meta.desc}</p>
          {officialPlaylistUrl && (
            <a
              href={officialPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-3 text-sm font-semibold hover:underline"
              style={{ color: meta.color }}
            >
              Official {meta.name} playlist on YouTube →
            </a>
          )}
          <p className="text-white/30 text-sm mt-2">{videos.length} free video{videos.length !== 1 ? "s" : ""}</p>
        </div>

        {videos.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <p className="text-white/40 text-sm leading-relaxed">
              No videos for this tool are in your Supabase index yet. After{" "}
              <code className="text-white/55">index-all-videos</code> runs (and optionally{" "}
              <code className="text-white/55">backfill-playlist-membership</code> so playlist membership is stored), videos
              tagged{" "}
              <span className="text-white/55">{indexTagFiltersForToolSlug(params.tool, meta.tag).join(" · ")}</span>
              {" "}or in the official YouTube playlist for this tool will appear here.
            </p>
            <Link
              href={`/videos?tool=${encodeURIComponent(meta.tag)}`}
              className="inline-flex text-[#FA0F00] text-sm font-semibold hover:underline"
            >
              Open full video library with this filter →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  {v.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">{v.duration}</span>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  <h2 className="text-sm font-semibold text-white/85 leading-snug line-clamp-2 group-hover:text-white transition-colors">{v.title}</h2>
                  {v.published_at && <time className="text-[10px] text-white/25">{formatDate(v.published_at)}</time>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SocialFooter />
    </div>
  );
}
