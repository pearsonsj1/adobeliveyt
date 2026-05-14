"use client";

import { motion } from "framer-motion";
import { Youtube, MessageCircle, Users, SquarePlay as PlaySquare, ExternalLink } from "lucide-react";

function formatVideoCount(n: number): string {
  if (n <= 0) return "4,200+";
  const rounded = Math.floor(n / 50) * 50;
  return `${rounded.toLocaleString()}+`;
}

export default function CommunitySection({ videoCount = 0 }: { videoCount?: number }) {
  const CHANNEL_STATS = [
    { value: "3M+", label: "Subscribers", icon: Users },
    { value: formatVideoCount(videoCount), label: "Videos", icon: PlaySquare },
    { value: "77M+", label: "Total Views", icon: Youtube },
    { value: "Since 2016", label: "Streaming Live", icon: MessageCircle },
  ];
  return (
    <section id="community" className="py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {CHANNEL_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-8 px-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Icon className="w-5 h-5 text-[#FA0F00] mb-1" />
                <span className="text-white font-black text-2xl sm:text-3xl tracking-tight">{stat.value}</span>
                <span className="text-white/40 text-xs uppercase tracking-wider font-medium">{stat.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Join CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* YouTube Subscribe */}
          <motion.a
            href="https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-5 p-6 rounded-2xl border border-[#FA0F00]/25 bg-[#FA0F00]/5 hover:bg-[#FA0F00]/10 hover:border-[#FA0F00]/40 transition-all duration-300 overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FA0F00]/8 to-transparent" />
            <div className="relative z-10 w-12 h-12 rounded-xl bg-[#FA0F00] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FA0F00]/30">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <div className="text-white font-bold text-base mb-0.5">Subscribe on YouTube</div>
              <div className="text-white/50 text-sm">Never miss a live session or new tutorial drop.</div>
            </div>
            <ExternalLink className="relative z-10 w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors duration-200" />
          </motion.a>

          {/* Discord */}
          <motion.a
            href="https://discord.gg/adobe"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-5 p-6 rounded-2xl border border-[#5865F2]/25 bg-[#5865F2]/5 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/40 transition-all duration-300 overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/8 to-transparent" />
            <div className="relative z-10 w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#5865F2]/30">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <div className="text-white font-bold text-base mb-0.5">Join the Discord</div>
              <div className="text-white/50 text-sm">Chat with Adobe Live hosts and thousands of creators.</div>
            </div>
            <ExternalLink className="relative z-10 w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors duration-200" />
          </motion.a>
        </div>

      </div>
    </section>
  );
}
