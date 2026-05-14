/**
 * Full-channel `index-all-videos` is expensive (YouTube quota). A **daily** job
 * (e.g. GitHub Actions) should be the primary driver; these site-side triggers
 * are fallbacks only when the index is older than this window — avoids
 * duplicate full indexes from traffic shortly after a cron run.
 */
export const INDEX_ALL_VIDEOS_STALE_MS = 48 * 60 * 60 * 1000;
