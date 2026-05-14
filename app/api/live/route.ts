import { NextResponse } from "next/server";
import type { LiveStream } from "@/lib/youtube";
import { refreshLiveNowCache, getUpcomingStreams } from "@/lib/youtube";

export const dynamic = "force-dynamic";

/**
 * Client polling refreshes live status and the upcoming list without waiting for ISR.
 */
export async function GET() {
  const [liveRes, upRes] = await Promise.allSettled([
    refreshLiveNowCache(),
    getUpcomingStreams(),
  ]);
  const liveStreams: LiveStream[] = liveRes.status === "fulfilled" ? liveRes.value : [];
  const upcomingStreams: LiveStream[] = upRes.status === "fulfilled" ? upRes.value : [];
  return NextResponse.json({ liveStreams, upcomingStreams });
}
