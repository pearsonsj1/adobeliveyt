import { TrendingUp, Flame, ChartBar as BarChart2 } from "lucide-react";
import SectionHeader from "./SectionHeader";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface TrendRow {
  content_id:    string;
  content_title: string;
  content_type:  string;
  section:       string;
  tags:          string[];
  click_count:   number;
}

interface TagTrend {
  tag:         string;
  click_count: number;
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

async function getTrendingContent(): Promise<TrendRow[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return [];
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_clicks?select=content_id,content_title,content_type,section,tags&created_at=gte.${since}&limit=200`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json() as Omit<TrendRow, "click_count">[];

    const map = new Map<string, TrendRow>();
    for (const r of rows) {
      const existing = map.get(r.content_id);
      if (existing) {
        existing.click_count++;
      } else {
        map.set(r.content_id, { ...r, click_count: 1 });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function getTrendingTags(): Promise<TagTrend[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return [];
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_clicks?select=tags&created_at=gte.${since}&limit=500`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json() as { tags: string[] }[];
    const tagMap = new Map<string, number>();
    for (const r of rows) {
      for (const tag of (r.tags ?? [])) {
        if (tag && tag !== "Adobe Live") {
          tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
        }
      }
    }
    return Array.from(tagMap.entries())
      .map(([tag, click_count]) => ({ tag, click_count }))
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 8);
  } catch {
    return [];
  }
}

const TYPE_LABEL: Record<string, string> = {
  video:    "Video",
  short:    "Short",
  tool:     "Tool",
  series:   "Series",
  course:   "Course",
  live:     "Live",
  upcoming: "Upcoming",
  template: "Template",
};

export default async function TrendingSection() {
  const [trending, trendingTags] = await Promise.all([
    getTrendingContent(),
    getTrendingTags(),
  ]);

  if (trending.length === 0 && trendingTags.length === 0) return null;

  const maxClicks = trending[0]?.click_count ?? 1;

  return (
    <section id="trending" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={TrendingUp}
        label="Trending Now"
        title="What People Are Watching"
        subtitle="The most-clicked content on this site over the last 7 days — updated about once per day."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {trending.length > 0 && (
          <div className="lg:col-span-2 space-y-2">
            {trending.map((item, i) => {
              const barWidth = Math.max(8, Math.round((item.click_count / maxClicks) * 100));
              const firstTag = item.tags?.[0];
              const tagColor = firstTag ? (TOOL_COLORS[firstTag] ?? "bg-white/10 text-white/50 border-white/15") : null;
              return (
                <div
                  key={item.content_id}
                  className="relative flex items-center gap-4 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-all duration-200"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-white/[0.04] transition-all duration-500 rounded-xl"
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="relative z-10 text-white/25 font-black text-sm w-5 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {i < 3 && (
                    <Flame className="relative z-10 w-3.5 h-3.5 flex-shrink-0 text-[#FF6B00]" />
                  )}
                  <span className="relative z-10 flex-1 text-white/80 text-sm font-medium truncate">
                    {item.content_title || item.content_id}
                  </span>
                  <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
                    {tagColor && firstTag && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border hidden sm:inline ${tagColor}`}>
                        {firstTag}
                      </span>
                    )}
                    <span className="text-white/30 text-[10px] font-medium uppercase tracking-wide hidden md:inline">
                      {TYPE_LABEL[item.content_type] ?? item.content_type}
                    </span>
                    <span className="text-white/50 text-xs font-bold tabular-nums">
                      {item.click_count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {trendingTags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-white/40" />
              <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Top Tools</span>
            </div>
            {trendingTags.map((item, i) => {
              const colorCls = TOOL_COLORS[item.tag] ?? "bg-white/10 text-white/60 border-white/15";
              const maxTagClicks = trendingTags[0]?.click_count ?? 1;
              const barWidth = Math.max(10, Math.round((item.click_count / maxTagClicks) * 100));
              return (
                <div key={item.tag} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-all duration-200">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-white/[0.04] rounded-xl transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="relative z-10 text-white/25 font-black text-xs w-4 text-center">{i + 1}</span>
                  <span className={`relative z-10 px-2 py-0.5 rounded text-[10px] font-bold border ${colorCls}`}>
                    {item.tag}
                  </span>
                  <span className="relative z-10 ml-auto text-white/40 text-xs font-bold tabular-nums">{item.click_count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
