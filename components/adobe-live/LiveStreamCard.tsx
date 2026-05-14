"use client";

import { motion } from "framer-motion";
import { Play, Eye, Clock, User, ExternalLink } from "lucide-react";
import { LiveStream, formatViewCount, formatScheduledTime } from "@/lib/youtube";

interface LiveStreamCardProps {
  stream: LiveStream;
  featured?: boolean;
}

export default function LiveStreamCard({ stream, featured = false }: LiveStreamCardProps) {
  return (
    <motion.a
      href={stream.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative border rounded-xl overflow-hidden bg-black/40 block ${
        featured ? "border-[#FA0F00]/60 shadow-[0_0_40px_rgba(250,15,0,0.15)]" : "border-white/10 hover:border-white/25"
      } transition-all duration-300`}
      whileHover={{ y: featured ? -2 : -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`relative overflow-hidden ${featured ? "aspect-video" : "aspect-video"}`}>
        <img
          src={stream.thumbnail}
          alt={stream.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {stream.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FA0F00] text-white text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live Now
          </div>
        )}

        {!stream.isLive && stream.scheduledTime && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
            <Clock className="w-3 h-3" />
            {formatScheduledTime(stream.scheduledTime)}
          </div>
        )}

        {stream.viewerCount !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xs">
            <Eye className="w-3 h-3 text-[#FA0F00]" />
            {formatViewCount(stream.viewerCount)} watching
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className={`font-bold text-white leading-snug mb-2 ${featured ? "text-lg sm:text-xl" : "text-sm sm:text-base"} line-clamp-2`}>
          {stream.title}
        </h3>
        {stream.host && (
          <div className="flex items-center gap-1.5 text-white/60 text-xs mb-3">
            <User className="w-3 h-3" />
            <span>{stream.host}</span>
          </div>
        )}
        {featured && stream.description && (
          <p className="text-white/50 text-sm line-clamp-2 mb-4">{stream.description}</p>
        )}
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            stream.isLive
              ? "bg-[#FA0F00] group-hover:bg-[#d40d00] text-white"
              : "bg-white/10 group-hover:bg-white/20 text-white border border-white/20"
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {stream.isLive ? "Watch Live" : "Set Reminder"}
        </span>
      </div>
    </motion.a>
  );
}
