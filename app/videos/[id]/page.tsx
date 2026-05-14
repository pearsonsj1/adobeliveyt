import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import BlogPostBody from "@/components/adobe-live/blog/BlogPostBody";
import VideoPageTracker from "@/components/adobe-live/VideoPageTracker";
import { getCourses } from "@/lib/youtube";
import { inferRelatedCoursesForVideo } from "@/lib/instructors";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

interface VideoRow {
  id: string;
  title: string;
  description: string;
  blog_body: string | null;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  tags: string[];
  published_at: string | null;
  transcript: string | null;
  transcript_fetched_at: string | null;
  is_short?: boolean;
}

function normalizeTags(tags: unknown): string[] {
  return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
}

function isShortVideo(duration: string): boolean {
  if (!duration) return false;
  // Shorts are under 3 minutes: "0:XX", "1:XX", "2:XX"
  const parts = duration.split(":").map(Number);
  if (parts.length === 2) return parts[0] < 3;
  if (parts.length === 3) return parts[0] === 0 && parts[1] < 3;
  return false;
}

async function getVideo(id: string): Promise<VideoRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("video_index")
    .select("id, title, description, blog_body, thumbnail_url, video_url, duration, tags, published_at, transcript, transcript_fetched_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...data, tags: normalizeTags(data.tags), is_short: isShortVideo(data.duration) };
}

async function ensureTranscript(video: VideoRow): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (video.transcript_fetched_at) return video.transcript;
  fetch(`${SUPABASE_URL}/functions/v1/fetch-transcript?videoId=${video.id}`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  }).catch(() => {});
  return null;
}

export async function generateStaticParams() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("video_index")
    .select("id")
    .order("published_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const video = await getVideo(params.id);
  if (!video) return { title: "Video Not Found" };

  const body = video.blog_body ?? video.description ?? "";
  const clean = body.replace(/\n+/g, " ").replace(/https?:\/\/\S+/g, "").trim();
  const description = clean.length > 0
    ? clean.slice(0, 200).trimEnd() + (clean.length > 200 ? "…" : "")
    : `Watch ${video.title} on Adobe Live — free Adobe tutorials on YouTube.`;

  const title = `${video.title} — Adobe Live`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/videos/${video.id}` },
    openGraph: {
      type: "video.other",
      url: `${SITE_URL}/videos/${video.id}`,
      title,
      description,
      images: [{ url: video.thumbnail_url, width: 1280, height: 720, alt: video.title }],
      videos: [{ url: video.video_url, type: "text/html" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [video.thumbnail_url],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDuration(dur: string): string {
  // already in HH:MM:SS or MM:SS format from DB
  return dur;
}

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  const video = await getVideo(params.id);
  if (!video) notFound();

  const transcript = await ensureTranscript(video);

  const courses = await getCourses();
  const relatedCourses = inferRelatedCoursesForVideo(video.tags, courses, 4);

  // Use blog_body when available (social/hashtag stripped); fall back to raw description
  const rawBody = (video.blog_body && video.blog_body.length > 60)
    ? video.blog_body
    : (video.description ?? "");

  // Strip bare URLs and social handles from short descriptions for cleaner display
  const bodyText = rawBody
    .split("\n")
    .filter((l) => !/^https?:\/\/\S+$/.test(l.trim()) && !/^(youtube|instagram|tiktok|linkedin|discord|twitter|facebook)\s*:/i.test(l.trim()))
    .join("\n")
    .trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoObject",
        "@id": `${SITE_URL}/videos/${video.id}#video`,
        name: video.title,
        description: (video.description ?? video.title).slice(0, 500),
        thumbnailUrl: video.thumbnail_url,
        uploadDate: video.published_at ?? undefined,
        url: `${SITE_URL}/videos/${video.id}`,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        contentUrl: video.video_url,
        isAccessibleForFree: true,
        inLanguage: "en-US",
        publisher: { "@id": `${SITE_URL}/#organization` },
        keywords: video.tags.join(", "),
        ...(transcript ? { transcript } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Videos", item: `${SITE_URL}/videos` },
          { "@type": "ListItem", position: 3, name: video.title, item: `${SITE_URL}/videos/${video.id}` },
        ],
      },
      ...(relatedCourses.length > 0
        ? [
            {
              "@type": "ItemList",
              name: "Related Adobe Live courses",
              itemListElement: relatedCourses.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Course",
                  name: c.title,
                  url: `${SITE_URL}/courses/${c.id}`,
                },
              })),
            },
          ]
        : []),
    ],
  };

  const utmVideoUrl = `${video.video_url}${video.video_url.includes("?") ? "&" : "?"}utm_source=adobelive.com&utm_medium=website&utm_campaign=video-page&utm_content=${video.id}`;

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VideoPageTracker videoId={video.id} videoTitle={video.title} videoUrl={video.video_url} />
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/30" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/videos" className="hover:text-white/60 transition-colors">Videos</Link>
            <span>/</span>
            <span className="text-white/40 truncate max-w-[200px] sm:max-w-xs">{video.title}</span>
          </nav>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {video.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/videos?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-white/8 text-white/55 border border-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15] mb-5">
            {video.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-8 pb-8 border-b border-white/8">
            {video.published_at && (
              <time dateTime={video.published_at} className="text-sm text-white/40">
                {formatDate(video.published_at)}
              </time>
            )}
            {video.duration && (
              <>
                <span className="w-px h-3 bg-white/15" />
                <span className="text-sm text-white/40">{formatDuration(video.duration)}</span>
              </>
            )}
            <span className="w-px h-3 bg-white/15" />
            <a
              href={utmVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#FA0F00] hover:text-[#ff4422] transition-colors font-semibold"
            >
              Watch on YouTube ↗
            </a>
          </div>

          {/* Thumbnail with play button */}
          <a
            href={utmVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative rounded-xl overflow-hidden border border-white/8 mb-10"
            aria-label={`Watch ${video.title} on YouTube`}
          >
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#FA0F00] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </a>

          {/* Body */}
          {video.is_short ? (
            /* ── Shorts: minimal description, big CTA ── */
            <div className="space-y-6">
              {bodyText && bodyText.length > 20 && (
                <p className="text-[16px] text-white/75 leading-[1.85]">{bodyText}</p>
              )}
              <a
                href={utmVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold text-base transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)" }}
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Watch on YouTube
              </a>
              {transcript && (
                <BlogPostBody description="" transcript={transcript} videoTitle={video.title} />
              )}
            </div>
          ) : bodyText && bodyText.length > 60 ? (
            /* ── Long-form: full blog post body ── */
            <>
              <BlogPostBody
                description={bodyText}
                transcript={transcript}
                videoTitle={video.title}
              />
              <div className="mt-10 p-6 rounded-2xl border border-white/8 bg-white/[0.025] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">Watch the full video on YouTube</p>
                  <p className="text-white/40 text-xs">All Adobe Live content is free — no sign-up required.</p>
                </div>
                <a
                  href={utmVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200"
                >
                  Watch Now ↗
                </a>
              </div>
            </>
          ) : (
            /* ── No/thin description ── */
            <div className="space-y-6">
              {bodyText && bodyText.length > 20 && (
                <p className="text-[16px] text-white/75 leading-[1.85]">{bodyText}</p>
              )}
              <div className="p-6 rounded-2xl border border-white/8 bg-white/[0.025] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">Watch this video on YouTube</p>
                  <p className="text-white/40 text-xs">All Adobe Live content is free — no sign-up required.</p>
                </div>
                <a
                  href={utmVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200"
                >
                  Watch Now ↗
                </a>
              </div>
              {transcript && (
                <BlogPostBody description="" transcript={transcript} videoTitle={video.title} />
              )}
            </div>
          )}

        </div>

        {relatedCourses.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16 pt-12 border-t border-white/8">
            <h2 className="text-lg font-black text-white tracking-tight mb-2">Related courses</h2>
            <p className="text-white/45 text-sm mb-6">
              Multi-part playlists on the same tools and topics — stay in the learning flow on the site, then watch on
              YouTube.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {relatedCourses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/courses/${c.id}`}
                    className="flex gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt=""
                        className="w-24 aspect-video object-cover rounded-lg flex-shrink-0 border border-white/10"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{c.title}</p>
                      <p className="text-[11px] text-white/40 mt-1">
                        {c.instructor} · {c.tool}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SocialFooter />
    </div>
  );
}
