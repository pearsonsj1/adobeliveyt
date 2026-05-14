import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadFullVideoLibrary } from "@/lib/video-library";

/** CDN + browser can cache; library updates on roughly the same cadence as `/videos` ISR. */
export const revalidate = 86400;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) {
    return NextResponse.json({ videos: [] }, { status: 200 });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const videos = await loadFullVideoLibrary(supabase);
    return NextResponse.json(
      { videos },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      },
    );
  } catch {
    return NextResponse.json({ videos: [] }, { status: 200 });
  }
}
