import { Suspense } from "react";
import Header from "@/components/adobe-live/Header";
import GuideHero from "@/components/adobe-live/guide/GuideHero";
import WhoWeAre from "@/components/adobe-live/guide/WhoWeAre";
import PathFinder from "@/components/adobe-live/guide/PathFinder";
import VideoRecommendations from "@/components/adobe-live/guide/VideoRecommendations";
import GuideCTA from "@/components/adobe-live/guide/GuideCTA";
import SocialFooter from "@/components/adobe-live/SocialFooter";

const SITE_URL = 'https://adobelive.com';

export const metadata = {
  title: "Start Here — Find Your Place in Adobe Live",
  description: "New to Adobe Live? Find exactly where to start. Watch an intro, discover what we do, and get matched to the right shows, courses, and tutorials for your creative goals.",
  alternates: {
    canonical: `${SITE_URL}/guide`,
  },
  openGraph: {
    type: 'website' as const,
    url: `${SITE_URL}/guide`,
    title: "Start Here — Find Your Place in Adobe Live",
    description: "New to Adobe Live? Find exactly where to start. Watch an intro, discover what we do, and get matched to the right shows, courses, and tutorials for your creative goals.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Adobe Live Guide — Start Here' }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: "Start Here — Find Your Place in Adobe Live",
    description: "New to Adobe Live? Find exactly where to start.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const VALID_TOOLS = [
  "Photoshop", "Illustrator", "After Effects", "Premiere",
  "Lightroom", "Firefly", "Express", "InDesign", "Fresco", "Substance 3D",
];

interface PageProps {
  searchParams: { tool?: string };
}

const guideJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/guide#webpage`,
      url: `${SITE_URL}/guide`,
      name: 'Start Here — Find Your Place in Adobe Live',
      description: 'New to Adobe Live? Find exactly where to start. Watch an intro, discover what we do, and get matched to the right shows, courses, and tutorials for your creative goals.',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guide', item: `${SITE_URL}/guide` },
        ],
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Adobe Live?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Adobe Live is a free creative education channel on YouTube featuring live streams, tutorials, courses, and short-form tips taught by working designers and Adobe experts.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Adobe Live free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes — all Adobe Live content is completely free on YouTube. No subscription required.',
          },
        },
        {
          '@type': 'Question',
          name: 'What Adobe tools does Adobe Live cover?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Adobe Live covers Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Firefly, Adobe Express, InDesign, Fresco, and Substance 3D.',
          },
        },
      ],
    },
  ],
};

export default function GuidePage({ searchParams }: PageProps) {
  const tool = VALID_TOOLS.find(
    (t) => t.toLowerCase() === (searchParams.tool ?? "").toLowerCase()
  ) ?? null;

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd) }} />
      <Header />
      <GuideHero />
      <main>
        <WhoWeAre />
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div id="pathfinder" className="scroll-mt-20">
          <PathFinder initialTool={tool} />
        </div>

        {tool && (
          <section id="video-recommendations" className="py-0 pb-12 px-4 sm:px-6 scroll-mt-20">
            <div className="max-w-4xl mx-auto">
              <Suspense fallback={
                <div className="mt-6 rounded-2xl border border-white/8 bg-white/3 p-5 animate-pulse h-48" />
              }>
                <VideoRecommendations tool={tool} />
              </Suspense>
            </div>
          </section>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <GuideCTA />
      </main>
      <SocialFooter />
    </div>
  );
}
