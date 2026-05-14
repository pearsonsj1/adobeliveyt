"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { Radio, Eye, ExternalLink, User, Play, Clock } from "lucide-react";
import { LiveStream, formatViewCount } from "@/lib/youtube";
import SectionHeader from "./SectionHeader";

interface LiveSectionProps {
  liveStreams: LiveStream[];
  upcomingStreams: LiveStream[];
}

/** Poll `/api/live` on mount, every 90s, and ~2 minutes past each hour (YouTube often flips live shortly after the hour). */
const POLL_MINUTES_PAST_HOUR = 2;

function useHourAlignedLivePoll(
  enabled: boolean,
  setLivePoll: Dispatch<SetStateAction<LiveStream[] | null>>,
  setUpcomingPoll: Dispatch<SetStateAction<LiveStream[] | null>>,
) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timeoutRef = { id: null as ReturnType<typeof setTimeout> | null };

    async function pollOnce() {
      if (cancelled) return;
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { liveStreams?: LiveStream[]; upcomingStreams?: LiveStream[] };
        if (!cancelled && Array.isArray(j.liveStreams)) setLivePoll(j.liveStreams);
        if (!cancelled && Array.isArray(j.upcomingStreams)) setUpcomingPoll(j.upcomingStreams);
      } catch {
        /* ignore */
      }
    }

    function msUntilNextPollTwoPast(): number {
      const now = new Date();
      const target = new Date(now);
      target.setMinutes(POLL_MINUTES_PAST_HOUR, 0, 0);
      if (target <= now) target.setHours(target.getHours() + 1);
      return target.getTime() - now.getTime();
    }

    function scheduleHourPoll() {
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
      timeoutRef.id = setTimeout(async () => {
        await pollOnce();
        if (!cancelled) scheduleHourPoll();
      }, msUntilNextPollTwoPast());
    }

    void pollOnce();
    scheduleHourPoll();
    const intervalId = setInterval(() => {
      void pollOnce();
    }, 90_000);

    return () => {
      cancelled = true;
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
      clearInterval(intervalId);
    };
  }, [enabled, setLivePoll, setUpcomingPoll]);
}

function useCountdown(targetIso: string | null) {
  const [diff, setDiff] = useState<number>(() =>
    targetIso ? Math.max(0, new Date(targetIso).getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (!targetIso) return;
    const tick = () => setDiff(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return { hours, minutes, seconds, totalSecs };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-white/35 text-[10px] uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

function NextStreamCard({ stream }: { stream: LiveStream }) {
  const { hours, minutes, seconds, totalSecs } = useCountdown(stream.scheduledTime ?? null);

  const sharpThumb = stream.thumbnail
    ? stream.thumbnail.replace(/hqdefault|mqdefault|sddefault/, "maxresdefault")
    : stream.thumbnail;

  const scheduledDate = stream.scheduledTime
    ? new Date(stream.scheduledTime).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      })
    : null;
  const scheduledTime = stream.scheduledTime
    ? new Date(stream.scheduledTime).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="group relative flex flex-col lg:flex-row w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-[0_0_60px_rgba(255,255,255,0.04)]">
        {/* Thumbnail */}
        <div className="relative lg:w-[60%] xl:w-[62%] aspect-video lg:aspect-auto lg:min-h-[420px] xl:min-h-[480px] flex-shrink-0 overflow-hidden">
          {sharpThumb ? (
            <img
              src={sharpThumb}
              alt={stream.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.includes("maxresdefault") && stream.thumbnail) {
                  img.src = stream.thumbnail;
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/80" />

          {/* Upcoming badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            Up Next
          </div>

          {/* Countdown overlay on thumbnail */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end gap-3">
              {[
                { value: hours, label: "hr" },
                { value: minutes, label: "min" },
                { value: seconds, label: "sec" },
              ].map(({ value, label }, i) => (
                <div key={label} className="flex items-end gap-1">
                  {i > 0 && <span className="text-white/25 text-xl font-black mb-1.5">:</span>}
                  <CountdownUnit value={value} label={label} />
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-2 font-medium">until stream starts</p>
          </div>
        </div>

        {/* Details */}
        <div className="relative flex flex-col justify-center gap-6 px-7 py-8 lg:px-10 lg:py-10 flex-1 bg-gradient-to-br from-[#0d0d0d] to-[#111] lg:from-black/95 lg:to-[#0f0f0f]">
          <div className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
              {scheduledDate && scheduledTime && (
                <span className="text-white/25 text-xs">· {scheduledDate} at {scheduledTime}</span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-white leading-tight">
              {stream.title}
            </h2>
            {stream.host && (
              <div className="flex items-center gap-2 text-white/55 text-sm">
                <User className="w-3.5 h-3.5" />
                <span>{stream.host}</span>
              </div>
            )}
          </div>

          {stream.description && (
            <p className="text-white/50 text-sm sm:text-base leading-relaxed line-clamp-4">
              {stream.description}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <a
              href={stream.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-white/8 hover:bg-white/14 hover:border-white/30 text-white text-sm font-bold transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              Set Reminder
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveSection({ liveStreams, upcomingStreams }: LiveSectionProps) {
  const [livePoll, setLivePoll] = useState<LiveStream[] | null>(null);
  const [upcomingPoll, setUpcomingPoll] = useState<LiveStream[] | null>(null);
  const shouldPoll = liveStreams.length > 0 || upcomingStreams.length > 0;
  useHourAlignedLivePoll(shouldPoll, setLivePoll, setUpcomingPoll);

  const effectiveLive = livePoll !== null ? livePoll : liveStreams;
  const effectiveUpcoming = upcomingPoll !== null ? upcomingPoll : upcomingStreams;
  const hasLive = effectiveLive.some((s) => s.isLive);
  const nextStream = !hasLive ? (effectiveUpcoming[0] ?? null) : null;

  if (!hasLive && !nextStream) return null;

  if (!hasLive && nextStream) {
    return (
      <section id="live" className="py-12 sm:py-16 px-4 sm:px-6">
        <SectionHeader
          icon={Clock}
          label="Coming Up"
          title="Next Stream"
          subtitle="No one is live right now — but the next stream is just around the corner."
          action={{ label: "All streams", href: "/schedule" }}
        />
        <NextStreamCard key={nextStream.id} stream={nextStream} />
      </section>
    );
  }

  const liveStream = effectiveLive[0]!;
  const sharpThumb = liveStream.thumbnail
    ? liveStream.thumbnail.replace(/hqdefault|mqdefault|sddefault/, "maxresdefault")
    : liveStream.thumbnail;

  return (
    <section id="live" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={Radio}
        label="Live Now"
        title="Streaming Right Now"
        subtitle="Adobe creators are live on YouTube — join in and watch the creative process unfold in real time."
        action={{ label: "All streams", href: "/schedule" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <a
          href={liveStream.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col lg:flex-row w-full rounded-2xl overflow-hidden border border-[#FA0F00]/50 bg-black shadow-[0_0_60px_rgba(250,15,0,0.12)] hover:shadow-[0_0_80px_rgba(250,15,0,0.22)] transition-shadow duration-500"
        >
          {/* Thumbnail */}
          <div className="relative lg:w-[60%] xl:w-[62%] aspect-video lg:aspect-auto lg:min-h-[420px] xl:min-h-[480px] flex-shrink-0 overflow-hidden">
            <img
              src={sharpThumb}
              alt={liveStream.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.includes("maxresdefault")) {
                  img.src = liveStream.thumbnail;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/80" />

            {/* Live badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FA0F00] text-white text-xs font-bold uppercase tracking-widest shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live Now
            </div>

            {/* Viewer count */}
            {liveStream.viewerCount !== null && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs">
                <Eye className="w-3 h-3 text-[#FA0F00]" />
                <span>{formatViewCount(liveStream.viewerCount)} watching</span>
              </div>
            )}

            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
                <Play className="w-9 h-9 text-white fill-white ml-1" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="relative flex flex-col justify-center gap-6 px-7 py-8 lg:px-10 lg:py-10 flex-1 bg-gradient-to-br from-[#0d0d0d] to-[#111] lg:from-black/95 lg:to-[#0f0f0f]">
            <div className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#FA0F00]/60 to-transparent hidden lg:block" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[#FA0F00] text-xs font-semibold uppercase tracking-widest">Adobe Live</span>
              </div>
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-white leading-tight">
                {liveStream.title}
              </h2>
              {liveStream.host && (
                <div className="flex items-center gap-2 text-white/55 text-sm">
                  <User className="w-3.5 h-3.5" />
                  <span>{liveStream.host}</span>
                </div>
              )}
            </div>

            {liveStream.description && (
              <p className="text-white/60 text-sm sm:text-base leading-relaxed line-clamp-4">
                {liveStream.description}
              </p>
            )}

            <div className="flex items-center gap-4 pt-1">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FA0F00] group-hover:bg-[#d40d00] text-white text-sm font-bold transition-colors duration-200 shadow-[0_0_20px_rgba(250,15,0,0.35)]">
                <ExternalLink className="w-4 h-4" />
                Watch Live
              </span>
              {liveStream.viewerCount !== null && (
                <span className="flex items-center gap-1.5 text-white/45 text-sm">
                  <Eye className="w-4 h-4" />
                  {formatViewCount(liveStream.viewerCount)} viewers
                </span>
              )}
            </div>
          </div>
        </a>
      </motion.div>
    </section>
  );
}
