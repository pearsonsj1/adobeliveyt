"use client";

import { motion } from "framer-motion";
import { Clock, User, Info, Radio, Play } from "lucide-react";
import { ScheduleItem, formatScheduledTime } from "@/lib/youtube";
import { usePreview } from "./PreviewContext";

const ALL_SERIES = new Set([
  "File New", "Office Hours", "On the Spot", "Feature Friday",
  "Cinema Collective", "Studio Sessions", "The Unlock", "Brand Slam",
  "The Wrap-Up", "Education Edition",
]);

// Tool-only colors — series tags intentionally omitted so they render white
const TOOL_COLORS: Record<string, string> = {
  Photoshop:       "bg-[#31A8FF]/20 text-[#31A8FF] border-[#31A8FF]/30",
  Lightroom:       "bg-[#4BC8EB]/20 text-[#4BC8EB] border-[#4BC8EB]/30",
  Illustrator:     "bg-[#FF9A00]/20 text-[#FF9A00] border-[#FF9A00]/30",
  Express:         "bg-[#F5C400]/20 text-[#F5C400] border-[#F5C400]/30",
  "After Effects": "bg-[#9999FF]/20 text-[#9999FF] border-[#9999FF]/30",
  Premiere:        "bg-[#E478FF]/20 text-[#E478FF] border-[#E478FF]/30",
  Firefly:         "bg-[#FF4D4D]/20 text-[#FF4D4D] border-[#FF4D4D]/30",
  InDesign:        "bg-[#FF3366]/20 text-[#FF3366] border-[#FF3366]/30",
  Fresco:          "bg-[#34d399]/20 text-[#34d399] border-[#34d399]/30",
  Substance:       "bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/30",
  Dimension:       "bg-[#00C4CC]/20 text-[#00C4CC] border-[#00C4CC]/30",
  Acrobat:         "bg-[#FF3D00]/20 text-[#FF3D00] border-[#FF3D00]/30",
};

function tagClass(tag: string): string {
  if (ALL_SERIES.has(tag)) return "bg-white/10 text-white/80 border-white/20";
  return TOOL_COLORS[tag] ?? "bg-white/10 text-white/60 border-white/20";
}

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
}

export default function ScheduleRow({ item, index }: ScheduleRowProps) {
  const { open } = usePreview();
  const date = new Date(item.scheduledTime);
  const isPast = !item.isLive && date < new Date();
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <motion.div
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
        item.isLive
          ? "border-[#FA0F00]/40 bg-[#FA0F00]/5 hover:bg-[#FA0F00]/8 hover:border-[#FA0F00]/60"
          : "border-white/8 hover:border-white/20 bg-black/20 hover:bg-white/5"
      }`}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      {/* Thumbnail — clicking opens preview */}
      {item.thumbnail && (
        <button
          type="button"
          onClick={() => open({
            title: item.title,
            thumbnail: item.thumbnail,
            description: item.description,
            videoUrl: item.videoUrl,
            tools: item.tools,
            host: item.host,
            scheduledTime: item.scheduledTime,
          })}
          className="relative flex-shrink-0 w-[100px] sm:w-[120px] aspect-video rounded-lg overflow-hidden bg-white/5 cursor-pointer"
          aria-label="Preview stream"
        >
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-200" />
        </button>
      )}

      {/* Time column */}
      <div className="hidden sm:flex flex-col items-center justify-center min-w-[56px] text-center flex-shrink-0">
        <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">{dateStr.split(",")[0]}</span>
        <span className="text-white font-bold text-sm">{timeStr}</span>
      </div>

      <div className="hidden sm:block w-px h-8 bg-white/10 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.isLive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FA0F00] text-white text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          )}
          <h4 className="text-white font-semibold text-sm leading-snug line-clamp-1">{item.title}</h4>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.host && (
            <span className="flex items-center gap-1 text-white/40 text-xs">
              <User className="w-3 h-3" />
              {item.host}
            </span>
          )}
          <span className="flex items-center gap-1 text-white/40 text-xs sm:hidden">
            <Clock className="w-3 h-3" />
            {timeStr}
          </span>
          {item.tools.map((tool) => (
            <span
              key={tool}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${tagClass(tool)}`}
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Relative time + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.isLive ? (
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FA0F00] hover:bg-[#d40d00] text-white text-xs font-semibold transition-all duration-200 shadow-lg shadow-[#FA0F00]/30"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            Watch Now
          </a>
        ) : isPast ? (
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 text-white/60 hover:text-white text-xs font-semibold transition-all duration-200"
          >
            <Play className="w-3 h-3" />
            Watch Replay
          </a>
        ) : (
          <>
            <span className="hidden sm:block text-white/30 text-xs text-right">{formatScheduledTime(item.scheduledTime)}</span>
            <button
              type="button"
              onClick={() => open({
                title: item.title,
                thumbnail: item.thumbnail,
                description: item.description,
                videoUrl: item.videoUrl,
                tools: item.tools,
                host: item.host,
                scheduledTime: item.scheduledTime,
              })}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/12 border border-white/10 text-white/40 hover:text-white/70 transition-all duration-200"
              aria-label="Preview stream"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
