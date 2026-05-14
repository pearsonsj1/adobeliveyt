"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Youtube, Play, GraduationCap, Tv as Tv2, BookOpen, Film, Layers, ArrowRight } from "lucide-react";

const LINKS = [
  { href: "/videos",  icon: Play,          label: "All Videos",    color: "#FA0F00" },
  { href: "/courses", icon: GraduationCap, label: "Courses",       color: "#00C2A8" },
  { href: "/series",  icon: Tv2,           label: "Series",        color: "#FF6B00" },
  { href: "/tools",   icon: Layers,        label: "Browse by Tool", color: "#31A8FF" },
  { href: "/blog",    icon: BookOpen,      label: "Blog",          color: "#FF9A00" },
  { href: "/schedule",icon: Film,          label: "Schedule",      color: "#9999FF" },
];

export default function GuideCTA() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="relative rounded-3xl overflow-hidden border border-white/10 p-10 sm:p-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FA0F00]/10 via-[#FF6B00]/5 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,15,0,0.08)_0%,transparent_70%)]" />

          <div className="relative">
            <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Explore Adobe Live
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-xl mx-auto mb-10">
              Dive into our full library — videos, structured courses, ongoing series, and more. Everything is free.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {LINKS.map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 p-4 rounded-2xl border border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6 transition-all duration-200 text-left"
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-white/70 group-hover:text-white text-sm font-semibold transition-colors">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 ml-auto flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)" }}
              >
                <Youtube className="w-4 h-4" />
                Subscribe on YouTube
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white/70 hover:text-white text-sm border border-white/15 hover:border-white/30 transition-all duration-200"
              >
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
