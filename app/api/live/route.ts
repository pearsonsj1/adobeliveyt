import { NextResponse } from "next/server";
import { refreshLiveNowCache } from "@/lib/youtube";

export const dynamic = "force-dynamic";

/**
 * Hour-aligned client polling hits this route (~1×/hr) to refresh live status
 * without waiting for the static page ISR window.
 */
export async function GET() {
  try {
    const liveStreams = await refreshLiveNowCache();
    return NextResponse.json({ liveStreams });
  } catch {
    return NextResponse.json({ liveStreams: [] as const });
  }
}
