"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, X, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { LibraryVideo } from "@/app/videos/page";
import { trackSearch, trackSearchClick } from "@/lib/analytics";

const TOOLS = [
  "All",
  "Photoshop",
  "Illustrator",
  "Premiere",
  "After Effects",
  "Lightroom",
  "Firefly",
  "Express",
  "InDesign",
  "Fresco",
  "Substance 3D",
];

const TOOL_COLORS: Record<string, string> = {
  Photoshop:       "bg-[#31A8FF]/15 text-[#31A8FF] border-[#31A8FF]/30",
  Illustrator:     "bg-[#FF9A00]/15 text-[#FF9A00] border-[#FF9A00]/30",
  Premiere:        "bg-[#9999FF]/15 text-[#9999FF] border-[#9999FF]/30",
  "After Effects": "bg-[#9999FF]/15 text-[#9999FF] border-[#9999FF]/30",
  Lightroom:       "bg-[#31A8FF]/15 text-[#31A8FF] border-[#31A8FF]/30",
  Firefly:         "bg-[#FA0F00]/15 text-[#FA0F00] border-[#FA0F00]/30",
  Express:         "bg-[#FF9A00]/15 text-[#FF9A00] border-[#FF9A00]/30",
  InDesign:        "bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/30",
  Fresco:          "bg-[#00C2A8]/15 text-[#00C2A8] border-[#00C2A8]/30",
  "Substance 3D":  "bg-[#FF6C37]/15 text-[#FF6C37] border-[#FF6C37]/30",
  Substance:       "bg-[#FF6C37]/15 text-[#FF6C37] border-[#FF6C37]/30",
};

const TOOL_KEYWORDS: Record<string, string[]> = {
  Photoshop:       ["photoshop"],
  Illustrator:     ["illustrator"],
  Premiere:        ["premiere"],
  "After Effects": ["after effects", "aftereffects"],
  Lightroom:       ["lightroom"],
  Firefly:         ["firefly"],
  Express:         ["adobe express", " express "],
  InDesign:        ["indesign", "in design"],
  Fresco:          ["fresco"],
  "Substance 3D":  ["substance"],
};

type VideoType = "all" | "short" | "long";

function isShort(duration: string): boolean {
  if (!duration) return false;
  const parts = duration.split(":").map(Number);
  if (parts.length === 1) return parts[0] <= 60;
  if (parts.length === 2) return parts[0] === 0 && parts[1] <= 60;
  return false;
}

function matchesTool(video: LibraryVideo, tool: string): boolean {
  if (tool === "All") return true;
  const tagMatch = video.tags.some(
    (t) => t.toLowerCase() === tool.toLowerCase() ||
           t.toLowerCase() === tool.toLowerCase().replace(" 3d", "")
  );
  if (tagMatch) return true;
  const keywords = TOOL_KEYWORDS[tool] ?? [tool.toLowerCase()];
  const text = video.title.toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface Props {
  videos: LibraryVideo[];
  initialTool?: string;
}

const PAGE_SIZE = 48;

export default function VideoLibrary({ videos, initialTool }: Props) {
  const [search, setSearch] = useState("");
  const [tool, setTool] = useState(() => {
    if (!initialTool) return "All";
    return TOOLS.includes(initialTool) ? initialTool : "All";
  });
  const [type, setType] = useState<VideoType>("all");
  const [page, setPage] = useState(1);

  // Debounced search tracking — fires 800ms after user stops typing
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackedQuery = useRef("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return videos
      .filter((v) => {
        if (q) {
          const inTitle = v.title.toLowerCase().includes(q);
          const inDesc = v.description.toLowerCase().includes(q);
          if (!inTitle && !inDesc) return false;
        }
        if (!matchesTool(v, tool)) return false;
        if (type === "short" && !isShort(v.duration)) return false;
        if (type === "long" && isShort(v.duration)) return false;
        return true;
      })
      .sort((a, b) => {
        if (!search) return 0;
        const q2 = search.toLowerCase().trim();
        const aTitle = a.title.toLowerCase().includes(q2);
        const bTitle = b.title.toLowerCase().includes(q2);
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        return 0;
      });
  }, [videos, search, tool, type]);

  useEffect(() => {
    const q = search.trim();
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q || q === lastTrackedQuery.current) return;
    searchTimerRef.current = setTimeout(() => {
      trackSearch(q, filtered.length, tool);
      lastTrackedQuery.current = q;
    }, 800);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search, filtered.length, tool]);

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  const activeFilters = (tool !== "All" ? 1 : 0) + (type !== "all" ? 1 : 0) + (search ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setTool("All");
    setType("all");
    setPage(1);
  }

  function handleFilterChange(fn: () => void) {
    fn();
    setPage(1);
  }

  const handleVideoClick = useCallback((videoId: string) => {
    const q = search.trim();
    if (q) trackSearchClick(q, videoId, tool);
  }, [search, tool]);

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FA0F00]" />
            <span
              className="text-xs font-bold uppercase tracking-[0.15em] bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #FA0F00 0%, #FF6B00 50%, #FFD200 100%)" }}
            >
              Browse Everything
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight">
                Video Library
              </h1>
              <p className="text-white/45 text-sm mt-1.5">
                {videos.length} videos indexed from Adobe Live — search, filter, and find exactly what you need.
              </p>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-col gap-4 mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
              placeholder="Search titles and descriptions..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
            />
            {search && (
              <button
                onClick={() => handleFilterChange(() => setSearch(""))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 text-white/30">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Filter</span>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              {(["all", "long", "short"] as VideoType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleFilterChange(() => setType(t))}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                    type === t ? "bg-white/12 text-white border border-white/15" : "text-white/45 hover:text-white/70"
                  }`}
                >
                  {t === "all" ? "All types" : t === "long" ? "Full videos" : "Shorts"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TOOLS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleFilterChange(() => setTool(t))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    tool === t
                      ? t === "All"
                        ? "bg-white/12 text-white border-white/25"
                        : `border ${TOOL_COLORS[t] ?? "bg-white/12 text-white border-white/25"}`
                      : "bg-transparent text-white/45 border-white/10 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 mb-5">
          <span className="text-white/40 text-xs">
            {filtered.length === videos.length
              ? `${videos.length} videos`
              : `${filtered.length} of ${videos.length} videos`}
          </span>
          {filtered.length !== videos.length && (
            <span className="text-white/20 text-xs">matching filters</span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Search className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-white/40 text-sm font-medium">No videos match these filters.</p>
            <button onClick={resetFilters} className="mt-3 text-white/30 hover:text-white/60 text-xs underline transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <AnimatePresence mode="popLayout">
                {paged.map((video, i) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    index={i}
                    searchQuery={search}
                    onClickCapture={() => handleVideoClick(video.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all duration-200"
                >
                  Load more · {filtered.length - page * PAGE_SIZE} remaining
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function VideoCard({
  video,
  index,
  searchQuery,
  onClickCapture,
}: {
  video: LibraryVideo;
  index: number;
  searchQuery?: string;
  onClickCapture?: () => void;
}) {
  const short = isShort(video.duration);
  const firstTag = video.tags[0];
  const q = searchQuery?.toLowerCase().trim() ?? "";
  const descriptionMatch = q.length > 0 && !video.title.toLowerCase().includes(q) && video.description.toLowerCase().includes(q);

  return (
    <motion.div
      className="group flex flex-col rounded-xl border border-white/8 overflow-hidden bg-black/20 hover:border-white/20 transition-all duration-200"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.3) }}
      whileHover={{ y: -3 }}
      layout
    >
      <Link href={`/videos/${video.id}`} onClick={onClickCapture} className="flex flex-col flex-1">
        <div className="relative overflow-hidden bg-black/40 aspect-video">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-9 h-9 rounded-full bg-[#FA0F00]/90 flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>

          {video.duration && (
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
              {video.duration}
            </div>
          )}

          {short && (
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FA0F00]/90 text-white text-[9px] font-bold uppercase tracking-wide">
              Short
            </div>
          )}

          {!short && firstTag && (
            <div className="absolute top-1.5 left-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${TOOL_COLORS[firstTag] ?? "bg-black/60 text-white/80 border-white/15"}`}>
                {firstTag}
              </span>
            </div>
          )}
        </div>

        <div className="p-2.5 flex items-start gap-1.5">
          <p className="text-white/75 text-[11px] font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors flex-1">
            {video.title}
          </p>
        </div>

        <div className="px-2.5 pb-2 flex items-center gap-2">
          {video.published_at && (
            <span className="text-[10px] text-white/25">{formatDate(video.published_at)}</span>
          )}
          {descriptionMatch && (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-white/30 border border-white/15 rounded px-1 py-0.5">
              desc
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
