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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await getInstructorBySlug(params.slug);
  if (!row) return { title: "Instructor Not Found" };
  const title = `${row.name} — Adobe Live courses`;
  const desc = `Free Adobe courses with ${row.name} on Adobe Live — ${row.courses.length} structured playlist${
    row.courses.length === 1 ? "" : "s"
  } on YouTube.`;
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

  const { name, slug, courses } = row;
  const personId = `${SITE_URL}/instructors/${slug}#person`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name,
        url: `${SITE_URL}/instructors/${slug}`,
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
          <p className="text-white/50 text-base max-w-2xl">
            {courses.length} free multi-part course{courses.length === 1 ? "" : "s"} on Adobe Live — open any course
            for lesson links and transcripts, or jump straight to the full playlist on YouTube.
          </p>
        </header>

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
                <h2 className="text-base font-bold text-white group-hover:text-white/90 leading-snug flex-1">
                  {course.title}
                </h2>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/25 text-xs">{course.videoCount} lessons</span>
                  <span className="text-[#FA0F00] text-xs font-semibold">View course →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-white/30 text-sm">
          Looking for someone else?{" "}
          <Link href="/instructors" className="text-[#FA0F00] hover:underline">
            All instructors
          </Link>
        </p>
      </main>
      <SocialFooter />
    </div>
  );
}
