import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

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

const TOOLS = [
  { slug: "photoshop",    name: "Photoshop",    tag: "Photoshop",    color: "#31A8FF", desc: "Photo editing, compositing, retouching, and AI-powered design." },
  { slug: "illustrator",  name: "Illustrator",  tag: "Illustrator",  color: "#FF9A00", desc: "Vector illustration, logo design, and typography." },
  { slug: "premiere",     name: "Premiere Pro", tag: "Premiere",     color: "#9999FF", desc: "Video editing, color grading, and post-production workflows." },
  { slug: "after-effects",name: "After Effects",tag: "After Effects",color: "#9999FF", desc: "Motion graphics, visual effects, and animation." },
  { slug: "lightroom",    name: "Lightroom",    tag: "Lightroom",    color: "#31A8FF", desc: "Photo organization, editing, and color correction." },
  { slug: "firefly",      name: "Firefly",      tag: "Firefly",      color: "#FA0F00", desc: "Generative AI for images, vectors, and creative ideation." },
  { slug: "express",      name: "Adobe Express",tag: "Express",      color: "#FF9A00", desc: "Quick design for social media, flyers, and templates." },
  { slug: "indesign",     name: "InDesign",     tag: "InDesign",     color: "#FF3366", desc: "Layout design for print, editorial, and digital publishing." },
  { slug: "fresco",       name: "Fresco",       tag: "Fresco",       color: "#00C2A8", desc: "Digital painting and illustration on iPad and desktop." },
  { slug: "substance-3d", name: "Substance 3D", tag: "Substance 3D", color: "#FF6C37", desc: "3D texturing, materials, and rendering for designers." },
];

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
            <Link
              key={tool.slug}
              href={`/videos?tool=${encodeURIComponent(tool.tag)}`}
              className="group flex flex-col gap-3 p-5 rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `${tool.color}22`, border: `1px solid ${tool.color}44` }}>
                  <div className="w-full h-full rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 rounded-sm" style={{ background: tool.color }} />
                  </div>
                </div>
                <h2 className="font-bold text-white text-sm group-hover:text-white/90">{tool.name}</h2>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">{tool.desc}</p>
              <span className="text-xs font-semibold mt-auto" style={{ color: tool.color }}>Browse tutorials →</span>
            </Link>
          ))}
        </div>
      </main>
      <SocialFooter />
    </div>
  );
}
