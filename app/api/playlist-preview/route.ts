import { NextRequest, NextResponse } from "next/server";
import { getPlaylistVideos, getPlaylistInfo } from "@/lib/youtube";

export const dynamic = "force-dynamic";

/** Server-side playlist data for the preview modal (avoids calling Supabase from the browser). */
export async function GET(req: NextRequest) {
  const playlistId = req.nextUrl.searchParams.get("playlistId");
  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });
  }
  try {
    const [videos, info] = await Promise.all([
      getPlaylistVideos(playlistId),
      getPlaylistInfo(playlistId),
    ]);
    return NextResponse.json({
      videos,
      title: info.title,
      description: info.description,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
