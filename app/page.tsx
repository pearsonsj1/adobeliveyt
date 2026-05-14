import { getLiveNow, getUpcomingStreams, getRecentVideos, getPopularVideos, getRecentVideosFromIndex, getPopularVideosFromIndex, getToolPlaylists, getSchedule, getRecurringSeries, getCourses, getShorts, checkQuotaExhausted, getVideoCount, indexVideos, indexPlaylistVideos, getPlaylistVideos, MOBILE_TEMPLATES_PLAYLIST_ID, isShortFormatVideo } from "@/lib/youtube";
import Header from "@/components/adobe-live/Header";
import HeroSection from "@/components/adobe-live/HeroSection";
import LiveSection from "@/components/adobe-live/LiveSection";
import ScheduleSection from "@/components/adobe-live/ScheduleSection";
import ToolsSection from "@/components/adobe-live/ToolsSection";
import SeriesSection from "@/components/adobe-live/SeriesSection";
import CoursesSection from "@/components/adobe-live/CoursesSection";
import ShortsSection from "@/components/adobe-live/ShortsSection";
import MobileTemplatesSection from "@/components/adobe-live/MobileTemplatesSection";
import VideosSection from "@/components/adobe-live/VideosSection";
import TrendingSection from "@/components/adobe-live/TrendingSection";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import StartHereCTA from "@/components/adobe-live/StartHereCTA";
import type { Metadata } from "next";

export const revalidate = 3600;

const SITE_URL = "https://adobelive.com";

export const metadata: Metadata = {
  title: "Adobe Live — Free Adobe Tutorials, Live Streams & Creative Education",
  description: "Watch free live Adobe tutorials on YouTube. Learn Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly & more from world-class Adobe experts. Daily live streams, shorts, and full courses — all free.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Adobe Live — Free Adobe Tutorials, Live Streams & Creative Education",
    description: "Free live Adobe tutorials on YouTube. Photoshop, Illustrator, Premiere, After Effects, Lightroom, Firefly and more from Adobe's own experts.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Adobe Live — Free Creative Tutorials on YouTube" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adobe Live — Free Adobe Tutorials, Live Streams & Creative Education",
    description: "Free live Adobe tutorials on YouTube. Learn from Adobe's own experts — Photoshop, Illustrator, Premiere, Firefly & more.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

function formatDurationIso(duration: string): string {
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  if (parts.length === 2) return `PT${parts[0]}M${parts[1]}S`;
  return "";
}

export default async function AdobeLivePage() {
  const [liveStreams, upcomingStreams, apiRecentVideos, apiPopularVideos, toolPlaylists, schedule, recurringSeries, courses, shorts, mobileTemplates, quotaExhausted, videoCount] = await Promise.all([
    getLiveNow(),
    getUpcomingStreams(),
    getRecentVideos(),
    getPopularVideos(),
    getToolPlaylists(),
    getSchedule(),
    getRecurringSeries(),
    getCourses(),
    getShorts(),
    getPlaylistVideos(MOBILE_TEMPLATES_PLAYLIST_ID),
    checkQuotaExhausted(),
    getVideoCount(),
  ]);

  // Fall back to the DB index when the API returned nothing (quota hit, empty, or error).
  const [recentVideos, popularVideos] = await (async () => {
    if (!quotaExhausted && apiRecentVideos.length > 0) {
      return [apiRecentVideos, apiPopularVideos];
    }
    const [indexRecent, indexPopular] = await Promise.all([
      getRecentVideosFromIndex(),
      getPopularVideosFromIndex(),
    ]);
    return [
      indexRecent.length ? indexRecent : apiRecentVideos,
      indexPopular.length ? indexPopular : apiPopularVideos,
    ];
  })();

  const recentForHome = recentVideos.filter((v) => !isShortFormatVideo(v));
  const popularForHome = popularVideos.filter((v) => !isShortFormatVideo(v));

  // Persist all surfaced videos to the index (fire-and-forget — never blocks render)
  const allVideos = [
    ...recentForHome,
    ...popularForHome.filter((v) => !recentForHome.some((r) => r.id === v.id)),
    ...shorts,
  ];
  indexVideos(allVideos).catch(() => {});

  // Index all playlist videos (tool playlists + series + courses) — fire-and-forget
  const allPlaylistIds = [
    ...toolPlaylists.map((p) => p.playlistId),
    ...recurringSeries.map((s) => s.playlistId),
    ...courses.map((c) => c.playlistId),
    MOBILE_TEMPLATES_PLAYLIST_ID,
  ];
  Promise.all(
    allPlaylistIds.map((playlistId) =>
      getPlaylistVideos(playlistId)
        .then((videos) => indexPlaylistVideos(playlistId, videos))
        .catch(() => {})
    )
  ).catch(() => {});

  const SITE_URL = "https://adobelive.com";
  const videoJsonLd = allVideos.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Adobe Live Videos",
    itemListElement: allVideos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "VideoObject",
        "@id": v.videoUrl,
        name: v.title,
        description: v.description || v.title,
        thumbnailUrl: v.thumbnail,
        uploadDate: v.publishedAt,
        duration: v.duration ? formatDurationIso(v.duration) : undefined,
        url: v.videoUrl,
        embedUrl: `https://www.youtube.com/embed/${v.id}`,
        publisher: {
          "@type": "Organization",
          name: "Adobe Live",
          url: SITE_URL,
        },
        keywords: (v.tags ?? []).join(", ") || "Adobe, tutorial, creative",
        isAccessibleForFree: true,
        inLanguage: "en-US",
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      {videoJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
        />
      )}
      <Header />
      <HeroSection videoCount={videoCount} />

      <div className="h-px bg-gradient-to-r from-transparent via-[#FA0F00]/40 to-transparent" />

      <main aria-label="Adobe Live content">
        {(liveStreams.length > 0 || upcomingStreams.length > 0) && (
          <>
            <div className="max-w-7xl mx-auto">
              <LiveSection liveStreams={liveStreams} upcomingStreams={upcomingStreams} />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </>
        )}

        {(() => {
          // When no live stream, the next upcoming stream is shown in the countdown card — exclude it from the schedule
          const hasLive = liveStreams.some((s) => s.isLive);
          const nextUpcomingId = !hasLive && upcomingStreams[0] ? upcomingStreams[0].id : null;
          const scheduleFiltered = nextUpcomingId
            ? schedule.filter((s) => s.id !== nextUpcomingId)
            : schedule;
          return scheduleFiltered.length > 0 ? (
            <>
              <div className="max-w-7xl mx-auto">
                <ScheduleSection schedule={scheduleFiltered} />
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            </>
          ) : null;
        })()}

        <div className="max-w-7xl mx-auto">
          <VideosSection recent={recentForHome} popular={popularForHome} />
        </div>

        {shorts.length > 0 && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <div className="max-w-7xl mx-auto">
              <ShortsSection shorts={shorts} />
            </div>
          </>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <TrendingSection />
        </div>

        {mobileTemplates.length > 0 && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <div className="max-w-7xl mx-auto">
              <MobileTemplatesSection templates={mobileTemplates} />
            </div>
          </>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <ToolsSection playlists={toolPlaylists} />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <SeriesSection series={recurringSeries} />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <CoursesSection courses={courses} />
        </div>

      </main>

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="max-w-7xl mx-auto">
        <StartHereCTA />
      </div>

      <SocialFooter />
    </div>
  );
}
