import { getSchedule, getPastStreams } from "@/lib/youtube";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import ScheduleCalendar from "@/components/adobe-live/ScheduleCalendar";
import type { Metadata } from "next";

const SITE_URL = "https://adobelive.com";

export const metadata: Metadata = {
  title: "Stream Schedule — Upcoming Adobe Live Sessions",
  description: "Full monthly calendar of upcoming and past Adobe Live streams. See what's scheduled, who's hosting, and which Adobe tools are featured — Photoshop, Illustrator, Premiere, After Effects, Firefly & more.",
  alternates: { canonical: `${SITE_URL}/schedule` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/schedule`,
    title: "Stream Schedule — Upcoming Adobe Live Sessions",
    description: "See when Adobe Live streams next. Full calendar of upcoming and past sessions with hosts and featured tools.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Adobe Live Stream Schedule" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stream Schedule — Upcoming Adobe Live Sessions",
    description: "See when Adobe Live streams next. Full calendar of upcoming and past sessions.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export const revalidate = 3600 * 4; // 4 hours

export default async function SchedulePage() {
  const [schedule, pastStreams] = await Promise.all([
    getSchedule(),
    getPastStreams(),
  ]);

  // Build Event JSON-LD for each upcoming stream so crawlers can index event data
  const upcomingEvents = schedule
    .filter((s) => !s.isLive && s.scheduledTime)
    .slice(0, 20)
    .map((s) => ({
      "@type": "Event",
      name: s.title,
      description: s.description || `Live Adobe tutorial on YouTube — ${s.title}`,
      startDate: s.scheduledTime,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url: s.videoUrl ?? "https://www.youtube.com/@AdobeLiveCommunity/live",
      },
      organizer: { "@id": `${SITE_URL}/#organization` },
      image: s.thumbnail ?? `${SITE_URL}/og-image.jpg`,
      url: s.videoUrl ?? "https://www.youtube.com/@AdobeLiveCommunity/live",
      isAccessibleForFree: true,
      inLanguage: "en-US",
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/schedule#webpage`,
        url: `${SITE_URL}/schedule`,
        name: "Stream Schedule — Upcoming Adobe Live Sessions",
        description: "Full monthly calendar of upcoming and past Adobe Live streams.",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Schedule", item: `${SITE_URL}/schedule` },
          ],
        },
        inLanguage: "en-US",
      },
      ...(upcomingEvents.length > 0 ? [{
        "@type": "ItemList",
        name: "Upcoming Adobe Live Streams",
        description: "Scheduled live streaming sessions from Adobe Live on YouTube.",
        numberOfItems: upcomingEvents.length,
        itemListElement: upcomingEvents.map((event, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: event,
        })),
      }] : []),
    ],
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <ScheduleCalendar schedule={schedule} pastStreams={pastStreams} />
      </main>
      <SocialFooter />
    </div>
  );
}
