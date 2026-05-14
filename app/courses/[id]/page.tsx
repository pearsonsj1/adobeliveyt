import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { getCourses, getPlaylistVideos } from "@/lib/youtube";

export const revalidate = 3600;

const SITE_URL = "https://adobelive.com";

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const courses = await getCourses();
  const course = courses.find((c) => c.id === params.id);
  if (!course) return { title: "Not Found" };
  const desc = `Free Adobe ${course.tool} course taught by ${course.instructor} on Adobe Live. ${course.videoCount} lessons — completely free on YouTube.`;
  return {
    title: `${course.title} with ${course.instructor} — Adobe Live`,
    description: desc,
    alternates: { canonical: `${SITE_URL}/courses/${course.id}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/courses/${course.id}`,
      title: `${course.title} — Adobe Live`,
      description: desc,
      images: course.thumbnail ? [{ url: course.thumbnail, width: 1280, height: 720, alt: course.title }] : [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: course.title }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const courses = await getCourses();
  const course = courses.find((c) => c.id === params.id);
  if (!course) notFound();

  const videos = await getPlaylistVideos(course.playlistId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.title,
        description: `Free Adobe ${course.tool} course taught by ${course.instructor}. ${course.videoCount} lessons on YouTube.`,
        url: `${SITE_URL}/courses/${course.id}`,
        image: course.thumbnail,
        numberOfCredits: videos.length,
        educationalCredentialAwarded: "Certificate of Completion",
        instructor: { "@type": "Person", name: course.instructor },
        provider: { "@id": `${SITE_URL}/#organization` },
        isAccessibleForFree: true,
        inLanguage: "en-US",
        keywords: course.tags.join(", "),
      },
      {
        "@type": "CollectionPage",
        name: `${course.title} — Adobe Live`,
        url: `${SITE_URL}/courses/${course.id}`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Courses", item: `${SITE_URL}/courses` },
            { "@type": "ListItem", position: 3, name: course.title, item: `${SITE_URL}/courses/${course.id}` },
          ],
        },
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
          <Link href="/courses" className="hover:text-white/60 transition-colors">Courses</Link>
          <span>/</span>
          <span className="text-white/45 truncate max-w-[180px]">{course.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {course.thumbnail && (
            <div className="lg:w-72 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden border border-white/8 aspect-video lg:aspect-auto lg:h-48">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <div className="flex flex-col justify-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {course.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/8 text-white/50 border border-white/10">{t}</span>
              ))}
              <span className="text-white/25 text-xs">{videos.length || course.videoCount} lessons</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">{course.title}</h1>
            <p className="text-white/50 text-sm">
              Taught by <span className="text-white font-semibold">{course.instructor}</span>
            </p>
            <a
              href={course.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200 w-fit"
            >
              Watch Full Course ↗
            </a>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">Lessons loading — check back shortly.</div>
        ) : (
          <div className="space-y-2">
            {videos.map((v, i) => (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
              >
                <span className="text-white/25 font-black text-sm w-6 text-center flex-shrink-0">{i + 1}</span>
                <div className="relative w-24 aspect-video flex-shrink-0 rounded-lg overflow-hidden">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {v.duration && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">{v.duration}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 group-hover:text-white line-clamp-2 leading-snug transition-colors">{v.title}</p>
                  {v.publishedAt && <time className="text-[10px] text-white/25 mt-0.5 block">{formatDate(v.publishedAt)}</time>}
                </div>
                <span className="text-white/25 text-xs flex-shrink-0 hidden sm:block">Watch →</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SocialFooter />
    </div>
  );
}
