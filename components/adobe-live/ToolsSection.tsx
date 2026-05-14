"use client";

import { Layers } from "lucide-react";
import { ToolPlaylist } from "@/lib/youtube";
import ToolCard from "./ToolCard";
import SectionHeader from "./SectionHeader";

interface ToolsSectionProps {
  playlists: ToolPlaylist[];
}

export default function ToolsSection({ playlists }: ToolsSectionProps) {
  return (
    <section id="tools" className="py-12 sm:py-16 px-4 sm:px-6">
      <SectionHeader
        icon={Layers}
        label="Start Learning"
        title="Learn by Tool"
        subtitle="Browse curated Adobe Live playlists organized by creative tool. Jump straight into what you want to master."
        action={{ label: "All tools", href: "/tools" }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {playlists.map((playlist, i) => (
          <ToolCard key={playlist.tool} playlist={playlist} index={i} />
        ))}
      </div>
    </section>
  );
}
