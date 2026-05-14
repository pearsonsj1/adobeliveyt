/**
 * Single source of truth: @AdobeLiveCommunity tool playlists on YouTube and
 * `/tools/[slug]` routes. Playlist IDs must match the channel playlists.
 */
export interface ToolPlaylistConfig {
  slug: string;
  /** Label on home "Learn by Tool" cards; must match YouTube proxy `tool` keys. */
  tool: string;
  /** Heading on /tools grid (may differ from `tool`, e.g. Premiere Pro vs Premiere). */
  name: string;
  /** Two-letter (or St) badge matching Learn-by-Tool cards, e.g. Ps, Ai, Pr. */
  abbr: string;
  playlistId: string;
  color: string;
  desc: string;
}

export const TOOL_PLAYLIST_CONFIG: ToolPlaylistConfig[] = [
  { slug: "photoshop", tool: "Photoshop", name: "Photoshop", abbr: "Ps", playlistId: "PLMMOwZoEbhuwaTuOc60tRTsokYGTdEG39", color: "#31A8FF", desc: "Photo editing, compositing, retouching, and AI-powered design." },
  { slug: "illustrator", tool: "Illustrator", name: "Illustrator", abbr: "Ai", playlistId: "PLMMOwZoEbhuz4RamFC4qMOUXpHWZgyS3E", color: "#FF9A00", desc: "Vector illustration, logo design, and typography." },
  { slug: "premiere", tool: "Premiere", name: "Premiere Pro", abbr: "Pr", playlistId: "PLMMOwZoEbhuw4NszLQhE9uX_IdD5rpWA0", color: "#9999FF", desc: "Video editing, color grading, and post-production workflows." },
  { slug: "after-effects", tool: "After Effects", name: "After Effects", abbr: "Ae", playlistId: "PLMMOwZoEbhuyX2RL5LE8pThYxcwHjF8Mv", color: "#9999FF", desc: "Motion graphics, visual effects, and animation." },
  { slug: "lightroom", tool: "Lightroom", name: "Lightroom", abbr: "Lr", playlistId: "PLMMOwZoEbhuwMImBhitwZ6PhRQak0615K", color: "#31A8FF", desc: "Photo organization, editing, and color correction." },
  { slug: "firefly", tool: "Firefly", name: "Firefly", abbr: "Fi", playlistId: "PLMMOwZoEbhuxPY2JftdLPXxIIcO7QRBu_", color: "#FA0F00", desc: "Generative AI for images, vectors, and creative ideation." },
  { slug: "express", tool: "Express", name: "Adobe Express", abbr: "Ex", playlistId: "PLMMOwZoEbhuwZ1J8GmHW19P8pylsT7Z2_", color: "#FF9A00", desc: "Quick design for social media, flyers, and templates." },
  { slug: "indesign", tool: "InDesign", name: "InDesign", abbr: "Id", playlistId: "PLMMOwZoEbhuzC6Mqvwovl8Y8ZeF6mXWtk", color: "#FF3366", desc: "Layout design for print, editorial, and digital publishing." },
  { slug: "fresco", tool: "Fresco", name: "Fresco", abbr: "Fr", playlistId: "PLMMOwZoEbhuwBffb0yYDkImol577KtqWI", color: "#00C2A8", desc: "Digital painting and illustration on iPad and desktop." },
  { slug: "substance-3d", tool: "Substance 3D", name: "Substance 3D", abbr: "S", playlistId: "PLMMOwZoEbhuwXLF-GsAbSTcDwbJBsa_WZ", color: "#FF6C37", desc: "3D texturing, materials, and rendering for designers." },
];

export function youtubePlaylistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}

export function getToolSlugByName(toolName: string): string {
  const c = TOOL_PLAYLIST_CONFIG.find((x) => x.tool === toolName);
  return c?.slug ?? toolName.toLowerCase().replace(/\s+/g, "-");
}

export function getToolPlaylistConfigBySlug(slug: string): ToolPlaylistConfig | undefined {
  return TOOL_PLAYLIST_CONFIG.find((x) => x.slug === slug);
}

/** Badge letters for Learn-by-Tool and `/tools` (Ps, Ai, …). */
export function toolAbbreviation(toolLabel: string): string {
  const c = TOOL_PLAYLIST_CONFIG.find((x) => x.tool === toolLabel);
  return c?.abbr ?? toolLabel.replace(/^Adobe /i, "").slice(0, 2);
}

/**
 * `video_index.tags` values that should surface on `/tools/[slug]`.
 * Includes legacy variants (e.g. indexer used "Substance" before "Substance 3D").
 */
export function indexTagFiltersForToolSlug(slug: string, canonicalTag: string): string[] {
  if (slug === "substance-3d") {
    return Array.from(new Set([canonicalTag, "Substance"]));
  }
  return [canonicalTag];
}
