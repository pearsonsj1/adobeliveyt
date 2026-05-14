"use client";

import { motion } from "framer-motion";
import { Play, Wand as Wand2 } from "lucide-react";
import { PlaylistVideoItem, formatViewCount, formatRelativeDate } from "@/lib/youtube";
import SectionHeader from "./SectionHeader";
import { usePreview } from "./PreviewContext";

interface MobileTemplatesSectionProps {
  templates: PlaylistVideoItem[];
}

function TemplateCard({ template, index }: { template: PlaylistVideoItem; index: number }) {
  const { open } = usePreview();
  return (
    <motion.button
      type="button"
      onClick={() => open({
        title: template.title,
        thumbnail: template.thumbnail,
        description: template.description,
        videoUrl: `https://www.youtube.com/watch?v=${template.id}`,
        duration: template.duration,
        viewCount: template.viewCount,
        publishedAt: template.publishedAt,
        tags: [],
      })}
      className="group block flex-shrink-0 w-40 sm:w-44 text-left"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div
        className="relative rounded-xl overflow-hidden border border-white/10 group-hover:border-[#FF6B35]/50 transition-all duration-300 shadow-md group-hover:shadow-[0_0_20px_rgba(255,107,53,0.15)]"
        style={{ aspectRatio: "9/16" }}
      >
        <img
          src={template.thumbnail}
          alt={template.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FF6B35]/90 text-white text-[10px] font-bold uppercase tracking-wide">
          <Wand2 className="w-2.5 h-2.5" />
          Template
        </div>
        {template.duration && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
            {template.duration}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-white text-xs font-semibold leading-snug line-clamp-2 mb-1">
            {template.title}
          </p>
          <div className="flex items-center gap-2 text-white/50 text-[10px]">
            {template.viewCount > 0 && <span>{formatViewCount(template.viewCount)}</span>}
            <span>{formatRelativeDate(template.publishedAt)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function MobileTemplatesSection({ templates }: MobileTemplatesSectionProps) {
  if (!templates.length) return null;

  return (
    <section id="mobile-templates" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={Wand2}
        label="Premiere Mobile Templates"
        title="Make Your Own Shorts!"
        subtitle="Remix these free Adobe Premiere templates — drag in your clips and post in minutes."
        action={{ label: "View all videos", href: "/videos" }}
      />

      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#070707] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#070707] to-transparent z-10" />
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {templates.map((template, i) => (
            <TemplateCard key={template.id} template={template} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
