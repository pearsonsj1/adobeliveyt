"use client";

import { motion } from "framer-motion";
import { TrendingUp, Eye } from "lucide-react";
import { VideoItem, formatViewCount, formatRelativeDate } from "@/lib/youtube";
import SectionHeader from "./SectionHeader";
import { Play } from "lucide-react";

interface PopularSectionProps {
  videos: VideoItem[];
}

export default function PopularSection({ videos }: PopularSectionProps) {
  return (
    <section id="popular" className="py-20 sm:py-28 px-4 sm:px-6">
      <SectionHeader
        icon={TrendingUp}
        label="Most Watched"
        title="Popular Videos"
        subtitle="The Adobe Live sessions that creators keep coming back to — timeless techniques and must-watch masterclasses."
        action={{ label: "All popular videos", href: "/videos" }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {videos.map((video, i) => (
          <motion.a
            key={video.id}
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 border border-white/10 rounded-xl overflow-hidden bg-black/30 hover:border-white/25 transition-all duration-300 p-0"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileHover={{ y: -3 }}
          >
            <div className="relative flex-shrink-0 w-40 sm:w-48">
              <img
                src={video.thumbnail}
                alt={video.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                {video.duration}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[#FA0F00] text-xs font-bold">#{i + 1}</span>
                {video.tags[0] && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-white/10 text-white/60">{video.tags[0]}</span>
                )}
              </div>
              <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:rainbow-text">
                {video.title}
              </h3>
              <div className="flex items-center gap-3 text-white/40 text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViewCount(video.viewCount)}
                </span>
                <span>{formatRelativeDate(video.publishedAt)}</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
