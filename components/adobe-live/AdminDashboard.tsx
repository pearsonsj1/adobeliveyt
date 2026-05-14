"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Search, Youtube, Clock, Eye, ChartBar as BarChart2, Flame, ChevronRight, CircleAlert as AlertCircle, Zap, LayoutGrid, MousePointer2 } from "lucide-react";

interface ContentClick {
  content_id: string;
  content_title: string;
  content_type: string;
  section: string;
  tags: string[];
  created_at: string;
}

interface SearchQuery {
  query: string;
  results_count: number;
  clicked_video_id: string | null;
  tool_filter: string;
  created_at: string;
}

interface YtCtaClick {
  video_id: string;
  video_title: string;
  source_page: string;
  created_at: string;
}

interface TimeSpent {
  video_id: string;
  seconds_spent: number;
  clicked_youtube: boolean;
  created_at: string;
}

interface PageView {
  path: string;
  page_title: string;
  created_at: string;
}

interface GuideClick {
  node_id: string;
  choice_label: string;
  destination_url: string | null;
  destination_label: string | null;
  created_at: string;
}

interface Props {
  data: {
    contentClicks7d: ContentClick[];
    contentClicks30d: ContentClick[];
    searchQueries7d: SearchQuery[];
    ytCtaClicks7d: YtCtaClick[];
    timeSpent7d: TimeSpent[];
    pageViews7d: PageView[];
    pageViews30d: PageView[];
    guideClicks7d: GuideClick[];
  };
}

const TOOL_COLORS: Record<string, string> = {
  Photoshop:       "bg-[#31A8FF]/15 text-[#31A8FF] border-[#31A8FF]/30",
  Illustrator:     "bg-[#FF9A00]/15 text-[#FF9A00] border-[#FF9A00]/30",
  Premiere:        "bg-[#9999FF]/15 text-[#9999FF] border-[#9999FF]/30",
  "After Effects": "bg-[#9999FF]/15 text-[#9999FF] border-[#9999FF]/30",
  Lightroom:       "bg-[#31A8FF]/15 text-[#31A8FF] border-[#31A8FF]/30",
  Firefly:         "bg-[#FA0F00]/15 text-[#FA0F00] border-[#FA0F00]/30",
  Express:         "bg-[#FF9A00]/15 text-[#FF9A00] border-[#FF9A00]/30",
  InDesign:        "bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/30",
  Fresco:          "bg-[#00C2A8]/15 text-[#00C2A8] border-[#00C2A8]/30",
  "Substance 3D":  "bg-[#FF6C37]/15 text-[#FF6C37] border-[#FF6C37]/30",
};

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/8 bg-white/[0.03] p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-white text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-white/40" />
      <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest">{title}</h2>
    </div>
  );
}

type Period = "7d" | "30d";

export default function AdminDashboard({ data }: Props) {
  const [period, setPeriod] = useState<Period>("7d");
  const clicks = period === "7d" ? data.contentClicks7d : data.contentClicks30d;
  const pageViews = period === "7d" ? data.pageViews7d : data.pageViews30d;

  // Top content by clicks
  const topContent = useMemo(() => {
    const map = new Map<string, { title: string; type: string; tags: string[]; count: number }>();
    for (const c of clicks) {
      const existing = map.get(c.content_id);
      if (existing) existing.count++;
      else map.set(c.content_id, { title: c.content_title || c.content_id, type: c.content_type, tags: c.tags ?? [], count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [clicks]);

  // Top sections
  const topSections = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clicks) map.set(c.section, (map.get(c.section) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [clicks]);

  // Top tool tags
  const topTools = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clicks) {
      for (const tag of (c.tags ?? [])) {
        if (tag && tag !== "Adobe Live") map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [clicks]);

  // Top search queries
  const topSearches = useMemo(() => {
    const map = new Map<string, { count: number; clicks: number; zeroResults: number }>();
    for (const q of data.searchQueries7d) {
      const existing = map.get(q.query);
      if (existing) {
        existing.count++;
        if (q.clicked_video_id) existing.clicks++;
        if (q.results_count === 0) existing.zeroResults++;
      } else {
        map.set(q.query, {
          count: 1,
          clicks: q.clicked_video_id ? 1 : 0,
          zeroResults: q.results_count === 0 ? 1 : 0,
        });
      }
    }
    return Array.from(map.entries())
      .map(([query, s]) => ({ query, ...s }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [data.searchQueries7d]);

  // Zero-result searches (content gap opportunities)
  const contentGaps = useMemo(() => {
    return topSearches.filter((s) => s.zeroResults > 0).sort((a, b) => b.zeroResults - a.zeroResults).slice(0, 8);
  }, [topSearches]);

  // YouTube CTA conversions
  const ytConversions = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    for (const c of data.ytCtaClicks7d) {
      const existing = map.get(c.video_id);
      if (existing) existing.count++;
      else map.set(c.video_id, { title: c.video_title || c.video_id, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [data.ytCtaClicks7d]);

  // Avg time spent
  const avgTimeSpent = useMemo(() => {
    if (!data.timeSpent7d.length) return 0;
    return Math.round(data.timeSpent7d.reduce((s, r) => s + r.seconds_spent, 0) / data.timeSpent7d.length);
  }, [data.timeSpent7d]);

  const ytClickRate = useMemo(() => {
    if (!data.timeSpent7d.length) return 0;
    return Math.round((data.timeSpent7d.filter((r) => r.clicked_youtube).length / data.timeSpent7d.length) * 100);
  }, [data.timeSpent7d]);

  // Most engaging videos (avg time)
  const mostEngaging = useMemo(() => {
    const map = new Map<string, { totalSecs: number; sessions: number }>();
    for (const r of data.timeSpent7d) {
      const existing = map.get(r.video_id);
      if (existing) { existing.totalSecs += r.seconds_spent; existing.sessions++; }
      else map.set(r.video_id, { totalSecs: r.seconds_spent, sessions: 1 });
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, avgSecs: Math.round(v.totalSecs / v.sessions), sessions: v.sessions }))
      .filter((v) => v.sessions >= 2)
      .sort((a, b) => b.avgSecs - a.avgSecs)
      .slice(0, 6);
  }, [data.timeSpent7d]);

  const topRoutes = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of pageViews) map.set(r.path, (map.get(r.path) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 16);
  }, [pageViews]);

  const pathfinderDestinations = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of data.guideClicks7d) {
      const label =
        (g.destination_label && g.destination_label.trim()) ||
        (g.destination_url && g.destination_url.trim()) ||
        g.choice_label;
      if (!label) continue;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [data.guideClicks7d]);

  const totalClicks = clicks.length;
  const uniqueContent = new Set(clicks.map((c) => c.content_id)).size;
  const totalPageViews = pageViews.length;

  return (
    <main className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-[#FA0F00]" />
            <span className="text-xs font-bold text-[#FA0F00] uppercase tracking-widest">Analytics</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div>
              <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight">Channel Dashboard</h1>
              <p className="text-white/40 text-sm mt-1">Site engagement data to inform Adobe Live content decisions.</p>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <form action="/api/admin/logout" method="POST" className="self-end">
                <button
                  type="submit"
                  className="text-[11px] font-semibold text-white/35 hover:text-white/60 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Log out
                </button>
              </form>
              {/* Period toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 w-fit">
              {(["7d", "30d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-150 ${
                    period === p ? "bg-white/12 text-white border border-white/15" : "text-white/45 hover:text-white/70"
                  }`}
                >
                  {p === "7d" ? "Last 7 days" : "Last 30 days"}
                </button>
              ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} sub={`${period} period`} icon={Eye} color="bg-[#FA0F00]/15 text-[#FA0F00]" />
          <StatCard label="Content Pieces" value={uniqueContent} sub="received clicks" icon={TrendingUp} color="bg-[#31A8FF]/15 text-[#31A8FF]" />
          <StatCard label="Page views" value={totalPageViews.toLocaleString()} sub={`route hits (${period})`} icon={LayoutGrid} color="bg-[#A855F7]/15 text-[#A855F7]" />
          <StatCard label="Avg Time on Video" value={formatSeconds(avgTimeSpent)} sub="per page visit (7d)" icon={Clock} color="bg-[#FF9A00]/15 text-[#FF9A00]" />
          <StatCard label="YouTube CTA Rate" value={`${ytClickRate}%`} sub="clicked Watch on YT (7d)" icon={Youtube} color="bg-[#00C2A8]/15 text-[#00C2A8]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

          {/* Top content */}
          <div className="lg:col-span-2">
            <SectionTitle icon={Flame} title={`Top Clicked Content — ${period}`} />
            <div className="space-y-1.5">
              {topContent.length === 0 ? (
                <p className="text-white/25 text-sm">No data yet.</p>
              ) : topContent.map((item, i) => {
                const bar = Math.max(8, Math.round((item.count / (topContent[0]?.count ?? 1)) * 100));
                const tag = item.tags[0];
                const tagColor = tag ? (TOOL_COLORS[tag] ?? "bg-white/10 text-white/50 border-white/15") : null;
                return (
                  <div key={item.title + i} className="relative flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 bg-white/[0.04] rounded-xl transition-all" style={{ width: `${bar}%` }} />
                    <span className="relative z-10 text-white/25 font-black text-sm w-5 text-center flex-shrink-0">{i + 1}</span>
                    {i < 3 && <Flame className="relative z-10 w-3.5 h-3.5 text-[#FF6B00] flex-shrink-0" />}
                    <span className="relative z-10 flex-1 text-white/80 text-sm font-medium truncate">{item.title}</span>
                    <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
                      {tagColor && tag && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border hidden sm:inline ${tagColor}`}>{tag}</span>
                      )}
                      <span className="text-white/30 text-[10px] uppercase tracking-wide hidden md:inline">{item.type}</span>
                      <span className="text-white/60 text-xs font-bold tabular-nums">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top tools + sections */}
          <div className="space-y-8">
            <div>
              <SectionTitle icon={BarChart2} title="Top Tools" />
              <div className="space-y-1.5">
                {topTools.length === 0 ? (
                  <p className="text-white/25 text-sm">No data yet.</p>
                ) : topTools.map((item, i) => {
                  const color = TOOL_COLORS[item[0]] ?? "bg-white/10 text-white/60 border-white/15";
                  const bar = Math.max(10, Math.round((item[1] / (topTools[0]?.[1] ?? 1)) * 100));
                  return (
                    <div key={item[0]} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 bg-white/[0.04] rounded-xl transition-all" style={{ width: `${bar}%` }} />
                      <span className="relative z-10 text-white/25 text-xs font-black w-4 text-center">{i + 1}</span>
                      <span className={`relative z-10 px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>{item[0]}</span>
                      <span className="relative z-10 ml-auto text-white/50 text-xs font-bold tabular-nums">{item[1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionTitle icon={ChevronRight} title="Top Sections" />
              <div className="space-y-1.5">
                {topSections.map(([section, count]) => (
                  <div key={section} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/8 bg-white/[0.02]">
                    <span className="text-white/60 text-sm capitalize">{section.replace(/-/g, " ")}</span>
                    <span className="text-white/50 text-xs font-bold tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div>
            <SectionTitle icon={LayoutGrid} title={`Top routes — ${period}`} />
            {topRoutes.length === 0 ? (
              <p className="text-white/25 text-sm">No page view data yet — appears after the page_views migration is applied and traffic arrives.</p>
            ) : (
              <div className="space-y-1.5">
                {topRoutes.map(([path, count], i) => {
                  const bar = Math.max(8, Math.round((count / (topRoutes[0]?.[1] ?? 1)) * 100));
                  return (
                    <div
                      key={path + i}
                      className="relative flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-colors"
                    >
                      <div className="absolute left-0 top-0 bottom-0 bg-white/[0.04] rounded-xl transition-all" style={{ width: `${bar}%` }} />
                      <span className="relative z-10 text-white/25 font-black text-sm w-5 text-center flex-shrink-0">{i + 1}</span>
                      <span className="relative z-10 flex-1 text-white/75 text-sm font-mono truncate">{path}</span>
                      <span className="relative z-10 text-white/60 text-xs font-bold tabular-nums flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <SectionTitle icon={MousePointer2} title="Pathfinder — top destinations (7d)" />
            {pathfinderDestinations.length === 0 ? (
              <p className="text-white/25 text-sm">No PathFinder quiz completions yet — appears after users finish flows on /guide.</p>
            ) : (
              <div className="space-y-1.5">
                {pathfinderDestinations.map(([label, count], i) => {
                  const bar = Math.max(8, Math.round((count / (pathfinderDestinations[0]?.[1] ?? 1)) * 100));
                  return (
                    <div
                      key={label + i}
                      className="relative flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-colors"
                    >
                      <div className="absolute left-0 top-0 bottom-0 bg-white/[0.04] rounded-xl transition-all" style={{ width: `${bar}%` }} />
                      <span className="relative z-10 text-white/25 font-black text-sm w-5 text-center flex-shrink-0">{i + 1}</span>
                      <span className="relative z-10 flex-1 text-white/75 text-sm font-medium truncate">{label}</span>
                      <span className="relative z-10 text-white/60 text-xs font-bold tabular-nums flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div>
            <SectionTitle icon={Search} title="Top Searches (7d)" />
            <div className="space-y-1.5">
              {topSearches.length === 0 ? (
                <p className="text-white/25 text-sm">No search data yet — appears after users search in the video library.</p>
              ) : topSearches.map((s, i) => {
                const ctr = s.count > 0 ? Math.round((s.clicks / s.count) * 100) : 0;
                return (
                  <div key={s.query + i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/15 transition-colors">
                    <span className="text-white/25 text-xs font-black w-5 text-center flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 text-white/75 text-sm font-medium truncate">{s.query}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.zeroResults > 0 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FA0F00]/15 text-[#FA0F00] text-[10px] font-bold border border-[#FA0F00]/20">
                          <AlertCircle className="w-2.5 h-2.5" />
                          no results
                        </span>
                      )}
                      <span className="text-white/30 text-[10px]">{ctr}% CTR</span>
                      <span className="text-white/50 text-xs font-bold">{s.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content gaps */}
          <div>
            <SectionTitle icon={AlertCircle} title="Content Gaps — Searches with No Results" />
            {contentGaps.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center">
                <p className="text-white/30 text-sm">No zero-result searches yet.</p>
                <p className="text-white/20 text-xs mt-1">This section highlights what users searched for but couldn&apos;t find — useful for planning new content.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {contentGaps.map((s, i) => (
                  <div key={s.query + i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#FA0F00]/20 bg-[#FA0F00]/[0.04] hover:border-[#FA0F00]/35 transition-colors">
                    <AlertCircle className="w-3.5 h-3.5 text-[#FA0F00] flex-shrink-0" />
                    <span className="flex-1 text-white/80 text-sm font-medium">&quot;{s.query}&quot;</span>
                    <span className="text-[#FA0F00]/80 text-xs font-bold flex-shrink-0">{s.zeroResults}× no results</span>
                  </div>
                ))}
                <p className="text-white/20 text-xs pt-2 px-1">These are topics users searched for that returned 0 videos. Consider creating content around these terms.</p>
              </div>
            )}
          </div>
        </div>

        {/* YouTube conversion + time spent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SectionTitle icon={Youtube} title="YouTube CTA Clicks (7d)" />
            {ytConversions.length === 0 ? (
              <p className="text-white/25 text-sm">No YouTube CTA data yet.</p>
            ) : (
              <div className="space-y-1.5">
                {ytConversions.map((item, i) => (
                  <div key={item.title + i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/15 transition-colors">
                    <span className="text-white/25 text-xs font-black w-5 text-center flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 text-white/75 text-sm font-medium truncate">{item.title}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Youtube className="w-3 h-3 text-[#FA0F00]" />
                      <span className="text-white/60 text-xs font-bold">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionTitle icon={Zap} title="Most Engaging Videos — Avg Time on Page (7d)" />
            {mostEngaging.length === 0 ? (
              <p className="text-white/25 text-sm">No time-on-page data yet.</p>
            ) : (
              <div className="space-y-1.5">
                {mostEngaging.map((item, i) => (
                  <div key={item.id + i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/15 transition-colors">
                    <span className="text-white/25 text-xs font-black w-5 text-center flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 text-white/60 text-xs font-mono truncate">{item.id}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-white/30 text-[10px]">{item.sessions} sessions</span>
                      <span className="text-white/70 text-xs font-bold tabular-nums">{formatSeconds(item.avgSecs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
