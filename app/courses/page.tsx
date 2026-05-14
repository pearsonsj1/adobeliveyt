import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import { getCourses } from "@/lib/youtube";
import { instructorProfilePath } from "@/lib/instructors";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";

export const metadata: Metadata = {
  title: "Free Adobe Courses — Adobe Live",
  description: "Free multi-part Adobe courses taught by world-class creative professionals on Adobe Live. Learn Photoshop, Illustrator, Premiere, Firefly, Substance 3D, and more with structured video series.",
  alternates: { canonical: `${SITE_URL}/courses` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/courses`,
    title: "Free Adobe Courses — Adobe Live",
    description: "Free multi-part Adobe courses from world-class creative professionals. Photoshop, Illustrator, Premiere, Firefly & more.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Free Adobe Courses — Adobe Live" }],
  },
};

export default async function CoursesPage() {
  const courses = await getCourses();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Adobe Courses — Adobe Live",
    description: "Free multi-part Adobe courses from world-class creative professionals.",
    url: `${SITE_URL}/courses`,
    hasPart: courses.map((c) => ({
      "@type": "Course",
      name: c.title,
      url: `${SITE_URL}/courses/${c.id}`,
      instructor: {
        "@type": "Person",
        name: c.instructor,
        url: `${SITE_URL}${instructorProfilePath(c.instructor)}`,
      },
      provider: { "@id": `${SITE_URL}/#organization` },
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
          <span className="text-white/45">Courses</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-gradient-to-b from-[#FA0F00] to-[#FF6B00] rounded-full" />
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Free Adobe Courses</h1>
          <p className="text-white/50 text-base max-w-xl">Structured multi-part courses taught by world-class creative professionals — completely free on YouTube.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              {course.thumbnail && (
                <div className="relative aspect-video overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-[1.03] transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {course.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white border border-white/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-5 flex flex-col gap-2 flex-1">
                <Link
                  href={instructorProfilePath(course.instructor)}
                  className="text-white/40 text-xs font-semibold uppercase tracking-wide hover:text-white/70 transition-colors"
                >
                  {course.instructor}
                </Link>
                <h2 className="text-base font-bold text-white group-hover:text-white/90 leading-snug flex-1">{course.title}</h2>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/25 text-xs">{course.videoCount} lessons</span>
                  <span className="text-[#FA0F00] text-xs font-semibold">Start course →</span>
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
