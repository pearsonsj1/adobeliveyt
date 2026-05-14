"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Home",       href: "/" },
  { label: "Start Here", href: "/guide" },
  { label: "Calendar",   href: "/schedule" },
  { label: "Videos",     href: "/videos" },
  { label: "Tools",      href: "/tools" },
  { label: "Series",     href: "/series" },
  { label: "Courses",    href: "/courses" },
  { label: "Blog",       href: "/blog" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Refresh page data at the top of every hour so new streams appear automatically
  useEffect(() => {
    // Refresh at the next :00 or :30 mark, then every 30 minutes
    function scheduleRefresh() {
      const now = new Date();
      const mins = now.getMinutes();
      const msIntoCurrentMinute = now.getSeconds() * 1000 + now.getMilliseconds();
      const minsUntilNext = mins < 30 ? 30 - mins : 60 - mins;
      const msUntilNext = minsUntilNext * 60 * 1000 - msIntoCurrentMinute;
      const id = setTimeout(() => {
        router.refresh();
        const repeat = setInterval(() => router.refresh(), 30 * 60 * 1000);
        return () => clearInterval(repeat);
      }, msUntilNext);
      return () => clearTimeout(id);
    }
    const cleanup = scheduleRefresh();
    return cleanup;
  }, [router]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 tracking-wide ${
                isActive(link.href)
                  ? "text-white bg-white/8"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1&utm_source=adobelive.com&utm_medium=website&utm_campaign=subscribe-header"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-xs font-bold tracking-wide transition-all duration-200 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)" }}
          >
            <Youtube className="w-3.5 h-3.5" />
            Subscribe
          </a>
          <button
            className="lg:hidden p-2 rounded-md text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0a0a0a]/98 backdrop-blur-md border-b border-white/10 overflow-hidden"
          >
            <nav className="px-4 py-3 flex flex-col gap-0.5" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-white bg-white/8"
                      : "text-white/70 hover:text-white hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1&utm_source=adobelive.com&utm_medium=website&utm_campaign=subscribe-header"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 mt-1 rounded-md text-white text-sm font-bold transition-all duration-200 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)" }}
              >
                <Youtube className="w-4 h-4" />
                Subscribe on YouTube
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
