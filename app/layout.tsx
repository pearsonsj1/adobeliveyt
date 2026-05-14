import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PreviewProvider } from '@/components/adobe-live/PreviewContext';
import PreviewModal from '@/components/adobe-live/PreviewModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = 'https://adobelive.com';
const TITLE = 'Adobe Live — Free Adobe Tutorials, Live Streams & Creative Education';
const DESCRIPTION =
  'Watch free live Adobe tutorials on YouTube. Learn Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly & more from world-class Adobe experts. Daily live streams, shorts, and full courses — all free.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s | Adobe Live',
  },
  description: DESCRIPTION,
  keywords: [
    'Adobe tutorials',
    'free Adobe tutorials',
    'Adobe Live',
    'Photoshop tutorial',
    'Illustrator tutorial',
    'Premiere Pro tutorial',
    'After Effects tutorial',
    'Lightroom tutorial',
    'Adobe Firefly tutorial',
    'Adobe Express tutorial',
    'Adobe InDesign tutorial',
    'live creative streams',
    'graphic design tutorials',
    'video editing tutorials',
    'motion graphics tutorials',
    'photo editing tutorials',
    'Adobe Creative Cloud tutorials',
    'learn Photoshop free',
    'learn Illustrator free',
    'learn Premiere Pro free',
    'Adobe Live YouTube',
    'Adobe tutorial YouTube',
    'creative education',
    'design community',
  ],
  authors: [{ name: 'Adobe Inc.', url: 'https://www.adobe.com' }],
  creator: 'Adobe Inc.',
  publisher: 'Adobe Inc.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#FA0F00' }],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Adobe Live',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Adobe Live — Free Adobe Tutorials & Live Creative Streams on YouTube',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@Adobe',
    creator: '@AdobeLive',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Adobe Live',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`,
        },
        sameAs: [
          'https://www.youtube.com/@AdobeLiveCommunity',
          'https://www.instagram.com/adobelive/',
          'https://www.tiktok.com/@adobelive',
          'https://www.linkedin.com/company/adobe',
          'https://www.behance.net/live',
          'https://discord.gg/p48UBK3nX2',
        ],
        parentOrganization: {
          '@type': 'Organization',
          name: 'Adobe Inc.',
          url: 'https://www.adobe.com',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Adobe Live',
        description: DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: TITLE,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        description: DESCRIPTION,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: SITE_URL,
            },
          ],
        },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'WatchAction',
          target: 'https://www.youtube.com/@AdobeLiveCommunity',
        },
      },
      {
        '@type': 'EducationalOrganization',
        '@id': `${SITE_URL}/#edu`,
        name: 'Adobe Live',
        url: SITE_URL,
        description:
          'Free creative education platform offering live Adobe software tutorials, courses, and community streams on YouTube.',
        teaches: [
          'Adobe Photoshop',
          'Adobe Illustrator',
          'Adobe Premiere Pro',
          'Adobe After Effects',
          'Adobe Lightroom',
          'Adobe Firefly',
          'Adobe Express',
          'Adobe InDesign',
          'Graphic Design',
          'Video Editing',
          'Motion Graphics',
          'Photo Editing',
        ],
        availableLanguage: 'English',
        isAccessibleForFree: true,
      },
      {
        '@type': 'VideoObject',
        name: 'Adobe Live — Free Creative Tutorials on YouTube',
        description:
          'Adobe Live streams daily creative tutorials featuring Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, and Firefly. Watch live or catch replays free on YouTube.',
        thumbnailUrl: `${SITE_URL}/og-image.jpg`,
        uploadDate: '2016-01-01',
        publisher: { '@id': `${SITE_URL}/#organization` },
        embedUrl: 'https://www.youtube.com/@AdobeLiveCommunity/live',
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <meta name="theme-color" content="#070707" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#070707]`}>
        <PreviewProvider>
          {children}
          <PreviewModal />
        </PreviewProvider>
      </body>
    </html>
  );
}
