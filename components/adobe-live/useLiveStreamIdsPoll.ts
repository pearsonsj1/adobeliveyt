"use client";

import { useState, useEffect } from "react";

/** Match `LiveSection`: poll shortly after each hour when YouTube often flips live state. */
const POLL_MINUTES_PAST_HOUR = 2;
const POLL_INTERVAL_MS = 90_000;

/** YouTube video ids currently live (`/api/live`). Null until first fetch — overrides stale ISR `isLive`. */
export function useLiveStreamIdsPoll(): Set<string> | null {
  const [ids, setIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const timeoutRef = { id: null as ReturnType<typeof setTimeout> | null };

    async function tick() {
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { liveStreams?: { id: string; isLive?: boolean }[] };
        const live = Array.isArray(j.liveStreams) ? j.liveStreams : [];
        const idList = live.filter((s) => s.isLive !== false).map((s) => s.id);
        if (!cancelled) setIds(new Set(idList));
      } catch {
        /* ignore */
      }
    }

    function msUntilNextPollPastHourMark(): number {
      const now = new Date();
      const target = new Date(now);
      target.setMinutes(POLL_MINUTES_PAST_HOUR, 0, 0);
      if (target <= now) target.setHours(target.getHours() + 1);
      return target.getTime() - now.getTime();
    }

    function scheduleHourPoll() {
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
      timeoutRef.id = setTimeout(async () => {
        await tick();
        if (!cancelled) scheduleHourPoll();
      }, msUntilNextPollPastHourMark());
    }

    void tick();
    scheduleHourPoll();
    const intervalId = setInterval(() => void tick(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
      clearInterval(intervalId);
    };
  }, []);
  return ids;
}
