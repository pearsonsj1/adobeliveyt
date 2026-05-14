"use client";

import { useEffect, useRef } from "react";
import { trackTimeSpent, trackYouTubeCTA } from "@/lib/analytics";

interface Props {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
}

export default function VideoPageTracker({ videoId, videoTitle, videoUrl }: Props) {
  const startTime = useRef(Date.now());
  const clickedYoutube = useRef(false);

  useEffect(() => {
    startTime.current = Date.now();
    clickedYoutube.current = false;

    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href") ?? "";
      if (href.includes("youtube.com") || href.includes("youtu.be")) {
        clickedYoutube.current = true;
        trackYouTubeCTA(videoId, videoTitle, "video-page");
      }
    }

    function sendTimeSpent() {
      const seconds = Math.round((Date.now() - startTime.current) / 1000);
      trackTimeSpent(videoId, seconds, clickedYoutube.current);
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("beforeunload", sendTimeSpent);
    // Also send on visibility change (tab switch, mobile background)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendTimeSpent();
    });

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("beforeunload", sendTimeSpent);
    };
  }, [videoId, videoTitle, videoUrl]);

  return null;
}
