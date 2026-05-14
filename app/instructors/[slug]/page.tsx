import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { getInstructorBySlug, getInstructorSummaries } from "@/lib/instructors";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

export async function generateStaticParams() {
  const rows = await getInstructorSummaries();
  return rows.map((r) => ({ slug: r.slug }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await getInstructorBySlug(params.slug);
  if (!row) return { title: "Instructor Not Found" };
  const title = `${row.name} — Adobe Live`;
  const desc = `Courses, sessions, and tutorials with ${row.name} on Adobe Live — ${row.courses.length} structured playlist${
    row.courses.length === 1 ? "" : "s"
  }, plus ${row.appearances.length} indexed video${row.appearances.length === 1 ? "" : "s"} where they appear in titles or descriptions.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE_URL}/instructors/${row.slug}` },
    openGraph: {
      type: "profile",
      url: `${SITE_URL}/instructors/${row.slug}`,
      title,
      description: desc,
      images: row.courses[0]?.thumbnail
        ? [{ url: row.courses[0].thumbnail, width: 1280, height: 720, alt: row.name }]
        : [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: row.name }],
    },
  };
}

export default async function InstructorDetailPage({ params }: { params: { slug: string } }) {
  const row = await getInstructorBySlug(params.slug);
  if (!row) notFound();

  const { name, slug, courses, appearances, profileLinks, highlights } = row;
  const personId = `${SITE_URL}/instructors/${slug}#person`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name,
        url: `${SITE_URL}/instructors/${slug}`,
        ...(profileLinks.length > 0 ? { sameAs: profileLinks.map((l) => l.url) } : {}),
      },
      {
        "@type": "ItemList",
        name: `Courses with ${name}`,
        itemListElement: courses.map((c, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Course",
            name: c.title,
            url: `${SITE_URL}/courses/${c.id}`,
            instructor: { "@id": personId },
            provider: { "@id": `${SITE_URL}/#organization` },
          },
        })),
      },
      ...(appearances.length > 0
        ? [
            {
              "@type": "ItemList",
              name: `Videos featuring ${name}`,
              numberOfItems: appearances.length,
              itemListElement: appearances.slice(0, 40).map((v, i) => ({
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
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Instructors", item: `${SITE_URL}/instructors` },
          { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/instructors/${slug}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/30 flex-wrap">
          <Link href="/" className="hover:text-white/60 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/instructors" className="hover:text-white/60 transition-colors">
            Instructors
          </Link>
          <span>/</span>
          <span className="text-white/45 truncate max-w-[200px]">{name}</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">{name}</h1>
          <p className="text-white/50 text-base max-w-2xl leading-relaxed">
            {courses.length} free multi-part course{courses.length === 1 ? "" : "s"} on Adobe Live, plus{" "}
            <span className="text-white/65">
              {appearances.length} indexed session{appearances.length === 1 ? "" : "s"}
            </span>{" "}
            where their name appears in the title or description (guest spots, co-hosts, challenges, and more). Open any
            tile for transcripts and related links, or jump to YouTube from the video page.
          </p>
        </header>

        {profileLinks.length > 0 && (
          <section className="mb-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 mb-4">Links from descriptions</h2>
            <p className="text-white/40 text-sm mb-4 max-w-2xl leading-relaxed">
              URLs detected in indexed video descriptions (social profiles, portfolios, link-in-bio tools). Adobe and
              stock links are filtered out.
            </p>
            <ul className="flex flex-wrap gap-2">
              {profileLinks.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/85 hover:border-[#FA0F00]/35 hover:bg-[#FA0F00]/[0.06] transition-colors"
                  >
                    <span className="text-[#FA0F00]/90">{l.label}</span>
                    <span className="text-white/35 truncate max-w-[200px]">{l.url.replace(/^https?:\/\//, "")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 mb-3">From video descriptions</h2>
            <ul className="space-y-3 max-w-3xl">
              {highlights.map((line, i) => (
                <li
                  key={i}
                  className="text-sm text-white/45 leading-relaxed border-l-2 border-[#FA0F00]/30 pl-4"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {courses.length > 0 && (
          <section className="mb-14">
            <h2 className="text-lg font-bold text-white mb-5 tracking-tight">Courses they teach</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  {course.thumbnail && (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-[1.03] transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-1.5">
                        {course.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white border border-white/20"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <h3 className="text-base font-bold text-white group-hover:text-white/90 leading-snug flex-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/25 text-xs">{course.videoCount} lessons</span>
                      <span className="text-[#FA0F00] text-xs font-semibold">View course →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight">All indexed appearances</h2>
          <p className="text-white/40 text-sm mb-5 max-w-2xl leading-relaxed">
            Includes every replay in your <code className="text-white/50 text-xs">video_index</code> whose title or
            description mentions this name (including guest episodes). Lesson rows that are part of their Adobe Live
            courses are tagged &quot;Course&quot;.
          </p>
          {appearances.length === 0 ? (
            <p className="text-white/35 text-sm py-10 border border-white/8 rounded-xl px-6 bg-white/[0.02]">
              No matching videos yet. After <code className="text-white/50">index-all-videos</code> has populated{" "}
              <code className="text-white/50">video_index</code>, sessions that mention {name} in metadata will show
              here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {appearances.map((v) => (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="group flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={v.thumbnail_url}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    {v.duration && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                        {v.duration}
                      </span>
                    )}
                    {v.inCoursePlaylist && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FA0F00]/90 text-white border border-white/20">
                        Course
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold text-white/85 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {v.title}
                    </h3>
                    {v.published_at && (
                      <time className="text-[10px] text-white/25">{formatDate(v.published_at)}</time>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="mt-12 text-center text-white/30 text-sm">
          Looking for someone else?{" "}
          <Link href="/instructors" className="text-[#FA0F00] hover:underline">
            All instructors
          </Link>
          {" · "}
          <Link href="/videos" className="text-[#FA0F00] hover:underline">
            Video library
          </Link>
        </p>
      </main>
      <SocialFooter />
    </div>
  );
}
