"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Chapter {
  time: string;
  title: string;
}

interface Parsed {
  intro: string[];       // First 3 substantial paragraphs — always shown
  body: string[];        // Remaining paragraphs — behind "Read more"
  bulletGroups: string[][];
  chapters: Chapter[];
}

// ── helpers ────────────────────────────────────────────────────────────────

function isChapterLine(line: string): Chapter | null {
  const m = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
  return m ? { time: m[1], title: m[2].trim() } : null;
}

function isSocialLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^https?:\/\/\S+$/.test(t)) return true;
  if (/^(linktree|youtube|instagram|tiktok|threads|linkedin|discord|twitter|facebook)\s*:/i.test(t)) return true;
  if (/^(follow adobe live|follow us|connect with us)[:\s]*$/i.test(t)) return true;
  return false;
}

function isHashtagLine(line: string): boolean {
  return /^(#\w+[\s#\w]*)$/.test(line.trim()) && line.trim().startsWith("#");
}

function isBulletLine(line: string): boolean {
  // emoji bullets AND dash/dot bullets
  return /^[\u2022\-\u2013\u2014*]\s/.test(line.trim()) ||
    /^[\u{1F3AC}\u{26A1}\u{1F3A8}\u26a1\u2728\u{1F504}\u{1F9E0}\u{1F4F1}\u{1F3A5}\u{1F399}\u2702\u{1F50A}\u{1F3B5}\u{1F4AC}\u{1F4E4}\u{1F3AF}\u{1F4CA}\u2714\u2705\u{1F3AC}\u270F]/u.test(line.trim());
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ── main parser ────────────────────────────────────────────────────────────

function parse(raw: string, videoTitle: string): Parsed {
  const titleNorm = normalize(videoTitle);

  // Split into blocks separated by one or more blank lines
  const rawBlocks = raw.split(/\n{2,}/);

  const chapters: Chapter[] = [];
  const bulletGroups: string[][] = [];
  const textParas: string[] = [];
  let expectChapters = false;

  for (const block of rawBlocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Skip entirely-social blocks
    if (lines.every(isSocialLine)) continue;

    // Skip entirely-hashtag blocks
    if (lines.every(isHashtagLine)) continue;

    // "Chapters" standalone header
    if (lines.length === 1 && /^chapters$/i.test(lines[0])) {
      expectChapters = true;
      continue;
    }

    // Chapter block: at least 2 timestamped lines OR we just saw the header
    const chLines = lines.map(isChapterLine).filter(Boolean) as Chapter[];
    if (chLines.length >= 2 || (expectChapters && chLines.length > 0)) {
      chapters.push(...chLines);
      expectChapters = false;
      continue;
    }
    expectChapters = false;

    // Bullet list block: majority are bullet lines
    const bulletLines = lines.filter(isBulletLine);
    if (bulletLines.length >= 2 && bulletLines.length / lines.length >= 0.5) {
      const cleaned = bulletLines.map((l) =>
        l.replace(/^[\u2022\-\u2013\u2014*]\s*/, "").trim()
      );
      bulletGroups.push(cleaned);
      continue;
    }

    // Mixed block: strip social/hashtag lines, join remaining into paragraph
    const kept = lines.filter((l) => !isSocialLine(l) && !isHashtagLine(l));
    if (!kept.length) continue;
    const para = kept.join(" ").trim();
    if (para.length < 20) continue;

    // Skip if the paragraph is just the video title
    if (normalize(para) === titleNorm) continue;
    // Skip if the paragraph starts with the video title (title-as-first-line pattern)
    if (titleNorm.length > 10 && normalize(para).startsWith(titleNorm)) continue;

    textParas.push(para);
  }

  // Show first 3 substantial paragraphs upfront; rest behind "Read more"
  const intro = textParas.slice(0, 3);
  const body = textParas.slice(3);

  return { intro, body, bulletGroups, chapters };
}

// ── component ──────────────────────────────────────────────────────────────

interface Props {
  description: string;
  transcript?: string | null;
  videoTitle?: string;
}

export default function BlogPostBody({ description, transcript, videoTitle = "" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const { intro, body, bulletGroups, chapters } = parse(description, videoTitle);

  // "Read more" shows: remaining paragraphs + bullet groups
  const hasMore = body.length > 0 || bulletGroups.length > 0;
  const hasContent = intro.length > 0 || chapters.length > 0 || bulletGroups.length > 0;

  // If description produced nothing but transcript exists, just show transcript toggle
  if (!hasContent && !transcript) return null;

  return (
    <article className="space-y-5">

      {/* ── Intro paragraphs — always visible ─────────────────────────── */}
      {intro.map((para, i) => (
        <p key={i} className="text-[16px] sm:text-[17px] text-white/88 leading-[1.85] tracking-[0.01em]">
          {para}
        </p>
      ))}

      {/* ── Chapters card — always visible ────────────────────────────── */}
      {chapters.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 my-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35 mb-4">Chapters</h2>
          <ol className="space-y-2.5">
            {chapters.map((ch, i) => (
              <li key={i} className="flex items-baseline gap-4">
                <code className="text-[#FA0F00] font-mono text-xs font-bold w-14 flex-shrink-0 tabular-nums">{ch.time}</code>
                <span className="text-sm text-white/80 leading-snug">{ch.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Expandable: body paragraphs + bullet groups ────────────────── */}
      {hasMore && (
        <>
          {expanded && (
            <div className="space-y-5">
              {body.map((para, i) => (
                <p key={i} className="text-[16px] sm:text-[17px] text-white/85 leading-[1.85] tracking-[0.01em]">
                  {para}
                </p>
              ))}
              {bulletGroups.map((group, gi) => (
                <ul key={gi} className="space-y-3 pl-1">
                  {group.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-3 text-[15px] text-white/80 leading-relaxed">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#FA0F00] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-white/45 hover:text-white transition-colors duration-200 group pt-1"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />Show less</>
            ) : (
              <><ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />Read more</>
            )}
          </button>
        </>
      )}

      {/* ── Transcript ─────────────────────────────────────────────────── */}
      {transcript && (
        <div className="pt-2 border-t border-white/8">
          <button
            onClick={() => setTranscriptOpen((v) => !v)}
            className="flex items-center justify-between w-full py-3 text-left group"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35 group-hover:text-white/55 transition-colors">
              Full Transcript
            </span>
            {transcriptOpen
              ? <ChevronUp className="w-4 h-4 text-white/30 group-hover:text-white/55 transition-colors" />
              : <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/55 transition-colors" />
            }
          </button>
          {transcriptOpen && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 text-sm text-white/60 leading-[1.85] max-h-[500px] overflow-y-auto whitespace-pre-wrap">
              {transcript}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
