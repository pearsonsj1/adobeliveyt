"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Play, Clock, Eye, Calendar, Layers, User, GraduationCap, ChevronRight, Loader as Loader2 } from "lucide-react";
import Link from "next/link";
import { usePreview } from "./PreviewContext";
import { formatViewCount, formatRelativeDate, getPlaylistVideos, getPlaylistInfo, PlaylistVideoItem } from "@/lib/youtube";

// Map tool name to internal /tools/[slug] path
const TOOL_SLUG: Record<string, string> = {
  Photoshop: "photoshop", Illustrator: "illustrator", "After Effects": "after-effects",
  Premiere: "premiere", Lightroom: "lightroom", Firefly: "firefly",
  Express: "express", InDesign: "indesign", Fresco: "fresco", "Substance 3D": "substance-3d",
};

export default function PreviewModal() {
  const { item, close } = usePreview();

  const isPlaylist = !!(item?.playlistId);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, close]);

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
            initial={false}
          >
            {isPlaylist ? (
              <PlaylistModal />
            ) : (
              <VideoModal />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Single video modal
// ---------------------------------------------------------------------------
function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/);
  return match ? match[1] : null;
}

function VideoModal() {
  const { item, close } = usePreview();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [item?.videoUrl]);

  if (!item) return null;

  const videoId = extractVideoId(item.videoUrl);
  const isPastStream = !!item.scheduledTime && new Date(item.scheduledTime) <= new Date();
  const canEmbed = !!videoId && (!item.scheduledTime || isPastStream);

  return (
    <motion.div
      className="pointer-events-auto w-full sm:w-auto sm:max-w-2xl sm:mx-4 bg-[#111] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative aspect-video w-full bg-black">
        {canEmbed && playing ? (
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <>
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/20 to-transparent" />
            {item.duration && (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                {item.duration}
              </div>
            )}
            {item.scheduledTime && (
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/80 text-white text-xs flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#FA0F00]" />
                {new Date(item.scheduledTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {new Date(item.scheduledTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
              </div>
            )}
            {canEmbed && (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center group"
                aria-label="Play video"
              >
                <div className="w-16 h-16 rounded-full bg-[#FA0F00]/90 group-hover:bg-[#FA0F00] backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[#FA0F00]/30 transition-all duration-200 group-hover:scale-110">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
              </button>
            )}
          </>
        )}
        <button onClick={close} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all z-10" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded text-xs font-semibold bg-[#FA0F00]/15 text-[#FA0F00] border border-[#FA0F00]/30">{tag}</span>
          ))}
          {item.tools?.map((tool) => (
            <span key={tool} className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-white/70 border border-white/15">{tool}</span>
          ))}
          {item.tool && !item.tools && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-white/70 border border-white/15">{item.tool}</span>
          )}
        </div>
        <h2 className="text-white font-bold text-lg leading-snug mb-3">{item.title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-white/40 text-xs mb-4">
          {item.viewCount !== undefined && item.viewCount > 0 && (
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{formatViewCount(item.viewCount)} views</span>
          )}
          {item.publishedAt && (
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatRelativeDate(item.publishedAt)}</span>
          )}
          {item.duration && (
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{item.duration}</span>
          )}
          {item.host && (
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{item.host}</span>
          )}
          {item.instructor && (
            <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />{item.instructor}</span>
          )}
        </div>
        {item.description ? (
          <p className="text-white/55 text-sm leading-relaxed mb-5 line-clamp-4">{item.description}</p>
        ) : (
          <p className="text-white/25 text-sm italic mb-5">No description available.</p>
        )}
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white font-semibold text-sm transition-colors duration-200"
        >
          <Play className="w-4 h-4 fill-white" />
          {item.scheduledTime && new Date(item.scheduledTime) > new Date() ? "Set Reminder on YouTube" : item.scheduledTime ? "Replay Stream on YouTube" : "Watch on YouTube"}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Playlist modal — description + video list + embedded player
// ---------------------------------------------------------------------------
function PlaylistModal() {
  const { item, close } = usePreview();
  const [videos, setVideos] = useState<PlaylistVideoItem[]>([]);
  const [description, setDescription] = useState("");
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<PlaylistVideoItem | null>(null);
  const [playerActive, setPlayerActive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!item?.playlistId) return;
    setLoading(true);
    setActiveVideo(null);
    setPlayerActive(false);
    const [vids, info] = await Promise.all([
      getPlaylistVideos(item.playlistId),
      getPlaylistInfo(item.playlistId),
    ]);
    setVideos(vids);
    setPlaylistTitle(info.title);
    setDescription(item.description || info.description || "");
    if (vids.length) setActiveVideo(vids[0]);
    setLoading(false);
  }, [item?.playlistId, item?.description]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!item) return null;

  return (
    <motion.div
      className="pointer-events-auto w-full sm:w-auto sm:max-w-5xl sm:mx-4 bg-[#0e0e0e] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      style={{ maxHeight: "90vh" }}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-4 sm:p-5 border-b border-white/8 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {item.tool && !item.tools && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 border border-white/15 uppercase tracking-wide">{item.tool}</span>
            )}
            {item.instructor && (
              <span className="flex items-center gap-1 text-white/40 text-xs">
                <GraduationCap className="w-3 h-3" />{item.instructor}
              </span>
            )}
            {item.videoCount !== undefined && (
              <span className="flex items-center gap-1 text-white/40 text-xs">
                <Layers className="w-3 h-3" />{item.videoCount} {item.instructor ? "lessons" : "videos"}
              </span>
            )}
          </div>
          <h2 className="text-white font-bold text-base sm:text-lg leading-snug">
            {playlistTitle || item.title}
          </h2>
        </div>
        <button onClick={close} className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left: player + description */}
        <div className="flex flex-col lg:flex-1 min-w-0">
          {/* Player */}
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
            ) : loading ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
              </div>
            ) : (
              <a
                href={activeVideo ? `https://www.youtube.com/watch?v=${activeVideo.id}` : item.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full relative group/player"
                aria-label="Watch on YouTube"
                onClick={(e) => { e.preventDefault(); setPlayerActive(true); }}
              >
                <img
                  src={activeVideo?.thumbnail || item.thumbnail}
                  alt={activeVideo?.title || item.title}
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
              </a>
            )}
          </div>

          {/* Active video info — title + description */}
          <div className="p-4 sm:p-5 border-b border-white/8 lg:border-b-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-3.5 w-3/4 bg-white/8 rounded animate-pulse" />
                <div className="h-3 w-full bg-white/8 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-white/8 rounded animate-pulse" />
              </div>
            ) : activeVideo ? (
              <div>
                <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 line-clamp-2">{activeVideo.title}</h3>
                {activeVideo.description ? (
                  <p className="text-white/45 text-xs leading-relaxed line-clamp-3">{activeVideo.description}</p>
                ) : description ? (
                  <p className="text-white/45 text-xs leading-relaxed line-clamp-3">{description}</p>
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
            ) : description ? (
              <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{description}</p>
            ) : null}
          </div>

          {/* Full course/playlist CTA — visible below description on desktop */}
          <div className="hidden lg:block p-4 sm:p-5 mt-auto">
            <Link
              href={item.instructor ? `/courses/${item.playlistId}` : item.tool ? `/tools/${TOOL_SLUG[item.tool] ?? item.tool.toLowerCase()}` : `/series/${item.playlistId}`}
              onClick={close}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-medium text-sm transition-all duration-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              {item.instructor ? "View full course page" : item.tool ? "View all tool videos" : "View full series page"}
            </Link>
          </div>
        </div>

        {/* Right: video list */}
        <div className="flex flex-col lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/8 min-h-0">
          <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              {loading ? "Loading…" : item.instructor ? `${videos.length} lesson${videos.length !== 1 ? "s" : ""} in course` : `${videos.length} video${videos.length !== 1 ? "s" : ""} in playlist`}
            </p>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-24 aspect-video flex-shrink-0 bg-white/8 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-white/8 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-white/8 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-white/30 text-sm">No videos found.</p>
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-[#FA0F00] text-sm font-medium hover:underline"
                >
                  Browse on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="p-2">
                {videos.map((video, idx) => (
                  <VideoRow
                    key={video.id}
                    video={video}
                    index={idx}
                    isActive={activeVideo?.id === video.id}
                    onSelect={() => { setActiveVideo(video); setPlayerActive(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="lg:hidden p-4 border-t border-white/8 flex-shrink-0">
        <Link
          href={item.instructor ? `/courses/${item.playlistId}` : item.tool ? `/tools/${TOOL_SLUG[item.tool] ?? item.tool.toLowerCase()}` : `/series/${item.playlistId}`}
          onClick={close}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-medium text-sm transition-all duration-200"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          {item.instructor ? "View full course page" : item.tool ? "View all tool videos" : "View full series page"}
        </Link>
      </div>
    </motion.div>
  );
}

function VideoRow({
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
      {/* Thumbnail — clicking plays in modal */}
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

      {/* Info — clicking plays in modal */}
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 py-0.5 text-left"
      >
        <div className="flex items-start gap-1.5">
          <span className={`text-[10px] font-bold flex-shrink-0 mt-0.5 ${isActive ? "text-[#FA0F00]" : "text-white/25 group-hover:text-white/40"}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className={`text-xs font-medium leading-snug line-clamp-2 ${isActive ? "text-white" : "text-white/70 group-hover:text-white/90"}`}>
            {video.title}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1.5 ml-5">
          {video.viewCount > 0 && (
            <span className="flex items-center gap-1 text-white/30 text-[10px]">
              <Eye className="w-2.5 h-2.5" />{formatViewCount(video.viewCount)}
            </span>
          )}
        </div>
      </button>

      {!isActive && <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 flex-shrink-0 self-center transition-colors" />}
    </div>
  );
}
