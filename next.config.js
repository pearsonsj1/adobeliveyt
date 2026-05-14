/** @type {import('next').NextConfig} */

/**
 * Minimal CSP: only constrain frames + who can embed this site.
 * A broader policy (script-src/img-src/connect-src) is easy to get wrong and
 * can silently break styling, fonts, or client fetches — keep defaults for those.
 */
const CONTENT_SECURITY_POLICY = [
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://www.google.com https://*.google.com",
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
