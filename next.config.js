/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Allow YouTube embeds/thumbs; keep this site from being framed elsewhere.
 * In dev, allow local Supabase (`127.0.0.1:54321`) for connect-src.
 */
const CONNECT_EXTRA = isDev
  ? ' http://127.0.0.1:54321 http://localhost:54321 ws://127.0.0.1:54321 ws://localhost:54321'
  : '';

const CONTENT_SECURITY_POLICY = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://www.google.com https://*.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://*.ytimg.com https://img.youtube.com https://www.youtube.com https://*.youtube.com https://yt3.ggpht.com https://*.ggpht.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.youtube.com https://*.youtube.com https://www.google.com https://*.google.com https://www.googleapis.com https://i.ytimg.com${CONNECT_EXTRA}`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://www.google.com https://*.google.com",
  "media-src 'self' https://www.youtube.com https://*.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), fullscreen=(self "https://www.youtube.com" "https://www.youtube-nocookie.com"), picture-in-picture=*',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
