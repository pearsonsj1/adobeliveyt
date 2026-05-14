"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<PreviewItem | null>(null);
  const open = useCallback((i: PreviewItem) => setItem(i), []);
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
