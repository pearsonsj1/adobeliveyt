import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { getRecurringSeries, getPlaylistVideos, SERIES_PLAYLIST_CACHE_TTL_MS } from "@/lib/youtube";

/** Daily ISR; playlist reads use the same ~24h `youtube_cache` TTL as other catalog data. */
export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

export async function generateStaticParams() {
  const series = await getRecurringSeries();
  return series.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const series = await getRecurringSeries();
  const show = series.find((s) => s.id === params.slug);
  if (!show) return { title: "Not Found" };
  return {
    title: `${show.title} — Adobe Live`,
    description: show.description,
    alternates: { canonical: `${SITE_URL}/series/${show.id}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/series/${show.id}`,
      title: `${show.title} — Adobe Live`,
      description: show.description,
      images: show.thumbnail ? [{ url: show.thumbnail, width: 1280, height: 720, alt: show.title }] : [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: show.title }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function SeriesDetailPage({ params }: { params: { slug: string } }) {
  const series = await getRecurringSeries();
  const show = series.find((s) => s.id === params.slug);
  if (!show) notFound();

  const videos = await getPlaylistVideos(show.playlistId, SERIES_PLAYLIST_CACHE_TTL_MS);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TVSeries",
        name: show.title,
        description: show.description,
        url: `${SITE_URL}/series/${show.id}`,
        image: show.thumbnail,
        numberOfEpisodes: videos.length,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "CollectionPage",
        name: `${show.title} — Adobe Live`,
        url: `${SITE_URL}/series/${show.id}`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Series", item: `${SITE_URL}/series` },
            { "@type": "ListItem", position: 3, name: show.title, item: `${SITE_URL}/series/${show.id}` },
          ],
        },
      },
      ...(videos.length > 0 ? [{
        "@type": "ItemList",
        name: `${show.title} Episodes`,
        numberOfItems: videos.length,
        itemListElement: videos.slice(0, 50).map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "VideoObject",
            name: v.title,
            thumbnailUrl: v.thumbnail,
            uploadDate: v.publishedAt,
            url: `${SITE_URL}/videos/${v.id}`,
            embedUrl: `https://www.youtube.com/embed/${v.id}`,
            isAccessibleForFree: true,
          },
        })),
      }] : []),
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
          <Link href="/series" className="hover:text-white/60 transition-colors">Series</Link>
          <span>/</span>
          <span className="text-white/45">{show.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {show.thumbnail && (
            <div className="lg:w-72 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden border border-white/8 aspect-video lg:aspect-auto lg:h-48">
                <img src={show.thumbnail} alt={show.title} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <div className="flex flex-col justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/8 text-white/50 border border-white/10 uppercase tracking-wide">{show.cadence}</span>
              <span className="text-white/30 text-xs">{videos.length} episodes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">{show.title}</h1>
            <p className="text-white/55 text-sm leading-relaxed max-w-2xl">{show.description}</p>
            <a
              href={show.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200 w-fit"
            >
              Watch Full Playlist ↗
            </a>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">No episodes loaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  {v.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">{v.duration}</span>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  <h2 className="text-sm font-semibold text-white/85 leading-snug line-clamp-2 group-hover:text-white transition-colors">{v.title}</h2>
                  {v.publishedAt && <time className="text-[10px] text-white/25">{formatDate(v.publishedAt)}</time>}
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
