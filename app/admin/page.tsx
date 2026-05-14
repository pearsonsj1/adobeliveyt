import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Header from "@/components/adobe-live/Header";
import AdminDashboard from "@/components/adobe-live/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics Dashboard — Adobe Live",
  robots: { index: false, follow: false },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Server-only: bypasses RLS so `/admin` can read analytics tables (RLS allows SELECT only to `authenticated`). */
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function fetchAnalytics() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      contentClicks7d: [],
      contentClicks30d: [],
      searchQueries7d: [],
      ytCtaClicks7d: [],
      timeSpent7d: [],
      pageViews7d: [],
      pageViews30d: [],
      guideClicks7d: [],
    };
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const supabase = createClient(SUPABASE_URL, key);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    contentClicks7d,
    contentClicks30d,
    searchQueries7d,
    ytCtaClicks7d,
    timeSpent7d,
    pageViews7d,
    pageViews30d,
    guideClicks7d,
  ] = await Promise.all([
    supabase
      .from("content_clicks")
      .select("content_id, content_title, content_type, section, tags, created_at")
      .gte("created_at", since7d)
      .limit(1000),
    supabase
      .from("content_clicks")
      .select("content_id, content_title, content_type, section, tags, created_at")
      .gte("created_at", since30d)
      .limit(2000),
    supabase
      .from("search_queries")
      .select("query, results_count, clicked_video_id, tool_filter, created_at")
      .gte("created_at", since7d)
      .limit(1000),
    supabase
      .from("youtube_cta_clicks")
      .select("video_id, video_title, source_page, created_at")
      .gte("created_at", since7d)
      .limit(500),
    supabase
      .from("page_time_spent")
      .select("video_id, seconds_spent, clicked_youtube, created_at")
      .gte("created_at", since7d)
      .limit(1000),
    supabase
      .from("page_views")
      .select("path, page_title, created_at")
      .gte("created_at", since7d)
      .limit(5000),
    supabase
      .from("page_views")
      .select("path, page_title, created_at")
      .gte("created_at", since30d)
      .limit(8000),
    supabase
      .from("guide_clicks")
      .select("node_id, choice_label, destination_url, destination_label, created_at")
      .gte("created_at", since7d)
      .limit(2000),
  ]);

  return {
    contentClicks7d: contentClicks7d.data ?? [],
    contentClicks30d: contentClicks30d.data ?? [],
    searchQueries7d: searchQueries7d.data ?? [],
    ytCtaClicks7d: ytCtaClicks7d.data ?? [],
    timeSpent7d: timeSpent7d.data ?? [],
    pageViews7d: pageViews7d.data ?? [],
    pageViews30d: pageViews30d.data ?? [],
    guideClicks7d: guideClicks7d.data ?? [],
  };
}

export default async function AdminPage() {
  const data = await fetchAnalytics();

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <Header />
      <AdminDashboard data={data} />
    </div>
  );
}
