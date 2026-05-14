import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { getRecurringSeries } from "@/lib/youtube";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

export const metadata: Metadata = {
  title: "Shows & Series — Adobe Live",
  description: "All recurring shows and series on Adobe Live — File New, Office Hours, On the Spot, Cinema Collective, Education Edition and more. Weekly live shows, creative discussions, and design challenges.",
  alternates: { canonical: `${SITE_URL}/series` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/series`,
    title: "Shows & Series — Adobe Live",
    description: "All recurring Adobe Live shows: File New, Office Hours, On the Spot, Cinema Collective, and more.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Adobe Live Shows & Series" }],
  },
};

export default async function SeriesListPage() {
  const series = await getRecurringSeries();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shows & Series — Adobe Live",
    description: "All recurring shows and series from Adobe Live on YouTube.",
    url: `${SITE_URL}/series`,
    hasPart: series.map((s) => ({
      "@type": "WebPage",
      name: `${s.title} — Adobe Live`,
      url: `${SITE_URL}/series/${s.id}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white/45">Series</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-gradient-to-b from-[#FA0F00] to-[#FF6B00] rounded-full" />
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Shows & Series</h1>
          <p className="text-white/50 text-base max-w-xl">Recurring shows broadcast live on YouTube every week — news, design challenges, industry discussions, and more.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {series.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.id}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              {s.thumbnail && (
                <div className="relative aspect-video overflow-hidden">
                  <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-[1.03] transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/15 text-white border border-white/20 uppercase tracking-wide">{s.cadence}</span>
                  </div>
                </div>
              )}
              <div className="p-5 flex flex-col gap-2 flex-1">
                <h2 className="text-base font-bold text-white group-hover:text-white/90 leading-snug">{s.title}</h2>
                <p className="text-white/45 text-xs leading-relaxed line-clamp-3 flex-1">{s.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/25 text-xs">{s.videoCount} episodes</span>
                  <span className="text-[#FA0F00] text-xs font-semibold">Watch series →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SocialFooter />
    </div>
  );
}
