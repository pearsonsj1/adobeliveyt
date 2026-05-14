import { createClient } from "@supabase/supabase-js";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import VideoLibrary from "@/components/adobe-live/VideoLibrary";
import { INDEX_ALL_VIDEOS_STALE_MS } from "@/lib/indexing-config";
import { getVideoIndexSampleForSeo, getVideoIndexTotalCount } from "@/lib/video-library";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

export const metadata = {
  title: "Video Library — Browse Every Adobe Live Tutorial",
  description: "Search and filter every Adobe Live video — Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly, and more. Shorts, tutorials, live replays, and full courses. All free.",
  alternates: {
    canonical: `${SITE_URL}/videos`,
  },
  openGraph: {
    type: "website" as const,
    url: `${SITE_URL}/videos`,
    title: "Video Library — Browse Every Adobe Live Tutorial",
    description: "Search and filter every Adobe Live video — Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly, and more.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Adobe Live Video Library" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Video Library — Browse Every Adobe Live Tutorial",
    description: "Search and filter every Adobe Live video. All free on YouTube.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const VALID_TOOLS = [
  "Photoshop", "Illustrator", "Premiere", "After Effects",
  "Lightroom", "Firefly", "Express", "InDesign", "Fresco", "Substance 3D",
];

interface PageProps {
  searchParams: { tool?: string };
}

/** Newest videos embedded in JSON-LD (full grid loads client-side from `/api/video-library`). */
const JSON_LD_VIDEO_SAMPLE = 80;

export default async function VideosPage({ searchParams }: PageProps) {
  const rawTool = searchParams.tool ?? "";
  const initialTool = VALID_TOOLS.find((t) => t.toLowerCase() === rawTool.toLowerCase()) ?? rawTool;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const hasSupabase = Boolean(supabaseUrl && anonKey);

  if (hasSupabase) {
    (async () => {
      try {
        const staleRes = await fetch(
          `${supabaseUrl}/rest/v1/video_index?select=last_seen_at&order=last_seen_at.asc&limit=1`,
          { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, cache: "no-store" },
        );
        if (staleRes.ok) {
          const rows = await staleRes.json() as { last_seen_at: string }[];
          const oldestSeen = rows[0]?.last_seen_at;
          const ageMs = oldestSeen ? Date.now() - new Date(oldestSeen).getTime() : Infinity;
          if (ageMs > INDEX_ALL_VIDEOS_STALE_MS) {
            fetch(`${supabaseUrl}/functions/v1/index-all-videos`, {
              method: "POST",
              headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
              cache: "no-store",
            }).catch(() => {});
          }
        }
      } catch { /* best-effort */ }
    })();
  }

  let totalIndexed = 0;
  let seoSample: Awaited<ReturnType<typeof getVideoIndexSampleForSeo>> = [];
  if (hasSupabase) {
    const supabase = createClient(supabaseUrl, anonKey);
    const [count, sample] = await Promise.all([
      getVideoIndexTotalCount(supabase),
      getVideoIndexSampleForSeo(supabase, JSON_LD_VIDEO_SAMPLE),
    ]);
    totalIndexed = count;
    seoSample = sample;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/videos#webpage`,
        url: `${SITE_URL}/videos`,
        name: "Video Library — Browse Every Adobe Live Tutorial",
        description: "Search and filter every Adobe Live video — Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly, and more.",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Video Library", item: `${SITE_URL}/videos` },
          ],
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ItemList",
        name: "Adobe Live Video Library",
        description: "Complete library of Adobe Live tutorials, live stream replays, shorts, and courses.",
        numberOfItems: totalIndexed,
        itemListElement: seoSample.map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "VideoObject",
            name: v.title,
            description: v.description?.slice(0, 200) || v.title,
            thumbnailUrl: v.thumbnail_url,
            uploadDate: v.published_at ?? undefined,
            url: v.video_url,
            embedUrl: `https://www.youtube.com/embed/${v.id}`,
            isAccessibleForFree: true,
            inLanguage: "en-US",
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
      <main>
        <VideoLibrary initialTool={initialTool} indexedTotal={totalIndexed} />
      </main>
      <SocialFooter />
    </div>
  );
}
