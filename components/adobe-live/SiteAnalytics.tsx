"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics";

/** Dedupe React Strict Mode double-invoke (same path within a few ms). */
let strictPathDedupe = "";
let strictPathDedupeAt = 0;

/**
 * Fires one anonymous page_view per pathname change (SPA navigations included).
 */
export default function SiteAnalytics() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastSent.current) return;
    const now = Date.now();
    if (pathname === strictPathDedupe && now - strictPathDedupeAt < 80) return;
    strictPathDedupe = pathname;
    strictPathDedupeAt = now;
    lastSent.current = pathname;
    const title = typeof document !== "undefined" ? document.title : "";
    const ref = typeof document !== "undefined" ? document.referrer : "";
    trackPageView(pathname, ref.slice(0, 500), title.slice(0, 240));
  }, [pathname]);

  return null;
}
