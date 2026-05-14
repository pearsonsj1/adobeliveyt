"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Youtube, Instagram, Linkedin } from "lucide-react";

const SOCIALS = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@AdobeLiveCommunity",
    icon: Youtube,
    svgPath: null,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/adobelive/",
    icon: Instagram,
    svgPath: null,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@adobelive",
    icon: null,
    svgPath: "M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/adobelive/",
    icon: Linkedin,
    svgPath: null,
  },
  {
    label: "Behance",
    href: "https://www.behance.net/live",
    icon: null,
    svgPath: "M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.726zm-7.726-3h3.543c-.148-1.741-1.237-2.213-1.849-2.213-.966 0-1.58.643-1.694 2.213zM8 5c3.552 0 5 1.464 5 3.025 0 1.35-.673 2.24-1.964 2.763 1.585.516 2.614 1.575 2.614 3.382 0 2.236-1.622 4.03-5.65 4.03H0V5h8zm-.917 2.485H2.236v2.869h4.847c.965 0 1.639-.38 1.639-1.432 0-.96-.673-1.437-1.639-1.437zm.348 5.085H2.236v3.265h5.195c1.059 0 1.862-.548 1.862-1.658 0-1.094-.803-1.607-1.862-1.607z",
  },
  {
    label: "Discord",
    href: "https://discord.gg/p48UBK3nX2",
    icon: null,
    svgPath: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.044.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
  },
];

const RAINBOW = "linear-gradient(90deg, #FA0F00 0%, #FF6B00 22%, #FFD200 44%, #00D488 62%, #00BFFF 80%, #8B5CF6 100%)";

function SocialLink({ social, index }: { social: typeof SOCIALS[number]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = social.icon;

  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/20 transition-colors duration-200"
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <span
        className="flex items-center gap-2"
        style={hovered ? { backgroundImage: RAINBOW, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" } : { color: "rgba(255,255,255,0.45)" }}
      >
        {Icon ? (
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d={social.svgPath!} />
          </svg>
        )}
        {social.label}
      </span>
    </motion.a>
  );
}

export default function SocialFooter() {
  return (
    <footer id="socials" className="border-t border-white/8 pt-12 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* SEO content — visually hidden, fully crawlable */}
        <div className="sr-only">
          <h2>About Adobe Live — Free Adobe Tutorials & Creative Education</h2>
          <div>
            <h3>Free Adobe Tutorials</h3>
            <p>
              Adobe Live publishes free tutorials every week covering Photoshop, Illustrator, Premiere Pro, After Effects,
              Lightroom Classic, Lightroom, Adobe Firefly, Adobe Express, and InDesign. All sessions are streamed live on
              YouTube and available as free replays — no subscription required.
            </p>
          </div>
          <div>
            <h3>Learn from Adobe Experts</h3>
            <p>
              Every live stream features working creative professionals and Adobe-certified instructors demonstrating
              real-world workflows. Topics range from beginner Photoshop photo editing and Illustrator logo design
              to advanced Premiere Pro video editing, After Effects motion graphics, and AI-powered generative art with
              Adobe Firefly.
            </p>
          </div>
          <div>
            <h3>Creative Community</h3>
            <p>
              Join millions of designers, photographers, videographers, and motion artists in the Adobe Live community.
              Watch live and ask questions in real time, or browse the full library of recorded tutorials, short-form tips,
              and multi-part courses covering every major Adobe Creative Cloud application.
            </p>
          </div>
          <ul>
            {['Photoshop Tutorial','Illustrator Tutorial','Premiere Pro Tutorial','After Effects Tutorial',
              'Lightroom Tutorial','Adobe Firefly Tutorial','Adobe Express Tutorial','InDesign Tutorial',
              'Graphic Design','Video Editing','Motion Graphics','Photo Editing','Free Adobe Courses',
              'Adobe Creative Cloud','Live Streams','Design Community'].map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-8">
          {/* Brand wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-white/30 text-xs max-w-[240px] leading-relaxed">
              Live creative sessions every Tuesday&ndash;Friday on YouTube. Free to watch.
            </p>
          </motion.div>

          {/* Social links */}
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            {SOCIALS.map((social, i) => (
              <SocialLink key={social.label} social={social} index={i} />
            ))}
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/20 text-xs border-t border-white/5 pt-5">
          <span>© {new Date().getFullYear()} Adobe Inc. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <a href="https://www.adobe.com/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-white/45 transition-colors">Privacy Policy</a>
            <a href="https://www.adobe.com/legal/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-white/45 transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
