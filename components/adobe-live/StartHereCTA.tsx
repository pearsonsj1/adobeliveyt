import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function StartHereCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: "radial-gradient(ellipse, #FA0F00 0%, #FF6B00 50%, transparent 100%)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
          <Compass className="w-3.5 h-3.5 text-[#FA0F00]" />
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">New here?</span>
        </div>

        <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] mb-4">
          Don&apos;t know where to start?
        </h2>
        <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          We&apos;ll help you find the right content for your skill level and the tools you use — no guesswork needed.
        </p>

        <Link
          href="/guide#pathfinder"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #FA0F00 0%, #FF6B00 100%)", boxShadow: "0 8px 32px rgba(250,15,0,0.35)" }}
        >
          Let us help
          <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
