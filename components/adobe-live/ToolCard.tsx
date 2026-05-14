"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { ToolPlaylist } from "@/lib/youtube";
import { toolAbbreviation } from "@/lib/tool-playlists";
import { usePreview } from "./PreviewContext";

const TOOL_GRADIENTS: Record<string, string> = {
  Photoshop: "from-[#31A8FF] to-[#001E36]",
  Illustrator: "from-[#FF9A00] to-[#330000]",
  "After Effects": "from-[#9999FF] to-[#1a0050]",
  "Premiere": "from-[#9999FF] to-[#0a0030]",
  Lightroom: "from-[#31A8FF] to-[#001E36]",
  Firefly: "from-[#FA0F00] to-[#FF6B35]",
  Express: "from-[#FA0F00] to-[#FF9A00]",
  InDesign: "from-[#FF3366] to-[#330018]",
  Fresco: "from-[#00C4CC] to-[#00264D]",
  "Substance 3D": "from-[#FF6C37] to-[#2D1200]",
};

interface ToolCardProps {
  playlist: ToolPlaylist;
  index: number;
}

export default function ToolCard({ playlist, index }: ToolCardProps) {
  const { open } = usePreview();
  const gradient = TOOL_GRADIENTS[playlist.tool] || "from-gray-700 to-gray-900";
  const icon = toolAbbreviation(playlist.tool);

  const cardContent = (
    <>
      <div className={`relative aspect-video bg-gradient-to-br ${gradient} overflow-hidden`}>
        {playlist.thumbnail && (
          <img
            src={playlist.thumbnail}
            alt={playlist.tool}
            loading="lazy"
            className="w-full h-full object-cover opacity-20 transition-opacity duration-300 group-hover:opacity-30"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-2">
            <span className="text-white font-black text-lg tracking-tight">{icon}</span>
          </div>
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 bg-black/60">
        <h3 className="text-white font-bold text-sm group-hover:rainbow-text">{playlist.tool}</h3>
        {playlist.videoCount > 0 && (
          <p className="text-white/40 text-xs mt-0.5">{playlist.videoCount} videos</p>
        )}
      </div>
    </>
  );

  const sharedMotionProps = {
    className: "group relative text-left w-full border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all duration-300 block",
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay: index * 0.06, duration: 0.4 },
    whileHover: { y: -4, scale: 1.02 },
  } as const;

  return (
    <motion.button
      type="button"
      onClick={() => open({
        title: `${playlist.tool} — Playlist`,
        thumbnail: playlist.thumbnail,
        description: "",
        videoUrl: playlist.playlistUrl,
        videoCount: playlist.videoCount,
        tool: playlist.tool,
        toolSlug: playlist.slug,
        playlistId: playlist.playlistId,
      })}
      {...sharedMotionProps}
    >
      {cardContent}
    </motion.button>
  );
}
