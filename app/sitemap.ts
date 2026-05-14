import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getRecurringSeries, getCourses } from '@/lib/youtube';
import { getInstructorSummaries } from '@/lib/instructors';

const SITE_URL = 'https://adobelive.com';

export const revalidate = 86400;

const TOOL_SLUGS = [
  'photoshop', 'illustrator', 'premiere', 'after-effects',
  'lightroom', 'firefly', 'express', 'indesign', 'fresco', 'substance-3d',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [series, courses, instructors] = await Promise.all([
    getRecurringSeries(),
    getCourses(),
    getInstructorSummaries(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: new Date(), changeFrequency: 'hourly',  priority: 1 },
    { url: `${SITE_URL}/guide`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/videos`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/schedule`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/blog`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.85 },
    { url: `${SITE_URL}/tools`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${SITE_URL}/series`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${SITE_URL}/courses`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${SITE_URL}/instructors`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.72 },
    // Individual tool pages
    ...TOOL_SLUGS.map((slug) => ({
      url: `${SITE_URL}/tools/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Individual series pages
    ...series.map((s) => ({
      url: `${SITE_URL}/series/${s.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Individual course pages
    ...courses.map((c) => ({
      url: `${SITE_URL}/courses/${c.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...instructors.map((i) => ({
      url: `${SITE_URL}/instructors/${i.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.68,
    })),
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnon) {
    return staticRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnon);

    // Fetch ALL indexed videos with no limit — paginate in batches if needed
    let allVideos: { id: string; published_at: string | null; is_live_stream: boolean }[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('video_index')
        .select('id, published_at, is_live_stream')
        .order('published_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error || !data || data.length === 0) break;
      allVideos = allVideos.concat(data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysMs  = 90 * 24 * 60 * 60 * 1000;

    // Only non-stream videos for /videos/ and /blog/ routes
    const publicVideos = allVideos.filter((v) => v.is_live_stream === false);

    const videoRoutes: MetadataRoute.Sitemap = publicVideos.map((v) => {
      const age = v.published_at ? now - new Date(v.published_at).getTime() : Infinity;
      const changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] =
        age < thirtyDaysMs ? 'weekly' : 'monthly';
      const priority = age < thirtyDaysMs ? 0.75 : age < ninetyDaysMs ? 0.65 : 0.55;
      return {
        url: `${SITE_URL}/videos/${v.id}`,
        lastModified: v.published_at ? new Date(v.published_at) : new Date(),
        changeFrequency,
        priority,
      };
    });

    const blogRoutes: MetadataRoute.Sitemap = publicVideos.map((v) => {
      const age = v.published_at ? now - new Date(v.published_at).getTime() : Infinity;
      const changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] =
        age < thirtyDaysMs ? 'weekly' : 'monthly';
      const priority = age < thirtyDaysMs ? 0.7 : age < ninetyDaysMs ? 0.6 : 0.5;
      return {
        url: `${SITE_URL}/blog/${v.id}`,
        lastModified: v.published_at ? new Date(v.published_at) : new Date(),
        changeFrequency,
        priority,
      };
    });

    return [...staticRoutes, ...videoRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
