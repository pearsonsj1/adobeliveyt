"use client";

import { motion } from "framer-motion";
import { Youtube, CalendarDays, Zap } from "lucide-react";
import Link from "next/link";

function formatVideoCount(n: number): string {
  if (n <= 0) return "4,200+";
  // Round down to nearest 50 and append +
  const rounded = Math.floor(n / 50) * 50;
  return `${rounded.toLocaleString()}+`;
}

export default function HeroSection({ videoCount = 0 }: { videoCount?: number }) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-14">
      {/* Background */}
      <div className="absolute inset-0 bg-[#070707]" />

      {/* CC rainbow glow blobs */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[1000px] h-[480px] rounded-full opacity-[0.18] blur-[120px]"
        style={{ background: "conic-gradient(from 200deg at 50% 50%, #FA0F00, #FF6B00, #FFD200, #00D488, #00BFFF, #8B5CF6, #FA0F00)" }} />
      <div className="absolute bottom-0 left-[-100px] w-[500px] h-[300px] rounded-full bg-[#00BFFF]/8 blur-3xl" />
      <div className="absolute bottom-0 right-[-80px] w-[400px] h-[280px] rounded-full bg-[#8B5CF6]/8 blur-3xl" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/70 text-xs font-bold uppercase tracking-[0.15em] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "linear-gradient(135deg, #FA0F00, #FF6B00)" }} />
          Adobe Live on YouTube
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
        >
          Where Creativity
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #FA0F00 0%, #FF6B00 22%, #FFD200 44%, #00D488 62%, #00BFFF 80%, #8B5CF6 100%)" }}
          >
            Meets Community
          </span>
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-white/55 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Free Adobe tutorials, live streams, and courses — all on YouTube. Learn Photoshop, Illustrator,
          Premiere, After Effects, Lightroom, Firefly, and more from Adobe&apos;s own creative experts.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-white font-bold text-base transition-all duration-200 shadow-[0_0_32px_rgba(250,15,0,0.25)] hover:shadow-[0_0_48px_rgba(250,15,0,0.4)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)" }}
          >
            <Youtube className="w-5 h-5" />
            Subscribe on YouTube
          </a>
          <Link
            href="/schedule"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-base transition-all duration-200"
          >
            <CalendarDays className="w-5 h-5" />
            View Upcoming Streams
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {[
            { value: "3M+", label: "Subscribers" },
            { value: formatVideoCount(videoCount), label: "Videos" },
            { value: "77M+", label: "Total Views" },
            { value: "Since 2016", label: "Streaming Live" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-white font-black text-2xl">{stat.value}</div>
              <div className="text-white/35 text-xs mt-0.5 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-14 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1.5 text-white/20"
          >
            <Zap className="w-4 h-4" />
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
          </motion.div>
        </motion.div>
      </div>

      {/* Rainbow bottom edge accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, #FA0F00, #FF6B00, #FFD200, #00D488, #00BFFF, #8B5CF6)" }} />
    </section>
  );
}
