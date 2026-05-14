import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import CourseDetailClient from "@/components/adobe-live/CourseDetailClient";
import { getCourses, getPlaylistVideos } from "@/lib/youtube";
import { instructorProfilePath } from "@/lib/instructors";

export const revalidate = 86400;

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
        instructor: {
          "@type": "Person",
          name: course.instructor,
          url: `${SITE_URL}${instructorProfilePath(course.instructor)}`,
        },
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
          <Link href="/" className="hover:text-white/60 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-white/60 transition-colors">
            Courses
          </Link>
          <span>/</span>
          <span className="text-white/45 truncate max-w-[180px]">{course.title}</span>
        </nav>

        <CourseDetailClient course={course} videos={videos} />
      </main>
      <SocialFooter />
    </div>
  );
}
