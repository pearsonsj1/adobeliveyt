"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Radio, BookOpen, Zap, Users, GraduationCap, Layers, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    icon: Radio,
    color: "#FA0F00",
    title: "Live on YouTube",
    description:
      "We broadcast live creative sessions, Q&As, and design challenges multiple times a week — watch designers work in real time and ask questions as they happen.",
    tag: "Live Streams",
    href: "/#live",
  },
  {
    icon: BookOpen,
    color: "#FF6B00",
    title: "In-depth Tutorials",
    description:
      "Hundreds of tutorials across every major Adobe tool — from beginner walkthroughs to professional workflows used by working creatives.",
    tag: "Tutorials",
    href: "/videos",
  },
  {
    icon: GraduationCap,
    color: "#FFD200",
    title: "Structured Courses",
    description:
      "Multi-part learning series taught by industry professionals. Go deep on a subject and build real skills at your own pace.",
    tag: "Courses",
    href: "/#courses",
  },
  {
    icon: Zap,
    color: "#00C2A8",
    title: "Shorts & Quick Tips",
    description:
      "60-second bursts of creative inspiration, technique highlights, and behind-the-scenes moments. Perfect for your feed.",
    tag: "Shorts",
    href: "/#shorts",
  },
  {
    icon: Users,
    color: "#0099FF",
    title: "Community First",
    description:
      "Adobe Live is built around creators helping creators. Our shows are interactive — you can participate, ask questions, and influence what happens on screen.",
    tag: "Community",
    href: "https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1",
    external: true,
  },
  {
    icon: Layers,
    color: "#00C4CC",
    title: "Every Adobe Tool",
    description:
      "Photoshop, Illustrator, Premiere, After Effects, Firefly, Fresco — if Adobe makes it, we cover it.",
    tag: "Tools",
    href: "/#tools",
  },
];

export default function WhoWeAre() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold uppercase tracking-[0.15em] bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #FA0F00 0%, #FF6B00 50%, #FFD200 100%)" }}
            >
              Who We Are
            </span>
          </div>
          <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight max-w-xl">
            A creative community that broadcasts live
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-2xl leading-relaxed">
            Adobe Live is YouTube&apos;s home for live creative education — real designers, real tools, real work. Here&apos;s what we&apos;re made of.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {PILLARS.map((pillar, i) => {
            const showExplore = pillar.title !== "Community First";

            const inner = (
              <>
                {/* Glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at top left, ${pillar.color}12 0%, transparent 60%)` }}
                />

                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                  style={{ background: `${pillar.color}18`, border: `1px solid ${pillar.color}30` }}
                >
                  <pillar.icon className="w-5 h-5" style={{ color: pillar.color }} />
                </div>

                <div
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ background: `${pillar.color}18`, color: pillar.color }}
                >
                  {pillar.tag}
                </div>

                <h3 className="text-white font-bold text-base mb-2 leading-snug">{pillar.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed flex-1">{pillar.description}</p>

                {showExplore && (
                  <div className="flex items-center gap-1 mt-4 text-xs font-semibold transition-colors duration-200"
                    style={{ color: pillar.color }}>
                    Explore
                    <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                )}
              </>
            );

            const cardClass = "group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-white/16 hover:bg-white/5 transition-all duration-300 block text-left h-full";

            return (
              <motion.div
                key={pillar.title}
                className="h-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                {pillar.external ? (
                  <a href={pillar.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
                    {inner}
                  </a>
                ) : (
                  <Link href={pillar.href} className={cardClass}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
