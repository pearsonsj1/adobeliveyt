import { getCourses, type CoursePlaylist } from "@/lib/youtube";

export function slugifyInstructor(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "instructor";
}

export function instructorProfilePath(name: string): string {
  return `/instructors/${slugifyInstructor(name)}`;
}

export type InstructorSummary = {
  name: string;
  slug: string;
  courseCount: number;
  thumbnail: string;
  tools: string[];
};

export async function getInstructorSummaries(): Promise<InstructorSummary[]> {
  const courses = await getCourses();
  const map = new Map<string, CoursePlaylist[]>();
  for (const c of courses) {
    const list = map.get(c.instructor) ?? [];
    list.push(c);
    map.set(c.instructor, list);
  }
  return Array.from(map.entries())
    .map(([name, cs]) => ({
      name,
      slug: slugifyInstructor(name),
      courseCount: cs.length,
      thumbnail: cs[0]?.thumbnail ?? "",
      tools: Array.from(new Set(cs.map((x) => x.tool))).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getInstructorBySlug(slug: string): Promise<{
  name: string;
  slug: string;
  courses: CoursePlaylist[];
} | null> {
  const courses = await getCourses();
  const match = courses.find((c) => slugifyInstructor(c.instructor) === slug);
  if (!match) return null;
  const name = match.instructor;
  return {
    name,
    slug,
    courses: courses
      .filter((c) => c.instructor === name)
      .sort((a, b) => a.title.localeCompare(b.title)),
  };
}

/** Rank courses by overlap between video tags and course tool / course tags (retention + internal links). */
export function inferRelatedCoursesForVideo(
  videoTags: string[],
  courses: CoursePlaylist[],
  limit = 4
): CoursePlaylist[] {
  const tagSet = new Set(videoTags.map((t) => t.toLowerCase().trim()).filter(Boolean));
  const scored = courses.map((c) => {
    let score = 0;
    const tool = c.tool.toLowerCase();
    if (tagSet.has(tool)) score += 4;
    for (const t of c.tags) {
      const tl = t.toLowerCase();
      if (tagSet.has(tl)) score += 3;
    }
    for (const vt of Array.from(tagSet)) {
      if (vt.length < 3) continue;
      if (tool.includes(vt) || vt.includes(tool)) score += 2;
      for (const ct of c.tags) {
        const cl = ct.toLowerCase();
        if (cl.includes(vt) || vt.includes(cl)) score += 1;
      }
    }
    return { c, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title))
    .slice(0, limit)
    .map((x) => x.c);
}
