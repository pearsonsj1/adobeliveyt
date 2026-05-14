"use client";

import { BookOpen } from "lucide-react";
import { VideoItem } from "@/lib/youtube";
import VideoCard from "./VideoCard";
import SectionHeader from "./SectionHeader";

interface TutorialsSectionProps {
  videos: VideoItem[];
}

export default function TutorialsSection({ videos }: TutorialsSectionProps) {
  return (
    <section id="tutorials" className="py-20 sm:py-28 px-4 sm:px-6">
      <SectionHeader
        icon={BookOpen}
        label="Latest Tutorials"
        title="Fresh from Adobe Live"
        subtitle="The most recent tutorials and live session replays from Adobe Live on YouTube."
        action={{ label: "View all videos", href: "/videos" }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
