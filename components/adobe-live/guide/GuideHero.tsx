"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Play, X, Tv as Tv2, Users, Zap, BookOpen } from "lucide-react";

const INTRO_VIDEO_ID = "7KOdqZ4vX4I";

const FACTS = [
  { icon: Tv2,      text: "Live shows every week with working designers and educators" },
  { icon: Users,    text: "A global creative community watching and participating in real time" },
  { icon: Zap,      text: "Short-form tips, quick techniques, and deep-dive tutorials" },
  { icon: BookOpen, text: "Structured multi-session courses taught by Adobe experts — all free" },
];

export default function GuideHero() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#FA0F00]/7 blur-[130px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Top label + headline */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/60 text-xs font-semibold uppercase tracking-widest mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Compass className="w-3.5 h-3.5 text-[#FA0F00]" />
            Start Here
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Find your place in{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #FA0F00 0%, #FF6B00 50%, #FFD200 100%)" }}
            >
              Adobe Live
            </span>
          </motion.h1>

          <motion.p
            className="text-white/50 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Not sure where to start? Watch the intro, learn what we do, then use the finder below to go straight to the right content for you.
          </motion.p>
        </div>

        {/* Two-column layout: video + text */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Video player */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
            {!playing ? (
              <button
                onClick={() => setPlaying(true)}
                className="group relative w-full block"
                aria-label="Watch intro to Adobe Live"
              >
                <img
                  src={`https://i.ytimg.com/vi/${INTRO_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Watch an intro to Adobe Live"
                  className="w-full aspect-video object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#FA0F00] flex items-center justify-center shadow-xl shadow-[#FA0F00]/50 group-hover:scale-110 transition-transform duration-200">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                  <span className="text-white/80 text-sm font-semibold tracking-wide bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    Watch: What is Adobe Live?
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${INTRO_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                  title="What is Adobe Live?"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
                <button
                  onClick={() => setPlaying(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
                  aria-label="Close video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight mb-3">
                Adobe Live is a free creative education channel — built for designers, by designers.
              </h2>
              <p className="text-white/55 text-sm sm:text-base leading-relaxed">
                Every week, working creatives step into the stream and show their real process — no scripts, no hiding the mistakes. You get to watch someone actually think through a design problem live, ask questions in real time, and learn from how professionals actually work.
              </p>
            </div>

            <p className="text-white/50 text-sm leading-relaxed">
              Whether you&apos;re just starting out in Photoshop or you&apos;re deep into motion graphics in After Effects, there&apos;s a show, a series, or a course here for you. And it&apos;s all on YouTube — completely free.
            </p>

            {/* Fact list */}
            <ul className="flex flex-col gap-3">
              {FACTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#FA0F00]/10 border border-[#FA0F00]/20 flex items-center justify-center mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#FA0F00]" />
                  </div>
                  <span className="text-white/65 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
