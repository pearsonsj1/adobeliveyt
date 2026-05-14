"use client";

import { motion } from "framer-motion";
import { Tv as Tv2, ArrowRight } from "lucide-react";
import { RecurringSeries } from "@/lib/youtube";
import SectionHeader from "./SectionHeader";
import { usePreview } from "./PreviewContext";

interface SeriesSectionProps {
  series: RecurringSeries[];
}

const CADENCE_COLORS: Record<string, string> = {
  Weekly: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Monthly: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  Series: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export default function SeriesSection({ series }: SeriesSectionProps) {
  return (
    <section id="series" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={Tv2}
        label="Ongoing Shows"
        title="Recurring Series"
        subtitle="Regular shows and ongoing series from Adobe Live — bookmark your favorites and never miss an episode."
        action={{ label: "All series", href: "/series" }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {series.map((show, i) => (
          <SeriesCard key={show.id} show={show} index={i} />
        ))}
      </div>
    </section>
  );
}

function SeriesCard({ show, index }: { show: RecurringSeries; index: number }) {
  const { open } = usePreview();
  const cadenceClass = CADENCE_COLORS[show.cadence] ?? CADENCE_COLORS.Series;

  const cardContent = (
    <>
      <div className="relative aspect-video overflow-hidden w-full">
        <img
          src={show.thumbnail}
          alt={show.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-[#FA0F00]/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[#FA0F00]/30">
            <ArrowRight className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white/80 text-xs font-medium">
          {show.videoCount} episodes
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cadenceClass}`}>
            {show.cadence}
          </span>
        </div>
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
          {show.title}
        </h3>
        <p className="text-white/50 text-sm leading-relaxed line-clamp-2 flex-1">{show.description}</p>
        <div className="flex items-center gap-1 text-[#FA0F00] text-sm font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          View series <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </>
  );

  const sharedMotionProps = {
    className: "group relative flex flex-col text-left w-full rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-300 bg-white/[0.03]",
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay: index * 0.08, duration: 0.45 },
    whileHover: { y: -4 },
  } as const;

  return (
    <motion.button
      type="button"
      onClick={() => open({
        title: show.title,
        thumbnail: show.thumbnail,
        description: show.description,
        videoUrl: show.playlistUrl,
        videoCount: show.videoCount,
        playlistId: show.playlistId,
        seriesSlug: show.id,
      })}
      {...sharedMotionProps}
    >
      {cardContent}
    </motion.button>
  );
}
