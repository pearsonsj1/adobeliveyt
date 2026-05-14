"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Play, User } from "lucide-react";
import { CoursePlaylist } from "@/lib/youtube";
import SectionHeader from "./SectionHeader";
import { usePreview } from "./PreviewContext";

interface CoursesSectionProps {
  courses: CoursePlaylist[];
}

const TOOL_COLORS: Record<string, { dot: string; badge: string }> = {
  Photoshop:       { dot: "bg-[#31A8FF]", badge: "text-white bg-[#31A8FF] border-[#31A8FF]" },
  Illustrator:     { dot: "bg-[#FF9A00]", badge: "text-white bg-[#FF9A00] border-[#FF9A00]" },
  "After Effects": { dot: "bg-[#9999FF]", badge: "text-white bg-[#9999FF] border-[#9999FF]" },
  "Premiere":      { dot: "bg-[#9999FF]", badge: "text-white bg-[#9999FF] border-[#9999FF]" },
  Lightroom:       { dot: "bg-[#31A8FF]", badge: "text-white bg-[#31A8FF] border-[#31A8FF]" },
  Firefly:         { dot: "bg-[#FA0F00]", badge: "text-white bg-[#FA0F00] border-[#FA0F00]" },
  Express:         { dot: "bg-[#FF9A00]", badge: "text-white bg-[#FF9A00] border-[#FF9A00]" },
  InDesign:        { dot: "bg-[#FF3366]", badge: "text-white bg-[#FF3366] border-[#FF3366]" },
  "Substance 3D":  { dot: "bg-[#FF6C37]", badge: "text-white bg-[#FF6C37] border-[#FF6C37]" },
};

export default function CoursesSection({ courses }: CoursesSectionProps) {
  const tools = ["All", ...Array.from(new Set(courses.flatMap((c) => c.tags)))];
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All" ? courses : courses.filter((c) => c.tags.includes(activeFilter));

  return (
    <section id="courses" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={GraduationCap}
        label="Expert-Led Courses"
        title="Learn from the Best"
        subtitle="Multi-session courses taught by industry professionals — each course is a focused deep-dive with a dedicated instructor."
        action={{ label: "All courses", href: "/courses" }}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {tools.map((tool) => {
          const colors = TOOL_COLORS[tool];
          const isActive = activeFilter === tool;
          return (
            <button
              key={tool}
              onClick={() => setActiveFilter(tool)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                isActive
                  ? "bg-white/15 border-white/30 text-white"
                  : "bg-white/[0.03] border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
              }`}
            >
              {tool !== "All" && colors && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
              )}
              {tool}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function CourseCard({ course, index }: { course: CoursePlaylist; index: number }) {
  const { open } = usePreview();
  const colors = TOOL_COLORS[course.tool] ?? { dot: "bg-white/60", badge: "text-white bg-white/20 border-white/30" };

  const cardContent = (
    <>
      <div className="relative aspect-video overflow-hidden w-full">
        <img
          src={course.thumbnail}
          alt={course.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250">
          <div className="w-11 h-11 rounded-full bg-[#FA0F00]/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[#FA0F00]/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white/80 text-[10px] font-medium">
          {course.videoCount} lessons
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {course.tags.slice(0, 2).map((tag) => {
            const tagColors = TOOL_COLORS[tag] ?? { badge: "text-white bg-white/20 border-white/30" };
            return (
              <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tagColors.badge}`}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-white/85 transition-colors">
          {course.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-white/8">
          <User className="w-3 h-3 text-white/40 flex-shrink-0" />
          <span className="text-white/50 text-xs font-medium">{course.instructor}</span>
        </div>
      </div>
    </>
  );

  const sharedMotionProps = {
    className: "group flex flex-col text-left w-full rounded-xl overflow-hidden border border-white/10 hover:border-white/25 bg-white/[0.03] transition-all duration-300",
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(index * 0.04, 0.3), duration: 0.35 },
    whileHover: { y: -4 },
  } as const;

  return (
    <motion.button
      type="button"
      onClick={() => open({
        title: course.title,
        thumbnail: course.thumbnail,
        description: "",
        videoUrl: course.playlistUrl,
        videoCount: course.videoCount,
        tool: course.tool,
        instructor: course.instructor,
        playlistId: course.playlistId,
      })}
      {...sharedMotionProps}
    >
      {cardContent}
    </motion.button>
  );
}
