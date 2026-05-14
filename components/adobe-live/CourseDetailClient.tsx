"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Layers,
  Eye,
} from "lucide-react";
import type { CoursePlaylist, PlaylistVideoItem } from "@/lib/youtube";
import { formatViewCount } from "@/lib/youtube";
import { instructorProfilePath } from "@/lib/instructors";
import CourseYouTubeOutboundLink from "@/components/adobe-live/CourseYouTubeOutboundLink";

type Props = {
  course: CoursePlaylist;
  videos: PlaylistVideoItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function CourseDetailClient({ course, videos }: Props) {
  const [activeVideo, setActiveVideo] = useState<PlaylistVideoItem | null>(null);
  const [playerActive, setPlayerActive] = useState(false);

  useEffect(() => {
    if (videos.length) {
      setActiveVideo(videos[0]);
      setPlayerActive(false);
    } else {
      setActiveVideo(null);
      setPlayerActive(false);
    }
  }, [videos]);

  if (videos.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-white/30 text-sm">Lessons loading — check back shortly.</p>
        <CourseYouTubeOutboundLink
          href={course.playlistUrl}
          courseId={course.id}
          title={course.title}
          tool={course.tool}
          tags={course.tags}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200"
        >
          Watch on YouTube ↗
        </CourseYouTubeOutboundLink>
      </div>
    );
  }

  const heading = `${course.title} with ${course.instructor} | Adobe Live`;

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 lg:min-h-[min(80vh,920px)] border border-white/8 rounded-2xl overflow-hidden bg-[#0a0a0a]">
      <div className="flex flex-col lg:flex-1 min-w-0">
        <div className="p-4 sm:p-6 border-b border-white/8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 border border-white/15 uppercase tracking-wide">
              {course.tool}
            </span>
            <Link
              href={instructorProfilePath(course.instructor)}
              className="flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              {course.instructor}
            </Link>
            <span className="flex items-center gap-1 text-white/40 text-xs">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              {videos.length} lessons
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">{heading}</h1>
        </div>

        <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
          {activeVideo && playerActive ? (
            <iframe
              key={activeVideo.id}
              src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <button
              type="button"
              className="block w-full h-full relative group/player text-left"
              aria-label="Play lesson"
              onClick={() => setPlayerActive(true)}
            >
              <img
                src={activeVideo?.thumbnail || course.thumbnail}
                alt={activeVideo?.title || course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover/player:bg-black/20 transition-colors duration-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#FA0F00]/90 group-hover/player:bg-[#FA0F00] group-hover/player:scale-110 flex items-center justify-center shadow-lg shadow-[#FA0F00]/40 transition-all duration-200">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
              </div>
              {activeVideo?.duration && (
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                  {activeVideo.duration}
                </div>
              )}
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 flex-1">
          {activeVideo && (
            <div>
              <h2 className="text-white font-semibold text-sm leading-snug mb-1.5 line-clamp-2">{activeVideo.title}</h2>
              {activeVideo.description ? (
                <p className="text-white/45 text-xs leading-relaxed line-clamp-4">{activeVideo.description}</p>
              ) : null}
              <a
                href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[#FA0F00] text-xs font-medium hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Watch on YouTube
              </a>
            </div>
          )}

          <div className="mt-auto pt-2 flex flex-col sm:flex-row gap-3">
            <CourseYouTubeOutboundLink
              href={course.playlistUrl}
              courseId={course.id}
              title={course.title}
              tool={course.tool}
              tags={course.tags}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200"
            >
              Watch full course ↗
            </CourseYouTubeOutboundLink>
            {activeVideo && (
              <Link
                href={`/videos/${activeVideo.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-white/70 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                Open lesson page
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/8 bg-[#070707] lg:max-h-[min(90vh,960px)]">
        <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
            {videos.length} lesson{videos.length !== 1 ? "s" : ""} in course
          </p>
        </div>
        <div className="overflow-y-auto flex-1 p-2 max-h-[50vh] lg:max-h-none">
          {videos.map((video, idx) => (
            <CourseLessonRow
              key={video.id}
              video={video}
              index={idx}
              isActive={activeVideo?.id === video.id}
              onSelect={() => {
                setActiveVideo(video);
                setPlayerActive(true);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseLessonRow({
  video,
  index,
  isActive,
  onSelect,
}: {
  video: PlaylistVideoItem;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex gap-3 p-2 rounded-xl transition-all duration-150 group ${
        isActive ? "bg-white/10" : "hover:bg-white/5"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-black"
        aria-label={`Play "${video.title}"`}
      >
        <img
          src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {isActive ? (
          <div className="absolute inset-0 bg-[#FA0F00]/60 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <Play className="w-3 h-3 text-[#FA0F00] fill-[#FA0F00] ml-0.5" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono leading-none">
            {video.duration}
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col">
        <button type="button" onClick={onSelect} className="text-left py-0.5">
          <div className="flex items-start gap-1.5">
            <span
              className={`text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                isActive ? "text-[#FA0F00]" : "text-white/25 group-hover:text-white/40"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <p
              className={`text-xs font-medium leading-snug line-clamp-2 ${
                isActive ? "text-white" : "text-white/70 group-hover:text-white/90"
              }`}
            >
              {video.title}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3 mt-1 ml-5 flex-wrap">
          {video.viewCount > 0 && (
            <span className="flex items-center gap-1 text-white/30 text-[10px]">
              <Eye className="w-2.5 h-2.5" />
              {formatViewCount(video.viewCount)}
            </span>
          )}
          {video.publishedAt && (
            <time className="text-[10px] text-white/25">{formatDate(video.publishedAt)}</time>
          )}
        </div>
        <Link
          href={`/videos/${video.id}`}
          className="mt-1 ml-5 text-[10px] text-[#FA0F00]/80 hover:text-[#FA0F00] hover:underline w-fit"
          onClick={(e) => e.stopPropagation()}
        >
          Lesson page →
        </Link>
      </div>

      {!isActive && (
        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 flex-shrink-0 self-center transition-colors" />
      )}
    </div>
  );
}
