"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, ExternalLink, Youtube, X, Play } from "lucide-react";
import { ScheduleItem, formatScheduledTime } from "@/lib/youtube";
import { usePreview } from "./PreviewContext";
import { useLiveStreamIdsPoll } from "./useLiveStreamIdsPoll";

type TagColor = { bg: string; text: string; bar: string; dot: string };

const SERIES_COLOR: TagColor = { bg: "bg-white/10", text: "text-white/80", bar: "bg-white/70", dot: "#ffffff" };

const TOOL_HUE: Record<string, TagColor> = {
  // Adobe tools
  Photoshop:       { bg: "bg-[#31A8FF]/15", text: "text-[#31A8FF]", bar: "bg-[#31A8FF]", dot: "#31A8FF" },
  Lightroom:       { bg: "bg-[#4BC8EB]/15", text: "text-[#4BC8EB]", bar: "bg-[#4BC8EB]", dot: "#4BC8EB" },
  Illustrator:     { bg: "bg-[#FF9A00]/15", text: "text-[#FF9A00]", bar: "bg-[#FF9A00]", dot: "#FF9A00" },
  Express:         { bg: "bg-[#F5C400]/15", text: "text-[#F5C400]", bar: "bg-[#F5C400]", dot: "#F5C400" },
  "After Effects": { bg: "bg-[#9999FF]/15", text: "text-[#9999FF]", bar: "bg-[#9999FF]", dot: "#9999FF" },
  Premiere:        { bg: "bg-[#E478FF]/15", text: "text-[#E478FF]", bar: "bg-[#E478FF]", dot: "#E478FF" },
  Firefly:         { bg: "bg-[#FF4D4D]/15", text: "text-[#FF4D4D]", bar: "bg-[#FF4D4D]", dot: "#FF4D4D" },
  InDesign:        { bg: "bg-[#FF3366]/15", text: "text-[#FF3366]", bar: "bg-[#FF3366]", dot: "#FF3366" },
  Fresco:          { bg: "bg-[#34d399]/15", text: "text-[#34d399]", bar: "bg-[#34d399]", dot: "#34d399" },
  Substance:       { bg: "bg-[#a3e635]/15", text: "text-[#a3e635]", bar: "bg-[#a3e635]", dot: "#a3e635" },
  Dimension:       { bg: "bg-[#00C4CC]/15", text: "text-[#00C4CC]", bar: "bg-[#00C4CC]", dot: "#00C4CC" },
  Acrobat:         { bg: "bg-[#FF3D00]/15", text: "text-[#FF3D00]", bar: "bg-[#FF3D00]", dot: "#FF3D00" },
};

const ALL_SERIES = new Set([
  "File New", "Office Hours", "On the Spot", "Feature Friday",
  "Cinema Collective", "Studio Sessions", "The Unlock", "Brand Slam", "The Wrap-Up",
  "Education Edition",
]);

function isSeries(tag: string) { return ALL_SERIES.has(tag); }

function tagColor(tag: string): TagColor {
  if (ALL_SERIES.has(tag)) return SERIES_COLOR;
  return TOOL_HUE[tag] ?? { bg: "bg-white/10", text: "text-white/60", bar: "bg-white/40", dot: "#ffffff66" };
}

function toolColors(tools: string[]): TagColor {
  const relevant = tools.filter(t => t !== "Adobe Live");
  if (!relevant.length) return TOOL_HUE["Photoshop"];
  return tagColor(relevant[0]);
}

function ToolBadge({ tool }: { tool: string }) {
  const c = tagColor(tool);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {tool}
    </span>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function streamMatchesFilter(stream: ScheduleItem, activeFilters: Set<string>): boolean {
  if (activeFilters.size === 0) return true;
  const tags = stream.tools.filter(t => t !== "Adobe Live");
  return tags.some(t => activeFilters.has(t));
}

// ─── Stream card ──────────────────────────────────────────────────────────────

function StreamCard({
  item,
  forcePast,
  liveIds,
}: {
  item: ScheduleItem;
  forcePast?: boolean;
  liveIds: Set<string> | null;
}) {
  const { open } = usePreview();
  const date = new Date(item.scheduledTime);
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const effectiveIsLive = liveIds !== null ? liveIds.has(item.id) : item.isLive;
  const hasStarted = date.getTime() <= Date.now();
  const isPast = forcePast ?? (!effectiveIsLive && hasStarted);
  const tags = item.tools.filter(t => t !== "Adobe Live");
  const accent = toolColors(item.tools);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`group flex gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        effectiveIsLive
          ? "border-[#FA0F00]/40 bg-[#FA0F00]/5 hover:bg-[#FA0F00]/8 hover:border-[#FA0F00]/60"
          : "border-white/8 bg-black/20 hover:border-white/20 hover:bg-white/4"
      }`}
      onClick={() => open({
        title: item.title, thumbnail: item.thumbnail, description: item.description,
        videoUrl: item.videoUrl, tools: item.tools, host: item.host, scheduledTime: item.scheduledTime,
        isLive: effectiveIsLive,
      })}
    >
      {item.thumbnail && (
        <div className="relative flex-shrink-0 w-[120px] sm:w-[150px] aspect-video rounded-lg overflow-hidden bg-white/5">
          <img src={item.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-200" />
          {effectiveIsLive && (
            <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FA0F00] text-white text-[10px] font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          )}
          {tags.length > 0 && !effectiveIsLive && (
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${accent.bar} opacity-80`} />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">{item.title}</h3>
          {isPast ? (
            <a
              href={item.videoUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 text-white/60 hover:text-white text-[10px] font-semibold transition-all duration-200"
            >
              <Play className="w-3 h-3" />
              Replay Stream
            </a>
          ) : (
            <a
              href={item.videoUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 text-white/60 hover:text-white text-[10px] font-semibold transition-all duration-200"
            >
              <ExternalLink className="w-3 h-3" />
              Set Reminder
            </a>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
          <span className="flex items-center gap-1 text-white/45 text-xs">
            <Clock className="w-3 h-3" />{timeStr}
          </span>
          {item.host && item.host !== "Adobe Live" && (
            <span className="flex items-center gap-1 text-white/45 text-xs">
              <User className="w-3 h-3" />{item.host}
            </span>
          )}
          {!effectiveIsLive && !isPast && (
            <span className="text-white/30 text-xs">{formatScheduledTime(item.scheduledTime)}</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(t => <ToolBadge key={t} tool={t} />)}
          </div>
        )}
        {item.description && (
          <p className="text-white/30 text-xs mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Calendar day cell ────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date | null;
  streams: ScheduleItem[];
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
  liveIds: Set<string> | null;
}

function CalendarDayCell({ date, streams, isToday, isSelected, isPast, isCurrentMonth, onClick, liveIds }: DayCellProps) {
  if (!date) return <div className="aspect-square sm:aspect-[5/4]" />;

  const hasStreams = streams.length > 0;
  const isStreamLive = (s: ScheduleItem) => (liveIds !== null ? liveIds.has(s.id) : s.isLive);
  const hasLive = streams.some(isStreamLive);

  const toolBars = streams.slice(0, 3).map(s => {
    if (isStreamLive(s)) return "#FA0F00";
    return toolColors(s.tools).dot;
  });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasStreams}
      className={`relative aspect-square sm:aspect-[5/4] rounded-xl border text-left p-1.5 sm:p-2.5 transition-all duration-200 group ${
        isSelected
          ? "border-white/50 bg-white/10 shadow-lg shadow-white/5"
          : hasStreams
            ? isPast
              ? "border-white/8 bg-white/2 hover:border-white/18 hover:bg-white/5 cursor-pointer opacity-60 hover:opacity-80"
              : "border-white/12 bg-white/3 hover:border-white/30 hover:bg-white/7 cursor-pointer"
            : "border-white/4 bg-transparent cursor-default"
      }`}
    >
      <span className={`text-xs sm:text-sm font-bold block leading-none ${
        isToday ? "text-white"
          : isCurrentMonth ? (hasStreams && !isPast ? "text-white/80" : "text-white/35")
          : "text-white/18"
      }`}>
        {date.getDate()}
      </span>

      {isToday && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
      )}

      {hasStreams && (
        <div className="hidden sm:flex flex-col gap-[3px] mt-1.5">
          {toolBars.map((color, i) => (
            <span key={i} className="w-full h-[3px] rounded-full opacity-80" style={{ backgroundColor: color }} />
          ))}
          {streams.length > 3 && (
            <span className="text-[9px] text-white/30 font-semibold mt-0.5">+{streams.length - 3}</span>
          )}
        </div>
      )}

      {hasStreams && (
        <div className="flex sm:hidden gap-[3px] mt-1.5 flex-wrap">
          {toolBars.map((color, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      {hasLive && !isSelected && (
        <span className="absolute inset-0 rounded-xl ring-1 ring-[#FA0F00]/50 animate-pulse pointer-events-none" />
      )}
    </button>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
  const c = tagColor(tag);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer ${
        active
          ? `${c.bg} ${c.text} border-transparent ring-1`
          : "bg-transparent text-white/35 border-white/10 hover:border-white/25 hover:text-white/55"
      }`}
      style={active ? { ringColor: c.dot } as React.CSSProperties : undefined}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 transition-opacity duration-150"
        style={{ backgroundColor: c.dot, opacity: active ? 1 : 0.4 }}
      />
      {tag}
    </button>
  );
}

// ─── Main calendar ────────────────────────────────────────────────────────────

interface ScheduleCalendarProps {
  schedule: ScheduleItem[];
  pastStreams: ScheduleItem[];
}

export default function ScheduleCalendar({ schedule, pastStreams }: ScheduleCalendarProps) {
  const liveIds = useLiveStreamIdsPoll();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const pastIds = useMemo(() => new Set(pastStreams.map(p => p.id)), [pastStreams]);

  const allStreams = useMemo(() => [
    ...schedule,
    ...pastStreams.filter(p => !schedule.some(s => s.id === p.id)),
  ], [schedule, pastStreams]);

  // All tags used across the entire dataset (for the legend)
  const allTags = useMemo(() => Array.from(new Set(
    allStreams.flatMap(s => s.tools.filter(t => t !== "Adobe Live"))
  )), [allStreams]);

  const seriesTags = useMemo(() => allTags.filter(isSeries), [allTags]);
  const toolTags = useMemo(() => allTags.filter(t => !isSeries(t)), [allTags]);

  // Streams after applying filters
  const filteredStreams = useMemo(() =>
    allStreams.filter(s => streamMatchesFilter(s, activeFilters)),
    [allStreams, activeFilters]
  );

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function streamsForDay(d: Date): ScheduleItem[] {
    return filteredStreams
      .filter(s => isSameDay(new Date(s.scheduledTime), d))
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }

  function toggleFilter(tag: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedStreams = selectedDate ? streamsForDay(selectedDate) : [];
  const selectedLabel = selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const isSelectedToday = selectedDate ? isSameDay(selectedDate, today) : false;
  const hasFilters = activeFilters.size > 0;
  const hasAnyStreams = allStreams.length > 0;

  return (
    <div>
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4" style={{ color: "#FA0F00" }} />
          <span
            className="text-xs font-bold uppercase tracking-[0.15em] bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #FA0F00 0%, #FF6B00 50%, #FFD200 100%)" }}
          >
            Schedule
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-none">Stream Calendar</h1>
            <p className="text-white/50 text-sm mt-2 max-w-lg">
              Upcoming and past Adobe Live streams. Click any highlighted day to see details. Times shown in your local timezone.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1"
            target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all duration-200 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)" }}
          >
            <Youtube className="w-4 h-4" />
            Subscribe on YouTube
          </a>
        </div>
      </div>

      {!hasAnyStreams && (
        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-5 py-4 text-sm">
          <p className="font-semibold text-white mb-2">No streams in the calendar yet</p>
          <p className="text-white/60 text-xs leading-relaxed mb-3">
            The grid fills from your Supabase tables: upcoming and live rows in{" "}
            <code className="text-white/45">video_index</code>, and replays in{" "}
            <code className="text-white/45">past_streams</code>. Those are filled by your Edge Functions
            (for example <code className="text-white/45">index-all-videos</code> and{" "}
            <code className="text-white/45">index-past-streams</code>) after the YouTube API key is set in Bolt
            secrets. Reload this page in a few minutes, or check YouTube directly below.
          </p>
          <a
            href="https://www.youtube.com/@AdobeLiveCommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#FA0F00] text-xs font-bold hover:underline"
          >
            Open @AdobeLiveCommunity on YouTube
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Calendar grid */}
        <div>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button" onClick={prevMonth}
              className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-white font-bold text-lg">{monthLabel}</h2>
            <button
              type="button" onClick={nextMonth}
              className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-200"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-white/25 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              const streams = date ? streamsForDay(date) : [];
              const isPast = date ? date < today : false;
              const isCurrentMonth = date ? date.getMonth() === viewMonth : false;
              const isToday = date ? isSameDay(date, today) : false;
              const isSelected = date && selectedDate ? isSameDay(date, selectedDate) : false;
              return (
                <CalendarDayCell
                  key={i} date={date} streams={streams}
                  isToday={isToday} isSelected={isSelected}
                  isPast={isPast} isCurrentMonth={isCurrentMonth}
                  liveIds={liveIds}
                  onClick={() => date && setSelectedDate(date)}
                />
              );
            })}
          </div>

          {/* Legend + filters */}
          <div className="mt-5 pt-5 border-t border-white/6 space-y-4">

            {/* Status row */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
              <span className="text-white/25 text-[10px] uppercase tracking-widest font-semibold w-full sm:w-auto sm:min-w-[44px]">Status</span>
              <span className="flex items-center gap-1.5 text-white/45 text-xs font-medium">
                <span className="relative flex items-center justify-center w-2.5 h-2.5">
                  <span className="absolute w-full h-full rounded-full bg-[#FA0F00] animate-ping opacity-50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FA0F00]" />
                </span>
                Live now
              </span>
              <span className="flex items-center gap-1.5 text-white/45 text-xs font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-white/50" />
                Today
              </span>
            </div>

            {/* Series filter row */}
            {seriesTags.length > 0 && (
              <div className="flex items-start gap-3 flex-wrap">
                <span className="text-white/25 text-[10px] uppercase tracking-widest font-semibold pt-1 w-full sm:w-auto sm:min-w-[44px]">Series</span>
                <div className="flex flex-wrap gap-1.5">
                  {seriesTags.map(tag => (
                    <FilterChip
                      key={tag} tag={tag}
                      active={activeFilters.has(tag)}
                      onClick={() => toggleFilter(tag)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tools filter row */}
            {toolTags.length > 0 && (
              <div className="flex items-start gap-3 flex-wrap">
                <span className="text-white/25 text-[10px] uppercase tracking-widest font-semibold pt-1 w-full sm:w-auto sm:min-w-[44px]">Tools</span>
                <div className="flex flex-wrap gap-1.5">
                  {toolTags.map(tag => (
                    <FilterChip
                      key={tag} tag={tag}
                      active={activeFilters.has(tag)}
                      onClick={() => toggleFilter(tag)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            <AnimatePresence>
              {hasFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFilters(new Set())}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs font-medium transition-colors duration-150"
                  >
                    <X className="w-3 h-3" />
                    Clear filters ({activeFilters.size} active)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Side panel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base flex items-center gap-2 flex-wrap">
              {isSelectedToday ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex items-center justify-center w-2 h-2">
                      <span className="absolute w-full h-full rounded-full bg-white/60 animate-ping opacity-40" />
                      <span className="w-2 h-2 rounded-full bg-white/90" />
                    </span>
                    Today
                  </span>
                  {selectedStreams.some((s) => (liveIds !== null ? liveIds.has(s.id) : s.isLive)) && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FA0F00] text-white text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  )}
                  <span className="text-white/40 font-normal text-sm">{selectedLabel}</span>
                </>
              ) : (
                selectedLabel ?? "Select a day"
              )}
            </h3>
            {selectedStreams.length > 0 && (
              <span className="text-white/30 text-xs">{selectedStreams.length} stream{selectedStreams.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {selectedStreams.length > 0 ? (
              <motion.div
                key={`${selectedDate?.toISOString()}-${Array.from(activeFilters).join(",")}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {selectedStreams.map(item => (
                  <StreamCard key={item.id} item={item} forcePast={pastIds.has(item.id)} liveIds={liveIds} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-14 rounded-xl border border-white/6 bg-white/2 text-center"
              >
                <CalendarDays className="w-8 h-8 text-white/12 mb-3" />
                <p className="text-white/30 text-sm">
                  {hasFilters ? "No matching streams on this day" : "No streams on this day"}
                </p>
                <p className="text-white/18 text-xs mt-1">
                  {hasFilters ? "Try adjusting your filters" : "Select a highlighted day to see streams"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
