"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { ScheduleItem } from "@/lib/youtube";
import ScheduleRow from "./ScheduleRow";
import SectionHeader from "./SectionHeader";

interface ScheduleSectionProps {
  schedule: ScheduleItem[];
}

// Returns all 7 days of the current Sun–Sat week.
function getThisWeekDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // back to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function groupByDay(items: ScheduleItem[], days: Date[]): Map<string, ScheduleItem[]> {
  const map = new Map<string, ScheduleItem[]>();
  for (const day of days) {
    map.set(
      day.toISOString(),
      items.filter((item) => isSameDay(new Date(item.scheduledTime), day)),
    );
  }
  return map;
}

const COLLAPSE_THRESHOLD = 2;

function DayGroup({ day, items }: { day: Date; items: ScheduleItem[] }) {
  const today = new Date();
  const isToday = isSameDay(day, today);
  const [expanded, setExpanded] = useState(false);

  const dayLabel = day.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const shortLabel = day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const overflow = items.length - COLLAPSE_THRESHOLD;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-sm font-bold flex-shrink-0 ${isToday ? "text-white" : "text-white/60"}`}>
          {isToday ? "Today" : shortLabel}
        </span>
        {isToday && (
          <span className="text-white/40 text-sm font-normal flex-shrink-0">{dayLabel}</span>
        )}
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-white/30 text-xs flex-shrink-0">
          {items.length} stream{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {(expanded ? items : items.slice(0, COLLAPSE_THRESHOLD)).map((item, i) => (
          <ScheduleRow key={item.id} item={item} index={i} />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/16 text-white/50 hover:text-white/70 text-xs font-medium transition-all duration-200 w-full justify-center"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Show less" : `Show ${overflow} more stream${overflow !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ScheduleSection({ schedule }: ScheduleSectionProps) {
  const days = getThisWeekDays();
  const grouped = groupByDay(schedule, days);
  // Only show days that have at least one stream
  const activeDays = days.filter((d) => (grouped.get(d.toISOString()) ?? []).length > 0);

  if (activeDays.length === 0) {
    return (
      <section id="schedule" className="py-12 sm:py-16 px-4 sm:px-6">
        <SectionHeader
          icon={CalendarDays}
          label="Schedule"
          title="This Week on Adobe Live"
          subtitle="Scheduled streams this week. All times shown in your local timezone."
          action={{ label: "View full calendar", href: "/schedule" }}
        />
        <p className="text-white/45 text-sm max-w-2xl leading-relaxed -mt-2 mb-2">
          No upcoming streams are indexed for this week in the database yet. Open the{" "}
          <Link href="/schedule" className="text-[#FA0F00] hover:underline font-semibold">
            full stream calendar
          </Link>{" "}
          (it may still be filling after Supabase indexing), or see what&apos;s live on{" "}
          <a
            href="https://www.youtube.com/@AdobeLiveCommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FA0F00] hover:underline font-semibold"
          >
            YouTube
          </a>
          .
        </p>
      </section>
    );
  }

  return (
    <section id="schedule" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={CalendarDays}
        label="Schedule"
        title="This Week on Adobe Live"
        subtitle="Scheduled streams this week. All times shown in your local timezone."
        action={{ label: "View full calendar", href: "/schedule" }}
      />
      <p className="text-white/35 text-xs font-semibold uppercase tracking-widest -mt-4 mb-6">
        Live Tuesday – Friday
      </p>

      <div className="flex flex-col gap-8">
        {activeDays.map((day) => {
          const key = day.toISOString();
          const items = grouped.get(key) ?? [];
          return <DayGroup key={key} day={day} items={items} />;
        })}
      </div>
    </section>
  );
}
