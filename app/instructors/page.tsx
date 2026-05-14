import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { getInstructorSummaries, instructorProfilePath } from "@/lib/instructors";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

export const metadata: Metadata = {
  title: "Instructors — Adobe Live",
  description:
    "Meet the creative professionals teaching free Adobe Live courses — Photoshop, Illustrator, Premiere Pro, After Effects, Firefly, and more.",
  alternates: { canonical: `${SITE_URL}/instructors` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/instructors`,
    title: "Instructors — Adobe Live",
    description: "Creative professionals behind Adobe Live’s free multi-part courses.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Adobe Live instructors" }],
  },
};

export default async function InstructorsPage() {
  const instructors = await getInstructorSummaries();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Adobe Live instructors",
    description: "Instructors teaching free Adobe courses on Adobe Live.",
    url: `${SITE_URL}/instructors`,
    hasPart: instructors.map((i) => ({
      "@type": "Person",
      name: i.name,
      url: `${SITE_URL}${instructorProfilePath(i.name)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white/45">Instructors</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-gradient-to-b from-[#FA0F00] to-[#FF6B00] rounded-full" />
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Instructors</h1>
          <p className="text-white/50 text-base max-w-2xl">
            The hosts behind our structured courses — same names you see on course cards across the site. Browse
            their courses and follow playlists on YouTube.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {instructors.map((i) => (
            <Link
              key={i.slug}
              href={instructorProfilePath(i.name)}
              className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              {i.thumbnail ? (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={i.thumbnail}
                    alt=""
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-black text-lg tracking-tight drop-shadow-lg">{i.name}</p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {i.courseCount} course{i.courseCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-white font-black text-lg tracking-tight">{i.name}</p>
                  <p className="text-white/45 text-xs mt-1">
                    {i.courseCount} course{i.courseCount === 1 ? "" : "s"}
                  </p>
                </div>
              )}
              <div className="p-4 flex flex-wrap gap-1.5 mt-auto border-t border-white/8">
                {i.tools.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/8 text-white/55 border border-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SocialFooter />
    </div>
  );
}
