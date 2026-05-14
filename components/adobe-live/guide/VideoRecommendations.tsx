import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Play, Clock, ArrowRight } from "lucide-react";

const TOOL_COLORS: Record<string, string> = {
  Photoshop:       "bg-[#31A8FF] text-white border-[#31A8FF]",
  Illustrator:     "bg-[#FF9A00] text-white border-[#FF9A00]",
  "After Effects": "bg-[#9999FF] text-white border-[#9999FF]",
  Premiere:        "bg-[#9999FF] text-white border-[#9999FF]",
  Lightroom:       "bg-[#31A8FF] text-white border-[#31A8FF]",
  Firefly:         "bg-[#FA0F00] text-white border-[#FA0F00]",
  Express:         "bg-[#FF9A00] text-white border-[#FF9A00]",
  InDesign:        "bg-[#FF3366] text-white border-[#FF3366]",
  Fresco:          "bg-[#00C2A8] text-white border-[#00C2A8]",
  "Substance 3D":  "bg-[#FF6C37] text-white border-[#FF6C37]",
  Substance:       "bg-[#FF6C37] text-white border-[#FF6C37]",
};

const TOOL_SLUG: Record<string, string> = {
  Photoshop: "photoshop", Illustrator: "illustrator", "After Effects": "after-effects",
  Premiere: "premiere", Lightroom: "lightroom", Firefly: "firefly",
  Express: "express", InDesign: "indesign", Fresco: "fresco", "Substance 3D": "substance-3d",
};

interface VideoRow {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  tags: string[];
}

interface Props {
  tool: string;
}

const TOOL_KEYWORD_MAP: Record<string, string[]> = {
  Photoshop:       ["photoshop"],
  Illustrator:     ["illustrator"],
  "After Effects": ["after effects", "aftereffects"],
  Premiere:        ["premiere"],
  Lightroom:       ["lightroom"],
  Firefly:         ["firefly"],
  Express:         ["adobe express"],
  InDesign:        ["indesign"],
  Fresco:          ["fresco"],
  "Substance 3D":  ["substance"],
};

export default async function VideoRecommendations({ tool }: Props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const keywords = TOOL_KEYWORD_MAP[tool] ?? [tool.toLowerCase()];
  const ilikeClauses = keywords.map((kw) => `title.ilike.%${kw}%,description.ilike.%${kw}%`).join(",");

  const { data: tagMatches } = await supabase
    .from("video_index")
    .select("id, title, thumbnail_url, video_url, duration, tags")
    .contains("tags", [tool])
    .order("published_at", { ascending: false })
    .limit(6);

  const { data: keywordMatches } = await supabase
    .from("video_index")
    .select("id, title, thumbnail_url, video_url, duration, tags")
    .or(ilikeClauses)
    .order("published_at", { ascending: false })
    .limit(8);

  const seen = new Set<string>();
  const videos: VideoRow[] = [];
  for (const v of [...(tagMatches ?? []), ...(keywordMatches ?? [])]) {
    if (!seen.has(v.id) && videos.length < 6) {
      seen.add(v.id);
      videos.push(v);
    }
  }

  if (videos.length === 0) return null;

  const toolSlug = TOOL_SLUG[tool];

  return (
    <div className="mt-6 rounded-2xl border border-white/8 bg-white/3 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FA0F00]" />
          <span className="text-white/70 text-sm font-semibold">
            {tool} videos from our library
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/8 text-white/40 text-[10px] font-bold">
            {videos.length}
          </span>
        </div>
        {toolSlug && (
          <Link
            href={`/tools/${toolSlug}`}
            className="flex items-center gap-1 text-white/40 hover:text-white/70 text-xs font-medium transition-colors"
          >
            See all {tool} videos
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/videos/${video.id}`}
            className="group flex flex-col rounded-xl border border-white/8 overflow-hidden hover:border-white/20 transition-all duration-200 bg-black/20"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-10 h-10 rounded-full bg-[#FA0F00]/90 flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
              {video.duration && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                  {video.duration}
                </div>
              )}
              {video.tags[0] && (
                <div className="absolute top-2 left-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${TOOL_COLORS[video.tags[0]] ?? "bg-black/60 text-white/80 border-white/15"}`}>
                    {video.tags[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-white/80 text-xs font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {video.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
