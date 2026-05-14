import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { TOOL_PLAYLIST_CONFIG, youtubePlaylistUrl } from "@/lib/tool-playlists";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

const TOOLS = TOOL_PLAYLIST_CONFIG.map((t) => ({
  slug: t.slug,
  name: t.name,
  abbr: t.abbr,
  color: t.color,
  desc: t.desc,
  playlistUrl: youtubePlaylistUrl(t.playlistId),
}));

export const metadata: Metadata = {
  title: "Browse by Adobe Tool — Photoshop, Illustrator, Premiere & More",
  description: "Find every Adobe Live tutorial organized by tool. Browse free videos for Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly, Express, InDesign, Fresco, and Substance 3D.",
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/tools`,
    title: "Browse by Adobe Tool",
    description: "Find every Adobe Live tutorial organized by tool — Photoshop, Illustrator, Premiere, After Effects, Lightroom, Firefly & more.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Browse Adobe Live by Tool" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Browse Adobe Live by Tool",
  description: "Find every Adobe Live tutorial organized by Adobe tool.",
  url: `${SITE_URL}/tools`,
  hasPart: TOOLS.map((t) => ({
    "@type": "WebPage",
    name: `${t.name} Tutorials — Adobe Live`,
    url: `${SITE_URL}/tools/${t.slug}`,
  })),
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white/45">Tools</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-gradient-to-b from-[#FA0F00] to-[#FF6B00] rounded-full" />
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Browse by Tool</h1>
          <p className="text-white/50 text-base max-w-xl">Every tutorial sorted by the Adobe tool it covers. Pick your app and start learning.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <div
              key={tool.slug}
              className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
            >
              <Link
                href={`/tools/${tool.slug}`}
                className="flex flex-col gap-3 p-5 flex-1 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center border"
                    style={{
                      background: `${tool.color}18`,
                      borderColor: `${tool.color}44`,
                    }}
                    aria-hidden
                  >
                    <span
                      className="text-[11px] font-black tracking-tight leading-none"
                      style={{ color: tool.color }}
                    >
                      {tool.abbr}
                    </span>
                  </div>
                  <h2 className="font-bold text-white text-sm group-hover:text-white/90">{tool.name}</h2>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">{tool.desc}</p>
                <span className="text-xs font-semibold mt-auto" style={{ color: tool.color }}>Browse tutorials →</span>
              </Link>
              <a
                href={tool.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 text-xs font-semibold border-t border-white/8 text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
                style={{ borderTopColor: `${tool.color}22` }}
              >
                Official YouTube playlist →
              </a>
            </div>
          ))}
        </div>
      </main>
      <SocialFooter />
    </div>
  );
}
