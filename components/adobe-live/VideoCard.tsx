"use client";

import { motion } from "framer-motion";
import { Play, Clock, Eye, Calendar } from "lucide-react";
import { VideoItem, formatViewCount, formatRelativeDate } from "@/lib/youtube";

interface VideoCardProps {
  video: VideoItem;
  variant?: "default" | "popular";
}

export default function VideoCard({ video, variant = "default" }: VideoCardProps) {
  return (
    <motion.a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block text-left w-full border border-white/10 rounded-xl overflow-hidden bg-black/40 hover:border-white/30 transition-all duration-300"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative overflow-hidden aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
          {video.duration}
        </div>
        {video.tags.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#FA0F00]/90 text-white">
              {video.tags[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-3 group-hover:rainbow-text">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-white/50 text-xs">
          {variant === "popular" && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViewCount(video.viewCount)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatRelativeDate(video.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.duration}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
