import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/adobe-live/Header";
import SocialFooter from "@/components/adobe-live/SocialFooter";

export const revalidate = 3600;

const SITE_URL = "https://adobelive.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const metadata: Metadata = {
  title: "Blog — Adobe Live Tutorials & Creative Guides",
  description: "Tutorials, guides, and creative tips from every Adobe Live video. Learn Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly, and more — all free.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "Blog — Adobe Live Tutorials & Creative Guides",
    description: "Tutorials, guides, and creative tips from every Adobe Live video — free Adobe education.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Adobe Live Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Adobe Live Tutorials & Creative Guides",
    description: "Tutorials and tips from every Adobe Live video — all free.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

interface Post {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string | null;
  tags: string[];
  duration: string;
}

const ALL_TAGS = [
  "All", "Photoshop", "Illustrator", "Premiere", "After Effects",
  "Lightroom", "Firefly", "Express", "InDesign", "Fresco", "Substance 3D",
];

interface PageProps {
  searchParams: { tag?: string; page?: string };
}

const PAGE_SIZE = 24;

export default async function BlogPage({ searchParams }: PageProps) {
  const activeTag = searchParams.tag ?? "All";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let posts: Post[] = [];
  let count = 0;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let query = supabase
      .from("video_index")
      .select("id, title, description, thumbnail_url, published_at, tags, duration", { count: "exact" })
      .eq("is_live_stream", false)
      .eq("is_short", false)
      .or("stream_status.is.null,stream_status.neq.upcoming")
      .order("published_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (activeTag !== "All") {
      query = query.contains("tags", [activeTag]);
    }

    const result = await query;
    count = result.count ?? 0;
    posts = (result.data ?? []).map((v) => ({
      id: v.id,
      title: v.title ?? "",
      description: v.description ?? "",
      thumbnail_url: v.thumbnail_url ?? "",
      published_at: v.published_at ?? null,
      tags: v.tags ?? [],
      duration: v.duration ?? "",
    }));
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Adobe Live Blog",
    description: "Tutorials and creative guides from every Adobe Live video.",
    url: `${SITE_URL}/blog`,
    publisher: { "@id": `${SITE_URL}/#organization` },
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description.slice(0, 200) || p.title,
      image: p.thumbnail_url,
      datePublished: p.published_at,
      url: `${SITE_URL}/blog/${p.id}`,
      keywords: p.tags.join(", "),
      publisher: { "@id": `${SITE_URL}/#organization` },
    })),
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-gradient-to-b from-[#FA0F00] to-[#FF6B00] rounded-full" />
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Creative Blog
          </h1>
          <p className="text-white/50 text-base max-w-xl">
            Tutorials, tips, and guides from every Adobe Live video — searchable, readable, and free.
          </p>
        </div>

        {/* Tag filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {ALL_TAGS.map((tag) => (
            <Link
              key={tag}
              href={tag === "All" ? "/blog" : `/blog?tag=${encodeURIComponent(tag)}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                activeTag === tag
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/55 border-white/10 hover:border-white/25 hover:text-white"
              }`}
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Post grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center text-white/30 text-sm">No posts found.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
            {page > 1 && (
              <Link
                href={`/blog?${activeTag !== "All" ? `tag=${encodeURIComponent(activeTag)}&` : ""}page=${page - 1}`}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 text-sm transition-all duration-200"
              >
                ← Previous
              </Link>
            )}
            <span className="text-white/30 text-sm px-2">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link
                href={`/blog?${activeTag !== "All" ? `tag=${encodeURIComponent(activeTag)}&` : ""}page=${page + 1}`}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 text-sm transition-all duration-200"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </main>

      <SocialFooter />
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function BlogCard({ post }: { post: Post }) {
  const excerpt = post.description
    ? post.description.replace(/\n+/g, " ").slice(0, 120).trimEnd() + (post.description.length > 120 ? "…" : "")
    : "";

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        {post.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
            {post.duration}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{t}</span>
            ))}
          </div>
        )}
        <h2 className="text-sm font-bold text-white leading-snug group-hover:text-white/90 line-clamp-2">
          {post.title}
        </h2>
        {excerpt && (
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2 flex-1">{excerpt}</p>
        )}
        {post.published_at && (
          <time className="text-[10px] text-white/25 mt-auto" dateTime={post.published_at}>
            {formatDate(post.published_at)}
          </time>
        )}
      </div>
    </Link>
  );
}
