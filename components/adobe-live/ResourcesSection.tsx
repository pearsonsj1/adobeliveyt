"use client";

import { motion } from "framer-motion";
import { Youtube, SquarePlay as PlaySquare, CalendarDays, Users, Layers, Zap, Flame, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import SectionHeader from "./SectionHeader";

interface Resource {
  icon: React.ElementType;
  label: string;
  href: string;
  external: boolean;
  color: string;
  bg: string;
}

const RESOURCES: Resource[] = [
  { icon: Youtube,      label: "Adobe Live YouTube",     href: "https://www.youtube.com/@AdobeLiveCommunity", external: true,  color: "text-[#FA0F00]", bg: "bg-[#FA0F00]/10 hover:bg-[#FA0F00]/20 border-[#FA0F00]/20 hover:border-[#FA0F00]/40" },
  { icon: PlaySquare,   label: "All Series & Courses",   href: "/series",   external: false, color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 border-[#FF6B35]/20 hover:border-[#FF6B35]/40" },
  { icon: CalendarDays, label: "Upcoming Streams",       href: "/schedule", external: false, color: "text-[#31A8FF]", bg: "bg-[#31A8FF]/10 hover:bg-[#31A8FF]/20 border-[#31A8FF]/20 hover:border-[#31A8FF]/40" },
  { icon: Users,        label: "Adobe Live Community",   href: "https://community.adobe.com", external: true,  color: "text-[#9999FF]", bg: "bg-[#9999FF]/10 hover:bg-[#9999FF]/20 border-[#9999FF]/20 hover:border-[#9999FF]/40" },
  { icon: Layers,       label: "Adobe Creative Cloud",   href: "https://creativecloud.adobe.com", external: true,  color: "text-[#FFB800]", bg: "bg-[#FFB800]/10 hover:bg-[#FFB800]/20 border-[#FFB800]/20 hover:border-[#FFB800]/40" },
  { icon: Zap,          label: "Adobe Express",          href: "https://www.adobe.com/express", external: true,  color: "text-[#FA0F00]", bg: "bg-[#FA0F00]/10 hover:bg-[#FA0F00]/20 border-[#FA0F00]/20 hover:border-[#FA0F00]/40" },
  { icon: Flame,        label: "Adobe Firefly",          href: "https://www.adobe.com/products/firefly.html", external: true,  color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 border-[#FF6B35]/20 hover:border-[#FF6B35]/40" },
];

import React from "react";

export default function ResourcesSection() {
  return (
    <section id="resources" className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          icon={Link2}
          label="Resources"
          title="Explore Adobe"
          subtitle="Everything you need to dive deeper into Adobe creative tools and the Live community."
        />

        <div className="flex flex-col gap-3">
          {RESOURCES.map((resource, i) => {
            const Icon = resource.icon;
            const inner = (
              <>
                <div className={`w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center flex-shrink-0 ${resource.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-white font-semibold text-sm flex-1">{resource.label}</span>
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors duration-200 flex-shrink-0" />
              </>
            );

            const sharedClass = `group flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 ${resource.bg}`;
            const motionProps = {
              initial: { opacity: 0, x: -15 },
              whileInView: { opacity: 1, x: 0 },
              viewport: { once: true as const },
              transition: { delay: i * 0.06, duration: 0.35 },
              whileHover: { x: 4 },
            };

            if (resource.external) {
              return (
                <motion.a
                  key={resource.label}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={sharedClass}
                  {...motionProps}
                >
                  {inner}
                </motion.a>
              );
            }

            return (
              <motion.div key={resource.label} className={sharedClass} {...motionProps}>
                <Link href={resource.href} className="flex items-center gap-4 w-full">
                  {inner}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
