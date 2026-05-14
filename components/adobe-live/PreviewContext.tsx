"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { trackContentClick } from "@/lib/analytics";

export interface PreviewItem {
  title: string;
  thumbnail: string;
  description: string;
  videoUrl: string;
  // optional enrichment fields
  duration?: string;
  viewCount?: number;
  publishedAt?: string;
  tags?: string[];
  videoCount?: number;
  tool?: string;
  tools?: string[];
  host?: string | null;
  /** True only when YouTube currently lists this video as live (passed from schedule UI). */
  isLive?: boolean;
  scheduledTime?: string;
  instructor?: string;
  // playlist-specific: if set, modal will fetch and show playlist videos
  playlistId?: string;
}

interface PreviewContextValue {
  item: PreviewItem | null;
  open: (item: PreviewItem) => void;
  close: () => void;
}

const PreviewContext = createContext<PreviewContextValue>({
  item: null,
  open: () => {},
  close: () => {},
});

function youtubeIdFromUrl(url: string): string | null {
  const v = url.match(/[?&]v=([^&#]+)/);
  if (v) return v[1];
  const shorts = url.match(/youtube\.com\/shorts\/([^/?#]+)/);
  if (shorts) return shorts[1];
  return null;
}

function tagsForAnalytics(i: PreviewItem): string[] {
  if (i.tags?.length) return i.tags;
  if (i.tools?.length) return i.tools;
  if (i.tool) return [i.tool];
  return ["Adobe Live"];
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<PreviewItem | null>(null);
  const open = useCallback((i: PreviewItem) => {
    const contentId = i.playlistId ?? youtubeIdFromUrl(i.videoUrl) ?? "unknown";
    const contentType = i.playlistId
      ? i.instructor
        ? "course"
        : i.tool
          ? "tool"
          : "series"
      : "video";
    trackContentClick(contentId, i.title, contentType, "preview-modal", tagsForAnalytics(i));
    setItem(i);
  }, []);
  const close = useCallback(() => setItem(null), []);
  return (
    <PreviewContext.Provider value={{ item, open, close }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
