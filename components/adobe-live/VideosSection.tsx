"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, TrendingUp, Eye, Clock, Calendar, Play } from "lucide-react";
import Link from "next/link";
import { VideoItem, formatViewCount, formatRelativeDate } from "@/lib/youtube";
import SectionHeader from "./SectionHeader";
import { usePreview } from "./PreviewContext";

const TOOL_COLORS: Record<string, string> = {
  Photoshop:       "bg-[#31A8FF] text-white border-[#31A8FF]",
  Illustrator:     "bg-[#FF9A00] text-white border-[#FF9A00]",
  "After Effects": "bg-[#9999FF] text-white border-[#9999FF]",
  Premiere:        "bg-[#9999FF] text-white border-[#9999FF]",
  Lightroom:       "bg-[#31A8FF] text-white border-[#31A8FF]",
  Firefly:         "bg-[#FA0F00] text-white border-[#FA0F00]",
  Express:         "bg-[#FF9A00] text-white border-[#FF9A00]",
  InDesign:        "bg-[#FF3366] text-white border-[#FF3366]",
  Fresco:          "bg-[#00C2A8] text-white border-[#00C2A8]",
  "Substance 3D":  "bg-[#FF6C37] text-white border-[#FF6C37]",
  "Substance":     "bg-[#FF6C37] text-white border-[#FF6C37]",
};

interface VideosSectionProps {
  recent: VideoItem[];
  popular: VideoItem[];
}

export default function VideosSection({ recent, popular }: VideosSectionProps) {
  const [tab, setTab] = useState<"recent" | "popular">("recent");
  const videos = tab === "recent" ? recent.slice(0, 6) : popular;

  return (
    <section id="videos" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={tab === "recent" ? BookOpen : TrendingUp}
        label="Watch & Learn"
        title="Videos"
        subtitle="Recent tutorials and the most-watched sessions from Adobe Live on YouTube."
        action={{ label: "All videos", href: "/videos" }}
      />

      <div className="flex items-center gap-1 p-1 mb-6 rounded-xl bg-white/5 border border-white/10 w-fit">
        {(["recent", "popular"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === t ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === t && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-lg bg-white/10 border border-white/15"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {t === "recent" ? <BookOpen className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {t === "recent" ? "Recent" : "Popular"}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={tab === "recent" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "grid grid-cols-1 sm:grid-cols-2 gap-5"}
        >
          {tab === "recent"
            ? videos.map((video, i) => <RecentCard key={video.id} video={video} index={i} />)
            : videos.map((video, i) => <PopularCard key={video.id} video={video} index={i} />)}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function RecentCard({ video, index }: { video: VideoItem; index: number }) {
  const { open } = usePreview();
  return (
    <motion.button
      type="button"
      onClick={() => open({
        title: video.title,
        thumbnail: video.thumbnail,
        description: video.description,
        videoUrl: video.videoUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        tags: video.tags,
      })}
      className="group block text-left w-full border border-white/10 rounded-xl overflow-hidden bg-black/30 hover:border-white/25 transition-all duration-300"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -4 }}
    >
      <div className="relative overflow-hidden aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-[#FA0F00]/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[#FA0F00]/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
            {video.duration}
          </div>
        )}
        {video.tags[0] && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TOOL_COLORS[video.tags[0]] ?? "bg-black/60 text-white/80 border-white/15 backdrop-blur-sm"}`}>
              {video.tags[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-3 group-hover:text-white/80 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-white/40 text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatRelativeDate(video.publishedAt)}
          </span>
          {video.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViewCount(video.viewCount)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function PopularCard({ video, index }: { video: VideoItem; index: number }) {
  const { open } = usePreview();
  return (
    <motion.button
      type="button"
      onClick={() => open({
        title: video.title,
        thumbnail: video.thumbnail,
        description: video.description,
        videoUrl: video.videoUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        tags: video.tags,
      })}
      className="group flex gap-0 text-left w-full border border-white/10 rounded-xl overflow-hidden bg-black/30 hover:border-white/25 transition-all duration-300"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <div className="relative flex-shrink-0 w-44 sm:w-52">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-[#FA0F00]/90 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
            {video.duration}
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#FA0F00] text-sm font-black">#{index + 1}</span>
          {video.tags[0] && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${TOOL_COLORS[video.tags[0]] ?? "bg-white/10 text-white/60 border-white/15"}`}>
              {video.tags[0]}
            </span>
          )}
        </div>
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-3 group-hover:text-white/80 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-white/40 text-xs">
          {video.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViewCount(video.viewCount)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(video.publishedAt)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
