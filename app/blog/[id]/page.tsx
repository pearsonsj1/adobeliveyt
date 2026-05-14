import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";
import BlogPostBody from "@/components/adobe-live/blog/BlogPostBody";

export const revalidate = 86400;

const SITE_URL = "https://adobelive.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export interface VideoRow {
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
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function normalizeTags(tags: unknown): string[] {
  return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
}

async function getPost(id: string): Promise<VideoRow | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("video_index")
    .select("id, title, description, blog_body, thumbnail_url, video_url, duration, tags, published_at, transcript")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...data, tags: normalizeTags(data.tags) };
}

async function getRelated(id: string, tags: string[]): Promise<VideoRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const q = sb
    .from("video_index")
    .select("id, title, description, blog_body, thumbnail_url, video_url, duration, tags, published_at, transcript")
    .eq("is_live_stream", false)
    .neq("id", id)
    .order("published_at", { ascending: false })
    .limit(4);

  if (tags.length > 0) {
    const { data } = await q.contains("tags", [tags[0]]);
    if (data && data.length >= 2) return data.map((row) => ({ ...row, tags: normalizeTags(row.tags) }));
  }
  const { data } = await q;
  return (data ?? []).map((row) => ({ ...row, tags: normalizeTags(row.tags) }));
}

export async function generateStaticParams() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("video_index")
    .select("id")
    .eq("is_live_stream", false)
    .or("stream_status.is.null,stream_status.neq.upcoming")
    .order("published_at", { ascending: false })
    .limit(300);
  return (data ?? []).map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(params.id);
  if (!post) return { title: "Post Not Found" };

  const clean = (post.description ?? "").replace(/\n+/g, " ").replace(/https?:\/\/\S+/g, "").trim();
  const description = clean.slice(0, 200).trimEnd() + (clean.length > 200 ? "…" : "");

  return {
    title: `${post.title} — Adobe Live`,
    description: description || `Learn from this Adobe Live tutorial: ${post.title}`,
    alternates: { canonical: `${SITE_URL}/blog/${post.id}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${post.id}`,
      title: `${post.title} — Adobe Live`,
      description,
      publishedTime: post.published_at ?? undefined,
      images: [{ url: post.thumbnail_url, width: 1280, height: 720, alt: post.title }],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Adobe Live`,
      description,
      images: [post.thumbnail_url],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) notFound();

  const related = await getRelated(post.id, post.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${SITE_URL}/blog/${post.id}#post`,
        headline: post.title,
        description: (post.description ?? "").replace(/\n+/g, " ").slice(0, 200),
        image: post.thumbnail_url,
        datePublished: post.published_at ?? undefined,
        url: `${SITE_URL}/blog/${post.id}`,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        keywords: (post.tags ?? []).join(", "),
        isAccessibleForFree: true,
        inLanguage: "en-US",
      },
      {
        "@type": "VideoObject",
        "@id": `${SITE_URL}/blog/${post.id}#video`,
        name: post.title,
        description: (post.description ?? post.title).slice(0, 500),
        thumbnailUrl: post.thumbnail_url,
        uploadDate: post.published_at ?? undefined,
        url: `${SITE_URL}/blog/${post.id}`,
        embedUrl: `https://www.youtube.com/embed/${post.id}`,
        contentUrl: post.video_url,
        isAccessibleForFree: true,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.id}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/30" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-white/45 truncate max-w-[200px] sm:max-w-none">{post.title}</span>
          </nav>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-white/8 text-white/60 border border-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15] mb-5">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-8 pb-8 border-b border-white/8">
            {post.published_at && (
              <time dateTime={post.published_at} className="text-sm text-white/40">
                {formatDate(post.published_at)}
              </time>
            )}
            {post.duration && (
              <>
                <span className="w-px h-3 bg-white/15" />
                <span className="text-sm text-white/40">{post.duration}</span>
              </>
            )}
            <span className="w-px h-3 bg-white/15" />
            <a
              href={post.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#FA0F00] hover:text-[#ff4422] transition-colors font-semibold"
            >
              Watch on YouTube ↗
            </a>
          </div>

          {/* Thumbnail */}
          <a
            href={post.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative rounded-xl overflow-hidden border border-white/8 mb-10"
            aria-label={`Watch ${post.title} on YouTube`}
          >
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#FA0F00] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </a>

          {/* Body — client component for expand/collapse */}
          <BlogPostBody
            description={(post.blog_body ?? post.description ?? "")
              .split("\n")
              .filter((l: string) => !/^https?:\/\/\S+$/.test(l.trim()) && !/^(youtube|instagram|tiktok|linkedin|discord|twitter|facebook)\s*:/i.test(l.trim()))
              .join("\n")
              .trim()
            }
            transcript={post.transcript ?? null}
            videoTitle={post.title}
          />

          {/* CTA */}
          <div className="mt-10 p-6 rounded-2xl border border-white/8 bg-white/[0.025] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-bold text-sm mb-1">Watch the full video on YouTube</p>
              <p className="text-white/45 text-xs">All Adobe Live content is free — no sign-up required.</p>
            </div>
            <a
              href={post.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200"
            >
              Watch Now ↗
            </a>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="max-w-7xl mx-auto mt-20">
            <h2 className="text-lg font-bold text-white mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.id}`}
                  className="group flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    {r.tags.length > 0 && <span className="text-[11px] font-bold text-white/35 uppercase tracking-wide">{r.tags[0]}</span>}
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-white/85 transition-colors">{r.title}</p>
                    {r.published_at && <time className="text-xs text-white/30">{formatDate(r.published_at)}</time>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SocialFooter />
    </div>
  );
}
