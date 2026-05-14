"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, ExternalLink, Play, Wand as Wand2, Camera, Film, Pen, Image, Layers, Sparkles, BookOpen, Zap, Radio, Users, ChevronRight, Briefcase, Clock, TrendingUp, Palette, Monitor, Share2, Star, Globe, Coffee, Youtube, CalendarDays, GraduationCap as GradCapIcon, Library } from "lucide-react";
import { getToolSlugByName } from "@/lib/tool-playlists";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function logGuideClick(payload: {
  session_id: string;
  node_id: string;
  question: string;
  choice_label: string;
  destination_url?: string;
  destination_label?: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/guide_clicks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

interface Destination {
  label: string;
  description: string;
  url: string;
  tag?: string;
  toolName?: string; // if set, will also show DB video recommendations for this tool
}

interface RelatedLink {
  label: string;
  url: string;
  tag: string;
  icon: React.ElementType;
  external?: boolean;
}

interface PathNode {
  id: string;
  question: string;
  subtitle?: string;
  options: {
    label: string;
    icon: React.ElementType;
    color: string;
    next?: string;       // branch to another question
    destinations?: Destination[]; // final answer
  }[];
}

/** Section intro — editorial tone for the guide header. */
function sectionIntro(tool: string | null): { kicker: string; title: string; body: string } {
  if (tool) {
    return {
      kicker: "Guided navigation",
      title: "Where should we take you next?",
      body: `${tool} is already in context below. Use this short path to reach playlists, courses, or live programming aligned with your goal.`,
    };
  }
  return {
    kicker: "Guided navigation",
    title: "Where should we take you next?",
    body: "Answer one step at a time. We will suggest pages on this site that best match what you want to accomplish.",
  };
}

const NODES: Record<string, PathNode> = {
  root: {
    id: "root",
    question: "What brings you to Adobe Live?",
    subtitle: "Choose the option that best describes your visit — we will suggest appropriate next steps.",
    options: [
      {
        label: "I want to learn an Adobe tool",
        icon: BookOpen,
        color: "#FA0F00",
        next: "tool",
      },
      {
        label: "I want to take a structured course",
        icon: GraduationCap,
        color: "#00C2A8",
        next: "courses",
      },
      {
        label: "I want to watch live or upcoming shows",
        icon: Radio,
        color: "#FF6B00",
        next: "live",
      },
      {
        label: "I work in a creative profession",
        icon: Briefcase,
        color: "#9999FF",
        next: "profession",
      },
      {
        label: "I make content for social media",
        icon: Share2,
        color: "#FF3366",
        next: "social_creator",
      },
      {
        label: "I'm working on a specific project",
        icon: Star,
        color: "#FF9A00",
        next: "project_type",
      },
      {
        label: "I need to learn fast — I have a deadline",
        icon: Clock,
        color: "#FA0F00",
        next: "deadline",
      },
      {
        label: "I want quick inspiration or tips",
        icon: Zap,
        color: "#FFD200",
        next: "quick",
      },
      {
        label: "I want to improve a specific skill",
        icon: TrendingUp,
        color: "#00C2A8",
        next: "skill_focus",
      },
      {
        label: "I'm a student or educator",
        icon: BookOpen,
        color: "#0099FF",
        next: "education",
      },
      {
        label: "I'm new — I don't know where to start",
        icon: Sparkles,
        color: "#0099FF",
        next: "new",
      },
      {
        label: "I want to connect with the community",
        icon: Users,
        color: "#FF6B35",
        next: "community",
      },
    ],
  },

  profession: {
    id: "profession",
    question: "What kind of creative work do you do?",
    subtitle: "We will match you to content that fits how you work.",
    options: [
      {
        label: "Graphic designer / brand designer",
        icon: Palette,
        color: "#FF9A00",
        next: "profession_graphic",
      },
      {
        label: "Photographer or photo editor",
        icon: Camera,
        color: "#31A8FF",
        next: "profession_photo",
      },
      {
        label: "Video editor or filmmaker",
        icon: Film,
        color: "#9999FF",
        next: "profession_video",
      },
      {
        label: "Illustrator or digital artist",
        icon: Pen,
        color: "#FF6B35",
        next: "profession_illustrator",
      },
      {
        label: "Motion designer or VFX artist",
        icon: Layers,
        color: "#E478FF",
        next: "profession_motion",
      },
      {
        label: "Web or UI/UX designer",
        icon: Monitor,
        color: "#00C2A8",
        next: "profession_web",
      },
      {
        label: "Freelancer or independent creative",
        icon: Briefcase,
        color: "#FFD200",
        next: "profession_freelance",
      },
      {
        label: "Marketing, advertising, or campaign creative",
        icon: Sparkles,
        color: "#FF6B00",
        destinations: [
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Use Adobe Firefly and Express for on-brand visuals, campaign assets, and rapid iteration.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
          {
            label: "Adobe Express Playlist",
            description: "Templates, social graphics, and quick layouts for marketing and communications teams.",
            url: "/tools/express",
            tag: "Playlist",
            toolName: "Express",
          },
        ],
      },
      {
        label: "Creative direction, leadership, or strategy",
        icon: Star,
        color: "#FFD200",
        destinations: [
          {
            label: "Shows & series catalog",
            description: "Recurring Adobe Live programming — interviews, news, and industry discussion.",
            url: "/series",
            tag: "Series",
          },
          {
            label: "The File New Show",
            description: "Weekly creative news, tool updates, and designer-focused conversation.",
            url: "/series/file-new",
            tag: "Weekly",
          },
        ],
      },
      {
        label: "3D artist or product designer",
        icon: Globe,
        color: "#FF6C37",
        destinations: [
          {
            label: "Digital Fashion & 3D Garment Texturing",
            description: "Stephy Fung covers professional 3D workflows — Substance 3D texturing, material creation, and realistic rendering.",
            url: "/courses/stephy-fung",
            tag: "Substance 3D · 8 lessons",
          },
          {
            label: "Substance 3D Playlist",
            description: "Browse all Substance 3D content on the channel.",
            url: "/tools/substance-3d",
            tag: "Playlist",
          },
        ],
      },
    ],
  },

  profession_graphic: {
    id: "profession_graphic",
    question: "What kind of graphic design work are you focused on?",
    options: [
      {
        label: "Brand identity and logo design",
        icon: Star,
        color: "#00C2A8",
        destinations: [
          {
            label: "Branding Design, Logo Creation & Vector Illustration",
            description: "Steven Overturf walks through logo construction, brand mark development, and visual identity systems in Illustrator.",
            url: "/courses/steven-overturf",
            tag: "Illustrator · 5 lessons",
          },
          {
            label: "Brand Building & Brand Identity Design",
            description: "Brittney Megann covers building a complete brand identity from positioning to visual execution.",
            url: "/courses/brittney-megann",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Editorial and layout design",
        icon: BookOpen,
        color: "#FF3366",
        destinations: [
          {
            label: "Typography & Text-Based Design",
            description: "Jess Goldsmith covers type hierarchy, pairing, editorial layout, and using type to carry a brand voice in InDesign and Illustrator.",
            url: "/courses/jess-goldsmith",
            tag: "InDesign · 7 lessons",
          },
          {
            label: "InDesign Playlist",
            description: "All InDesign content — layout, interactive documents, print, and more.",
            url: "/tools/indesign",
            tag: "Playlist",
            toolName: "InDesign",
          },
        ],
      },
      {
        label: "Vector illustration and icons",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Vector Illustration, Effects & Texture Techniques",
            description: "Matthew Tjokro teaches advanced Illustrator — custom textures, layered effects, and crafting a distinctive visual style.",
            url: "/courses/matthew-tjokro",
            tag: "Illustrator · 8 lessons",
          },
          {
            label: "Illustrator Playlist",
            description: "The complete Illustrator library — from fundamentals to advanced techniques.",
            url: "/tools/illustrator",
            tag: "Playlist",
            toolName: "Illustrator",
          },
        ],
      },
      {
        label: "Social media and quick content",
        icon: Share2,
        color: "#FF3366",
        next: "social_creator",
      },
    ],
  },

  profession_photo: {
    id: "profession_photo",
    question: "What's your photography focus?",
    options: [
      {
        label: "Portrait and people photography",
        icon: Camera,
        color: "#31A8FF",
        destinations: [
          {
            label: "Portrait Photo Editing & Color Grading",
            description: "Idara Ekoph covers portrait editing, skin tones, colour grading, and workflow in Lightroom and Photoshop.",
            url: "/courses/idara-ekoph",
            tag: "Lightroom · 8 lessons",
          },
        ],
      },
      {
        label: "Compositing and photo manipulation",
        icon: Image,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photo Editing & Compositing Techniques",
            description: "Jesús Ramirez teaches core Photoshop skills — retouching, masking, and blending for seamless composites.",
            url: "/courses/jesus-ramirez",
            tag: "Photoshop · 8 lessons",
          },
          {
            label: "Photo Editing & Color Grading Techniques",
            description: "Aaron Nace covers professional-grade techniques — luminosity masking, advanced retouching, and colour workflows.",
            url: "/courses/aaron-nace",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Speed and productivity in Photoshop",
        icon: Zap,
        color: "#31A8FF",
        destinations: [
          {
            label: "Troubleshooting, Speed & Productivity Tips",
            description: "Ryan Selvy is focused on making you faster — shortcuts, non-destructive workflows, and eliminating Photoshop headaches.",
            url: "/courses/ryan-selvy",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Lightroom workflow and presets",
        icon: Camera,
        color: "#4BC8EB",
        destinations: [
          {
            label: "Lightroom Playlist",
            description: "Photo management, editing presets, and colour workflows — the complete Lightroom library.",
            url: "/tools/lightroom",
            tag: "Playlist",
            toolName: "Lightroom",
          },
        ],
      },
    ],
  },

  profession_video: {
    id: "profession_video",
    question: "What kind of video work are you doing?",
    options: [
      {
        label: "Narrative editing and storytelling",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Video Editing Techniques & Storytelling",
            description: "James Bonanno walks through the fundamentals of editing narrative-driven video in Premiere Pro.",
            url: "/courses/james-bonanno",
            tag: "Premiere · 8 lessons",
          },
        ],
      },
      {
        label: "Content production at scale",
        icon: TrendingUp,
        color: "#9999FF",
        destinations: [
          {
            label: "Video Editing & Content Production Techniques",
            description: "Chris Grubisa covers professional Premiere Pro workflows — multi-cam, audio, colour grading, and producing polished content at scale.",
            url: "/courses/chris-grubisa",
            tag: "Premiere · 8 lessons",
          },
        ],
      },
      {
        label: "Short-form social video",
        icon: Share2,
        color: "#FF3366",
        destinations: [
          {
            label: "Premiere Mobile Templates (Shorts)",
            description: "Remixable Premiere templates you can drop your own clips into and post immediately.",
            url: "/videos",
            tag: "Templates",
          },
          {
            label: "Adobe Live Shorts",
            description: "Quick video techniques, tips, and tricks in 60 seconds or less.",
            url: "/videos",
            tag: "Shorts",
          },
        ],
      },
      {
        label: "Motion graphics and titles",
        icon: Layers,
        color: "#E478FF",
        destinations: [
          {
            label: "After Effects Playlist",
            description: "Motion graphics, visual effects, animation, and compositing — all After Effects content.",
            url: "/tools/after-effects",
            tag: "Playlist",
            toolName: "After Effects",
          },
        ],
      },
    ],
  },

  profession_illustrator: {
    id: "profession_illustrator",
    question: "What kind of illustration work are you developing?",
    options: [
      {
        label: "Vector-based digital illustration",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Illustration & Visual Design Techniques",
            description: "Spencer Nugent breaks down digital illustration from first principles — shapes, composition, and visual storytelling.",
            url: "/courses/spencer-nugent",
            tag: "Illustrator · 8 lessons",
          },
          {
            label: "Vector Illustration, Effects & Texture Techniques",
            description: "Matthew Tjokro teaches advanced Illustrator — custom textures, layered effects, and a distinctive visual style.",
            url: "/courses/matthew-tjokro",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Hand lettering and type illustration",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Hand Lettering & Small Business Branding",
            description: "Natalie Brown teaches hand lettering and type-based illustration, from brush letterforms to small business brand design.",
            url: "/courses/natalie-brown",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Digital painting on iPad",
        icon: Palette,
        color: "#34d399",
        destinations: [
          {
            label: "Fresco Playlist",
            description: "Digital painting, illustration, and mixed media workflows using Adobe Fresco on iPad.",
            url: "/tools/fresco",
            tag: "Playlist",
            toolName: "Fresco",
          },
        ],
      },
      {
        label: "Selling and printing my work",
        icon: Star,
        color: "#FF9A00",
        destinations: [
          {
            label: "Turn Digital Designs into Physical Art",
            description: "Jacob Paris covers print-ready file prep, product mockups, and the full Illustrator-to-physical pipeline for merchandise and printed goods.",
            url: "/courses/jacob-paris",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
    ],
  },

  profession_motion: {
    id: "profession_motion",
    question: "What's your motion design focus?",
    options: [
      {
        label: "Motion graphics and kinetic type",
        icon: Layers,
        color: "#E478FF",
        destinations: [
          {
            label: "After Effects Playlist",
            description: "Motion graphics, visual effects, animation, and compositing — the complete After Effects library.",
            url: "/tools/after-effects",
            tag: "Playlist",
            toolName: "After Effects",
          },
        ],
      },
      {
        label: "VFX and compositing",
        icon: Film,
        color: "#E478FF",
        destinations: [
          {
            label: "After Effects Playlist",
            description: "Visual effects, compositing, keying, and advanced motion work in After Effects.",
            url: "/tools/after-effects",
            tag: "Playlist",
            toolName: "After Effects",
          },
        ],
      },
      {
        label: "Titles and lower thirds for video",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Premiere Pro Playlist",
            description: "Titles, effects, transitions, and complete video production workflows in Premiere.",
            url: "/tools/premiere",
            tag: "Playlist",
            toolName: "Premiere",
          },
        ],
      },
    ],
  },

  profession_web: {
    id: "profession_web",
    question: "What aspect of digital design are you working on?",
    options: [
      {
        label: "UI components and design systems",
        icon: Monitor,
        color: "#00C2A8",
        destinations: [
          {
            label: "Illustrator Playlist",
            description: "Illustrator is widely used for UI mockups, icon sets, and component design — full library of content.",
            url: "/tools/illustrator",
            tag: "Playlist",
            toolName: "Illustrator",
          },
        ],
      },
      {
        label: "Creating assets for web and app",
        icon: Image,
        color: "#00C2A8",
        destinations: [
          {
            label: "Photoshop Playlist",
            description: "Creating web-ready assets, mockups, and digital graphics in Photoshop.",
            url: "/tools/photoshop",
            tag: "Playlist",
            toolName: "Photoshop",
          },
        ],
      },
      {
        label: "AI-generated visuals for projects",
        icon: Sparkles,
        color: "#FF6B00",
        destinations: [
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Izzy Poirier teaches you how to use Adobe Firefly and Express to generate images and build campaign visuals.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
          {
            label: "Firefly Playlist",
            description: "Generative fill, text-to-image, and AI-powered creative workflows.",
            url: "/tools/firefly",
            tag: "Playlist",
            toolName: "Firefly",
          },
        ],
      },
    ],
  },

  profession_freelance: {
    id: "profession_freelance",
    question: "What's your biggest focus as a freelancer right now?",
    options: [
      {
        label: "Building a sustainable creative business",
        icon: Coffee,
        color: "#FFD200",
        destinations: [
          {
            label: "Content Creation for Artists",
            description: "Fabiola Lara shows how to build a presence and create compelling content using Adobe Express and Firefly.",
            url: "/courses/fabiola-lara",
            tag: "Express · 8 lessons",
          },
          {
            label: "Brand Building & Brand Identity Design",
            description: "Brittney Megann covers building a personal brand from positioning to visual execution.",
            url: "/courses/brittney-megann",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Delivering better work for clients",
        icon: Star,
        color: "#00C2A8",
        destinations: [
          {
            label: "Brand Identity Design",
            description: "Liz Mosley teaches professional brand identity design — research, strategy, visual language, and delivering a complete brand system.",
            url: "/courses/liz-mosley",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Working faster and more efficiently",
        icon: Zap,
        color: "#FFD200",
        next: "deadline",
      },
      {
        label: "Getting better at a specific tool",
        icon: BookOpen,
        color: "#FA0F00",
        next: "tool",
      },
    ],
  },

  social_creator: {
    id: "social_creator",
    question: "What kind of social content do you create?",
    subtitle: "We'll point you to the most relevant templates and tutorials.",
    options: [
      {
        label: "Short-form video (Reels, TikTok, Shorts)",
        icon: Film,
        color: "#FF3366",
        destinations: [
          {
            label: "Premiere Mobile Templates",
            description: "Free Premiere templates you can drop your clips into and post immediately — built for Reels and TikTok.",
            url: "/videos",
            tag: "Templates",
          },
          {
            label: "Adobe Live Shorts",
            description: "Quick creative techniques in 60 seconds — great for learning while you scroll.",
            url: "/videos",
            tag: "Shorts",
          },
        ],
      },
      {
        label: "Graphics, carousels, and static posts",
        icon: Image,
        color: "#FF9A00",
        destinations: [
          {
            label: "Adobe Express Playlist",
            description: "Quick content creation, templates, and social media graphics using Adobe Express.",
            url: "/tools/express",
            tag: "Playlist",
            toolName: "Express",
          },
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Use Firefly to generate on-brand campaign visuals and social assets in minutes.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
        ],
      },
      {
        label: "Building my personal brand online",
        icon: Star,
        color: "#FF6B35",
        destinations: [
          {
            label: "Content Creation for Artists",
            description: "Fabiola Lara shows how to build a creative presence and produce content consistently using Express and Firefly.",
            url: "/courses/fabiola-lara",
            tag: "Express · 8 lessons",
          },
          {
            label: "Brand Building & Brand Identity Design",
            description: "Build a cohesive personal brand identity — colours, type, and visual language — from scratch.",
            url: "/courses/brittney-megann",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Long-form YouTube videos",
        icon: Play,
        color: "#FA0F00",
        destinations: [
          {
            label: "Video Editing & Content Production Techniques",
            description: "Chris Grubisa covers professional Premiere Pro workflows — multi-cam, colour, audio, and producing polished long-form content.",
            url: "/courses/chris-grubisa",
            tag: "Premiere · 8 lessons",
          },
          {
            label: "Premiere Pro Playlist",
            description: "The full library of Premiere Pro content — editing, colour, audio, and effects.",
            url: "/tools/premiere",
            tag: "Playlist",
            toolName: "Premiere",
          },
        ],
      },
    ],
  },

  project_type: {
    id: "project_type",
    question: "What kind of project are you working on?",
    options: [
      {
        label: "A logo or brand identity",
        icon: Star,
        color: "#00C2A8",
        destinations: [
          {
            label: "Branding Design, Logo Creation & Vector Illustration",
            description: "Steven Overturf walks through logo construction, brand mark development, and visual identity systems in Illustrator.",
            url: "/courses/steven-overturf",
            tag: "Illustrator · 5 lessons",
          },
          {
            label: "Brand Identity Design",
            description: "Liz Mosley covers full brand identity design — research, strategy, and a complete visual system.",
            url: "/courses/liz-mosley",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "A video or film project",
        icon: Film,
        color: "#9999FF",
        next: "profession_video",
      },
      {
        label: "A photo series or editorial",
        icon: Camera,
        color: "#31A8FF",
        next: "profession_photo",
      },
      {
        label: "Merchandise or printed products",
        icon: Star,
        color: "#FF9A00",
        destinations: [
          {
            label: "Turn Digital Designs into Physical Art",
            description: "Jacob Paris covers the full pipeline from Illustrator to physical products — apparel, stickers, and merchandise.",
            url: "/courses/jacob-paris",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "A social media campaign",
        icon: Share2,
        color: "#FF3366",
        destinations: [
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Izzy Poirier teaches you how to use Firefly and Express to generate images, build brand kits, and create campaigns.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
          {
            label: "Premiere Mobile Templates",
            description: "Remixable video templates for Reels, TikTok, and Shorts.",
            url: "/videos",
            tag: "Templates",
          },
        ],
      },
      {
        label: "A publication or editorial layout",
        icon: BookOpen,
        color: "#FF3366",
        destinations: [
          {
            label: "Typography & Text-Based Design",
            description: "Jess Goldsmith covers type hierarchy, editorial layout, and using type to carry a brand voice in InDesign and Illustrator.",
            url: "/courses/jess-goldsmith",
            tag: "InDesign · 7 lessons",
          },
          {
            label: "InDesign Playlist",
            description: "Layout design, interactive documents, and print production in InDesign.",
            url: "/tools/indesign",
            tag: "Playlist",
            toolName: "InDesign",
          },
        ],
      },
    ],
  },

  deadline: {
    id: "deadline",
    question: "What do you need to produce — fast?",
    subtitle: "We'll skip the long courses and get you to the quickest path.",
    options: [
      {
        label: "A quick graphic or post",
        icon: Image,
        color: "#FF9A00",
        destinations: [
          {
            label: "Adobe Express Playlist",
            description: "Adobe Express is the fastest way to create polished graphics — templates, branding tools, and AI built in.",
            url: "/tools/express",
            tag: "Playlist",
            toolName: "Express",
          },
          {
            label: "Adobe Live Shorts",
            description: "Quick techniques in 60 seconds — find the tip you need without watching a full video.",
            url: "/videos",
            tag: "Shorts",
          },
        ],
      },
      {
        label: "A photo edit or retouch",
        icon: Camera,
        color: "#31A8FF",
        destinations: [
          {
            label: "Troubleshooting, Speed & Productivity Tips",
            description: "Ryan Selvy focuses on making you faster — shortcuts and non-destructive workflows in Photoshop.",
            url: "/courses/ryan-selvy",
            tag: "Photoshop · 8 lessons",
          },
          {
            label: "Photoshop Playlist",
            description: "Find the specific technique you need fast — the full Photoshop library.",
            url: "/tools/photoshop",
            tag: "Playlist",
            toolName: "Photoshop",
          },
        ],
      },
      {
        label: "A short video or reel",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Premiere Mobile Templates",
            description: "Drop your clips in and post — remixable templates for social video.",
            url: "/videos",
            tag: "Templates",
          },
          {
            label: "Premiere Pro Playlist",
            description: "Find the editing technique you need quickly — the full Premiere library.",
            url: "/tools/premiere",
            tag: "Playlist",
            toolName: "Premiere",
          },
        ],
      },
      {
        label: "Something AI can help with",
        icon: Sparkles,
        color: "#FF6B00",
        destinations: [
          {
            label: "Firefly Playlist",
            description: "Generative fill, text-to-image, and AI-powered workflows — the fastest way to get results.",
            url: "/tools/firefly",
            tag: "Playlist",
            toolName: "Firefly",
          },
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Use Firefly to generate campaign-ready images and brand kits fast.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
        ],
      },
      {
        label: "A logo or brand mark",
        icon: Star,
        color: "#00C2A8",
        destinations: [
          {
            label: "Branding Design, Logo Creation & Vector Illustration",
            description: "Steven Overturf's focused course on logo construction — straight to the point.",
            url: "/courses/steven-overturf",
            tag: "Illustrator · 5 lessons",
          },
        ],
      },
    ],
  },

  skill_focus: {
    id: "skill_focus",
    question: "Which skill are you trying to level up?",
    options: [
      {
        label: "Colour grading and editing",
        icon: Palette,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photo Editing & Color Grading Techniques",
            description: "Aaron Nace covers advanced colour grading — luminosity masking, complex selections, and professional retouching workflows.",
            url: "/courses/aaron-nace",
            tag: "Photoshop · 8 lessons",
          },
          {
            label: "Portrait Photo Editing & Color Grading",
            description: "Idara Ekoph covers portrait-specific colour workflows and consistency in Lightroom and Photoshop.",
            url: "/courses/idara-ekoph",
            tag: "Lightroom · 8 lessons",
          },
        ],
      },
      {
        label: "Typography and type design",
        icon: BookOpen,
        color: "#FF3366",
        destinations: [
          {
            label: "Typography & Text-Based Design",
            description: "Jess Goldsmith digs into type as a design system — hierarchy, pairing, editorial layout, and brand voice.",
            url: "/courses/jess-goldsmith",
            tag: "InDesign · 7 lessons",
          },
          {
            label: "Hand Lettering & Small Business Branding",
            description: "Natalie Brown teaches hand lettering and type-based illustration from brush letterforms to brand application.",
            url: "/courses/natalie-brown",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Working faster and smarter",
        icon: Zap,
        color: "#FFD200",
        destinations: [
          {
            label: "Troubleshooting, Speed & Productivity Tips",
            description: "Ryan Selvy targets experienced users who want to work faster — shortcuts, smart objects, batch processing, and workflow efficiency.",
            url: "/courses/ryan-selvy",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Compositing and masking",
        icon: Layers,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photo Editing & Compositing Techniques",
            description: "Jesús Ramirez teaches the core Photoshop skills for compositing — retouching, masking, and blending.",
            url: "/courses/jesus-ramirez",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "The pen tool and precise vectors",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Pen Tool & Vector Illustration Techniques",
            description: "Tyler Pate focuses on mastering the pen tool and precise vector construction — great if that's the one skill holding you back.",
            url: "/courses/tyler-pate",
            tag: "Illustrator · 4 lessons",
          },
        ],
      },
      {
        label: "Using AI in my creative work",
        icon: Sparkles,
        color: "#FF6B00",
        destinations: [
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Izzy Poirier teaches how to use Firefly and Express to generate images, build brand kits, and create campaigns.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
          {
            label: "Firefly Playlist",
            description: "All Firefly content — generative fill, text-to-image, and AI-powered workflows.",
            url: "/tools/firefly",
            tag: "Playlist",
            toolName: "Firefly",
          },
        ],
      },
      {
        label: "Storytelling through design",
        icon: Film,
        color: "#FF6B35",
        destinations: [
          {
            label: "Video Editing Techniques & Storytelling",
            description: "James Bonanno walks through the fundamentals of narrative-driven video editing in Premiere Pro.",
            url: "/courses/james-bonanno",
            tag: "Premiere · 8 lessons",
          },
          {
            label: "Illustration & Visual Design Techniques",
            description: "Spencer Nugent breaks down digital illustration from first principles — shapes, composition, and visual storytelling.",
            url: "/courses/spencer-nugent",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Motion graphics, titles, or visual effects",
        icon: Layers,
        color: "#E478FF",
        destinations: [
          {
            label: "After Effects Playlist",
            description: "Motion design, compositing, animation, and effects — the full After Effects library.",
            url: "/tools/after-effects",
            tag: "Playlist",
            toolName: "After Effects",
          },
        ],
      },
      {
        label: "Print layout, editorial, or long documents",
        icon: BookOpen,
        color: "#FF3366",
        destinations: [
          {
            label: "InDesign Playlist",
            description: "Layout, typography, print production, and interactive documents.",
            url: "/tools/indesign",
            tag: "Playlist",
            toolName: "InDesign",
          },
        ],
      },
    ],
  },

  education: {
    id: "education",
    question: "What describes your situation best?",
    options: [
      {
        label: "I'm a student learning creative tools",
        icon: GraduationCap,
        color: "#0099FF",
        next: "courses",
      },
      {
        label: "I teach Adobe tools in a classroom",
        icon: BookOpen,
        color: "#0099FF",
        destinations: [
          {
            label: "Adobe Live Courses on YouTube",
            description: "Structured, multi-part learning series taught by industry professionals — great for classroom use.",
            url: "/courses",
            tag: "Education",
          },
          {
            label: "Subscribe to the Channel",
            description: "Stay up to date with new live sessions and educational content as it launches.",
            url: "https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1",
            tag: "Subscribe",
          },
        ],
      },
      {
        label: "I'm self-teaching on my own schedule",
        icon: Coffee,
        color: "#FFD200",
        next: "courses",
      },
      {
        label: "I'm learning for a career change",
        icon: TrendingUp,
        color: "#00C2A8",
        destinations: [
          {
            label: "Brand Building & Brand Identity Design",
            description: "One of our most career-relevant courses — covers the full brand identity process that clients actually hire for.",
            url: "/courses/brittney-megann",
            tag: "Illustrator · 8 lessons",
          },
          {
            label: "Video Editing & Content Production Techniques",
            description: "Professional Premiere Pro skills — multi-cam, colour, audio, and content at scale.",
            url: "/courses/chris-grubisa",
            tag: "Premiere · 8 lessons",
          },
          {
            label: "Photo Editing & Compositing Techniques",
            description: "Core Photoshop skills for professional photo editing, retouching, and compositing.",
            url: "/courses/jesus-ramirez",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "I coordinate training for a team or organization",
        icon: Users,
        color: "#9999FF",
        destinations: [
          {
            label: "All courses",
            description: "Structured series you can assign, share, or adapt for group learning.",
            url: "/courses",
            tag: "Courses",
          },
          {
            label: "Subscribe to the channel",
            description: "Receive notifications when new educational live sessions are scheduled.",
            url: "https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1",
            tag: "Subscribe",
          },
        ],
      },
    ],
  },

  tool: {
    id: "tool",
    question: "Which Adobe tool are you working with?",
    subtitle: "We'll take you directly to that tool's full playlist.",
    options: [
      {
        label: "Photoshop",
        icon: Image,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photoshop Playlist",
            description: "Photo editing, compositing, retouching, and more — the complete Photoshop playlist.",
            url: "/tools/photoshop",
            tag: "Playlist",
            toolName: "Photoshop",
          },
        ],
      },
      {
        label: "Illustrator",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Illustrator Playlist",
            description: "Vector illustration, logo design, branding, typography — all covered.",
            url: "/tools/illustrator",
            tag: "Playlist",
            toolName: "Illustrator",
          },
        ],
      },
      {
        label: "Premiere Pro",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Premiere Playlist",
            description: "Video editing, color grading, storytelling, and mobile templates.",
            url: "/tools/premiere",
            tag: "Playlist",
            toolName: "Premiere",
          },
          {
            label: "Mobile Templates (Shorts)",
            description: "Remixable Premiere templates you can drag your own clips into.",
            url: "/videos",
            tag: "Templates",
          },
        ],
      },
      {
        label: "After Effects",
        icon: Layers,
        color: "#9999FF",
        destinations: [
          {
            label: "After Effects Playlist",
            description: "Motion graphics, visual effects, animation, and compositing.",
            url: "/tools/after-effects",
            tag: "Playlist",
            toolName: "After Effects",
          },
        ],
      },
      {
        label: "Lightroom",
        icon: Camera,
        color: "#31A8FF",
        destinations: [
          {
            label: "Lightroom Playlist",
            description: "Photo management, editing presets, and colour workflows.",
            url: "/tools/lightroom",
            tag: "Playlist",
            toolName: "Lightroom",
          },
        ],
      },
      {
        label: "Firefly / AI tools",
        icon: Sparkles,
        color: "#FF6B00",
        destinations: [
          {
            label: "Firefly Playlist",
            description: "Generative fill, text-to-image, AI-powered creative workflows.",
            url: "/tools/firefly",
            tag: "Playlist",
            toolName: "Firefly",
          },
        ],
      },
      {
        label: "Adobe Express",
        icon: Wand2,
        color: "#FF0000",
        destinations: [
          {
            label: "Adobe Express Playlist",
            description: "Quick content creation, templates, and social media graphics.",
            url: "/tools/express",
            tag: "Playlist",
            toolName: "Express",
          },
        ],
      },
      {
        label: "InDesign",
        icon: BookOpen,
        color: "#FF3366",
        destinations: [
          {
            label: "InDesign Playlist",
            description: "Layout, editorial design, print, and interactive documents.",
            url: "/tools/indesign",
            tag: "Playlist",
            toolName: "InDesign",
          },
        ],
      },
      {
        label: "Fresco / Substance 3D",
        icon: Layers,
        color: "#00C2A8",
        destinations: [
          {
            label: "Fresco Playlist",
            description: "Digital painting, illustration, and mixed media on iPad.",
            url: "/tools/fresco",
            tag: "Playlist",
            toolName: "Fresco",
          },
          {
            label: "Substance 3D Playlist",
            description: "3D texturing, materials, and rendering for designers.",
            url: "/tools/substance-3d",
            tag: "Playlist",
          },
        ],
      },
    ],
  },

  live: {
    id: "live",
    question: "What kind of live content interests you?",
    options: [
      {
        label: "I want to watch right now",
        icon: Radio,
        color: "#FA0F00",
        destinations: [
          {
            label: "Adobe Live Channel",
            description: "Head to the channel — live streams are pinned at the top when active.",
            url: "/schedule",
            tag: "Live",
          },
        ],
      },
      {
        label: "I want to see the schedule",
        icon: ChevronRight,
        color: "#FF6B00",
        destinations: [
          {
            label: "View the Schedule",
            description: "See what's coming up on Adobe Live this week.",
            url: "/schedule",
            tag: "On this site",
          },
        ],
      },
      {
        label: "I want to watch past live sessions",
        icon: Play,
        color: "#FFD200",
        destinations: [
          {
            label: "The File New Show",
            description: "Weekly creative news, trends, and designer conversations.",
            url: "/schedule",
            tag: "Weekly show",
          },
          {
            label: "Office Hours",
            description: "Live Q&A with Andrew Hochradel and Nick Longo — open to all questions.",
            url: "/schedule",
            tag: "Q&A",
          },
        ],
      },
      {
        label: "I want recurring shows and series",
        icon: Library,
        color: "#9999FF",
        destinations: [
          {
            label: "Shows & series catalog",
            description: "Browse every recurring series — schedules, descriptions, and episode counts.",
            url: "/series",
            tag: "Series",
          },
        ],
      },
      {
        label: "I want to browse the full video library",
        icon: Library,
        color: "#00C2A8",
        destinations: [
          {
            label: "Video library",
            description: "Search and filter every indexed tutorial, replay, and short.",
            url: "/videos",
            tag: "Library",
          },
        ],
      },
    ],
  },

  quick: {
    id: "quick",
    question: "What kind of quick content are you after?",
    options: [
      {
        label: "Short tips I can watch in 60 seconds",
        icon: Zap,
        color: "#FA0F00",
        destinations: [
          {
            label: "Adobe Live Shorts",
            description: "All the channel's Shorts — quick techniques, reactions, and highlights.",
            url: "/videos",
            tag: "Shorts",
          },
        ],
      },
      {
        label: "Remixable video templates for social",
        icon: Wand2,
        color: "#FF6B35",
        destinations: [
          {
            label: "Premiere Mobile Templates",
            description: "Free Premiere templates you can drop your clips into and post immediately.",
            url: "/videos",
            tag: "Templates",
          },
        ],
      },
      {
        label: "Popular videos everyone is watching",
        icon: Play,
        color: "#0099FF",
        destinations: [
          {
            label: "Most Popular Videos",
            description: "The most-watched Adobe Live videos — a great place to start.",
            url: "/videos",
            tag: "Popular",
          },
        ],
      },
      {
        label: "Browse tutorials by Adobe application",
        icon: BookOpen,
        color: "#FA0F00",
        next: "tool",
      },
    ],
  },

  courses: {
    id: "courses",
    question: "What's your current skill level?",
    subtitle: "Be honest — it helps us pick the right course for you.",
    options: [
      {
        label: "I'm a beginner — new to creative tools",
        icon: Sparkles,
        color: "#00C2A8",
        next: "course_area_beginner",
      },
      {
        label: "I know the basics, want to go deeper",
        icon: BookOpen,
        color: "#FF6B00",
        next: "course_area_intermediate",
      },
      {
        label: "I'm experienced, want advanced techniques",
        icon: Layers,
        color: "#FA0F00",
        next: "course_area_advanced",
      },
      {
        label: "I want to compare all courses first",
        icon: Library,
        color: "#00C2A8",
        destinations: [
          {
            label: "All courses",
            description: "Browse every structured, multi-part course on Adobe Live.",
            url: "/courses",
            tag: "Courses",
          },
        ],
      },
    ],
  },

  course_area_beginner: {
    id: "course_area_beginner",
    question: "What creative area interests you most?",
    subtitle: "Pick the one that feels most like where you want to go.",
    options: [
      {
        label: "Photo editing & retouching",
        icon: Camera,
        color: "#31A8FF",
        next: "course_photo_beginner",
      },
      {
        label: "Illustration & vector design",
        icon: Pen,
        color: "#FF9A00",
        next: "course_illus_beginner",
      },
      {
        label: "Video editing & storytelling",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Video Editing Techniques & Storytelling",
            description: "James Bonanno walks you through the fundamentals of editing narrative-driven video in Premiere Pro — perfect for beginners.",
            url: "/courses/james-bonanno",
            tag: "Premiere · 8 lessons",
          },
        ],
      },
      {
        label: "Creating content for social media",
        icon: Zap,
        color: "#FF6B35",
        destinations: [
          {
            label: "Content Creation for Artists",
            description: "Fabiola Lara shows you how to build a presence and create compelling content using Adobe Express and Firefly.",
            url: "/courses/fabiola-lara",
            tag: "Express · 8 lessons",
          },
        ],
      },
      {
        label: "AI-powered creative tools",
        icon: Sparkles,
        color: "#FF6B00",
        destinations: [
          {
            label: "Generative AI for Branding & Campaign Design",
            description: "Izzy Poirier teaches you how to use Adobe Firefly and Express to generate images, build brand kits, and create campaigns — no experience needed.",
            url: "/courses/izzy-poirier",
            tag: "Firefly · 8 lessons",
          },
        ],
      },
    ],
  },

  course_photo_beginner: {
    id: "course_photo_beginner",
    question: "Which area of photo editing are you focusing on?",
    options: [
      {
        label: "Editing and compositing (Photoshop)",
        icon: Image,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photo Editing & Compositing Techniques",
            description: "Jesús Ramirez teaches the core Photoshop skills for editing and compositing — retouching, masking, and blending — all from scratch.",
            url: "/courses/jesus-ramirez",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Colour grading & presets (Lightroom)",
        icon: Camera,
        color: "#31A8FF",
        destinations: [
          {
            label: "Portrait Photo Editing & Color Grading",
            description: "Idara Ekoph covers portrait editing, colour grading, and workflow from start to finish using Lightroom and Photoshop.",
            url: "/courses/idara-ekoph",
            tag: "Lightroom · 8 lessons",
          },
        ],
      },
    ],
  },

  course_illus_beginner: {
    id: "course_illus_beginner",
    question: "What kind of illustration do you want to make?",
    options: [
      {
        label: "Vector art and digital illustration",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Illustration & Visual Design Techniques",
            description: "Spencer Nugent breaks down digital illustration from first principles — shapes, composition, and visual storytelling using Illustrator.",
            url: "/courses/spencer-nugent",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Hand lettering and type-based design",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Hand Lettering & Small Business Branding",
            description: "Natalie Brown teaches hand lettering and type-based illustration, from brush letterforms to applying them in small business brand design.",
            url: "/courses/natalie-brown",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Converting physical art to digital",
        icon: Layers,
        color: "#FF9A00",
        destinations: [
          {
            label: "Turn Digital Designs into Physical Art",
            description: "Jacob Paris walks through the full pipeline from digital vector illustration in Illustrator to physical printed products — apparel, stickers, merchandise.",
            url: "/courses/jacob-paris",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
    ],
  },

  course_area_intermediate: {
    id: "course_area_intermediate",
    question: "Which creative discipline are you focused on?",
    options: [
      {
        label: "Photo editing & color grading",
        icon: Camera,
        color: "#31A8FF",
        next: "course_photo_intermediate",
      },
      {
        label: "Illustration & vector work",
        icon: Pen,
        color: "#FF9A00",
        next: "course_illus_intermediate",
      },
      {
        label: "Branding & identity design",
        icon: Layers,
        color: "#00C2A8",
        next: "course_brand_intermediate",
      },
      {
        label: "Video editing & production",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Video Editing & Content Production Techniques",
            description: "Chris Grubisa takes you deeper into Premiere Pro — multi-cam, colour, audio, and content workflow for intermediate video editors.",
            url: "/courses/chris-grubisa",
            tag: "Premiere · 8 lessons",
          },
        ],
      },
      {
        label: "Typography & editorial design",
        icon: BookOpen,
        color: "#FF3366",
        destinations: [
          {
            label: "Typography & Text-Based Design",
            description: "Jess Goldsmith digs into type as a design system — hierarchy, pairing, editorial layout, and using type to carry a brand voice in InDesign and Illustrator.",
            url: "/courses/jess-goldsmith",
            tag: "InDesign · 7 lessons",
          },
        ],
      },
      {
        label: "Pen tool & precise vector construction",
        icon: Pen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Pen Tool & Vector Illustration Techniques",
            description: "Tyler Pate focuses specifically on mastering the pen tool and precise vector construction — great if that's the one skill holding you back.",
            url: "/courses/tyler-pate",
            tag: "Illustrator · 4 lessons",
          },
        ],
      },
    ],
  },

  course_photo_intermediate: {
    id: "course_photo_intermediate",
    question: "What do you want to get better at specifically?",
    options: [
      {
        label: "Compositing and advanced edits",
        icon: Image,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photo Editing & Color Grading Techniques",
            description: "Aaron Nace covers advanced Photoshop and Lightroom techniques — complex masking, colour grading, and professional retouching workflows.",
            url: "/courses/aaron-nace",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Speed, productivity, and Photoshop shortcuts",
        icon: Zap,
        color: "#31A8FF",
        destinations: [
          {
            label: "Troubleshooting, Speed & Productivity Tips",
            description: "Ryan Selvy is focused on making you faster — shortcuts, non-destructive workflows, and eliminating common Photoshop headaches.",
            url: "/courses/ryan-selvy",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Portrait editing and colour",
        icon: Camera,
        color: "#31A8FF",
        destinations: [
          {
            label: "Portrait Photo Editing & Color Grading",
            description: "Idara Ekoph covers portrait-specific workflows, skin tones, colour consistency, and professional finishing in Lightroom and Photoshop.",
            url: "/courses/idara-ekoph",
            tag: "Lightroom · 8 lessons",
          },
        ],
      },
    ],
  },

  course_illus_intermediate: {
    id: "course_illus_intermediate",
    question: "What aspect of illustration are you developing?",
    options: [
      {
        label: "Effects, textures, and visual style",
        icon: Layers,
        color: "#FF9A00",
        destinations: [
          {
            label: "Vector Illustration, Effects & Texture Techniques",
            description: "Matthew Tjokro teaches advanced Illustrator techniques — custom textures, layered effects, and building a recognisable visual style.",
            url: "/courses/matthew-tjokro",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "Putting work into the physical world",
        icon: Image,
        color: "#FF9A00",
        destinations: [
          {
            label: "Turn Digital Designs into Physical Art",
            description: "Jacob Paris covers print-ready file prep, product mockups, and the full Illustrator-to-physical pipeline for merchandise and printed goods.",
            url: "/courses/jacob-paris",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
    ],
  },

  course_brand_intermediate: {
    id: "course_brand_intermediate",
    question: "What kind of branding work are you doing?",
    options: [
      {
        label: "Designing logos and brand systems",
        icon: Pen,
        color: "#00C2A8",
        destinations: [
          {
            label: "Branding Design, Logo Creation & Vector Illustration",
            description: "Steven Overturf walks through logo construction, brand mark development, and building cohesive visual identity systems in Illustrator.",
            url: "/courses/steven-overturf",
            tag: "Illustrator · 5 lessons",
          },
        ],
      },
      {
        label: "Building a full brand identity",
        icon: Layers,
        color: "#00C2A8",
        next: "course_brand_full",
      },
    ],
  },

  course_brand_full: {
    id: "course_brand_full",
    question: "What's the brand for?",
    options: [
      {
        label: "A personal brand or small business",
        icon: Users,
        color: "#00C2A8",
        destinations: [
          {
            label: "Brand Building & Brand Identity Design",
            description: "Brittney Megann covers building a complete brand identity from positioning to visual execution — for independent creatives and small businesses using Illustrator and Express.",
            url: "/courses/brittney-megann",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "A client's brand or professional work",
        icon: BookOpen,
        color: "#00C2A8",
        destinations: [
          {
            label: "Brand Identity Design",
            description: "Liz Mosley teaches professional brand identity design — research, strategy, visual language, and delivering a complete brand system using Illustrator and InDesign.",
            url: "/courses/liz-mosley",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
    ],
  },

  course_area_advanced: {
    id: "course_area_advanced",
    question: "What are you working on at an advanced level?",
    options: [
      {
        label: "Photoshop retouching & compositing",
        icon: Image,
        color: "#31A8FF",
        destinations: [
          {
            label: "Photo Editing & Color Grading Techniques",
            description: "Aaron Nace covers professional-grade Photoshop techniques — complex selections, luminosity masking, advanced retouching and colour grading workflows.",
            url: "/courses/aaron-nace",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Illustrator effects and textures",
        icon: Layers,
        color: "#FF9A00",
        destinations: [
          {
            label: "Vector Illustration, Effects & Texture Techniques",
            description: "Matthew Tjokro focuses on advanced Illustrator — custom brushes, complex textures, layered effects, and crafting a distinctive visual language.",
            url: "/courses/matthew-tjokro",
            tag: "Illustrator · 8 lessons",
          },
        ],
      },
      {
        label: "3D and fashion / material design",
        icon: Layers,
        color: "#FF6C37",
        destinations: [
          {
            label: "Digital Fashion & 3D Garment Texturing",
            description: "Stephy Fung covers the professional pipeline for 3D fashion and garment design — using Substance 3D to texture garments, create realistic materials, and produce final renders.",
            url: "/courses/stephy-fung",
            tag: "Substance 3D · 8 lessons",
          },
        ],
      },
      {
        label: "Photoshop speed and workflow efficiency",
        icon: Zap,
        color: "#31A8FF",
        destinations: [
          {
            label: "Troubleshooting, Speed & Productivity Tips",
            description: "Ryan Selvy targets experienced users who want to work faster — advanced shortcuts, smart objects, actions, batch processing, and eliminating workflow friction.",
            url: "/courses/ryan-selvy",
            tag: "Photoshop · 8 lessons",
          },
        ],
      },
      {
        label: "Advanced video production",
        icon: Film,
        color: "#9999FF",
        destinations: [
          {
            label: "Video Editing & Content Production Techniques",
            description: "Chris Grubisa covers professional Premiere Pro workflows — multi-cam editing, audio mixing, colour grading with Lumetri, and producing polished content at scale.",
            url: "/courses/chris-grubisa",
            tag: "Premiere · 8 lessons",
          },
        ],
      },
    ],
  },

  new: {
    id: "new",
    question: "What describes you best?",
    options: [
      {
        label: "I'm new to Adobe Creative Cloud",
        icon: Sparkles,
        color: "#0099FF",
        destinations: [
          {
            label: "Start with The File New Show",
            description: "Our weekly show covers Adobe news and tools in plain language — great entry point.",
            url: "/schedule",
            tag: "Weekly",
          },
          {
            label: "Photoshop Playlist",
            description: "Photoshop is the most popular tool to start with — 142+ videos from intro to advanced.",
            url: "/tools/photoshop",
            tag: "Start here",
          },
        ],
      },
      {
        label: "I know Adobe but I'm new to Adobe Live",
        icon: Radio,
        color: "#FA0F00",
        destinations: [
          {
            label: "Subscribe to the channel",
            description: "Hit subscribe and you'll catch our live sessions as they happen — that's the best way to experience Adobe Live.",
            url: "https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1",
            tag: "Subscribe",
          },
          {
            label: "Browse all Videos",
            description: "See what we cover — filter by tool to find what's relevant to you.",
            url: "/videos",
            tag: "Browse",
          },
        ],
      },
      {
        label: "I'm a student or educator",
        icon: GraduationCap,
        color: "#FFD200",
        destinations: [
          {
            label: "Education Courses",
            description: "Structured, multi-part learning series taught by industry professionals.",
            url: "/courses",
            tag: "Education",
          },
        ],
      },
      {
        label: "I want the full searchable video library",
        icon: Library,
        color: "#31A8FF",
        destinations: [
          {
            label: "Video library",
            description: "Filter by tool, series, or format to find a specific tutorial or replay.",
            url: "/videos",
            tag: "Library",
          },
        ],
      },
    ],
  },

  community: {
    id: "community",
    question: "How do you want to connect?",
    options: [
      {
        label: "I want to ask questions during a live show",
        icon: Radio,
        color: "#FA0F00",
        destinations: [
          {
            label: "Join a Live Stream",
            description: "All our shows have live chat — join while we're on air and ask your question.",
            url: "/schedule",
            tag: "Live",
          },
        ],
      },
      {
        label: "I want to follow along on social",
        icon: Users,
        color: "#FF6B35",
        destinations: [
          {
            label: "Subscribe on YouTube",
            description: "Never miss a live stream — subscribe and turn on notifications.",
            url: "https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1",
            tag: "YouTube",
          },
          {
            label: "Follow on Instagram",
            description: "Behind-the-scenes moments, creative inspiration, and highlights from our shows.",
            url: "https://www.instagram.com/adobelive/",
            tag: "Instagram",
          },
          {
            label: "Follow on TikTok",
            description: "Quick creative tips, short clips, and trending Adobe techniques.",
            url: "https://www.tiktok.com/@adobelive",
            tag: "TikTok",
          },
        ],
      },
      {
        label: "I want to get showcased / share my work",
        icon: Sparkles,
        color: "#FFD200",
        destinations: [
          {
            label: "Tag us on Instagram",
            description: "Share your work and tag @adobelive on Instagram — our team watches for community highlights to feature.",
            url: "https://www.instagram.com/adobelive/",
            tag: "Get featured",
          },
          {
            label: "Tag us on TikTok",
            description: "Post your creative process on TikTok and tag @adobelive for a chance to be spotlighted.",
            url: "https://www.tiktok.com/@adobelive",
            tag: "Get featured",
          },
          {
            label: "Join a Live Stream",
            description: "Show up during a live session and share your screen — community participation is part of what makes Adobe Live special.",
            url: "/schedule",
            tag: "Live",
          },
        ],
      },
      {
        label: "I want written tutorials and guides",
        icon: BookOpen,
        color: "#FF9A00",
        destinations: [
          {
            label: "Blog",
            description: "Readable articles and guides derived from Adobe Live sessions.",
            url: "/blog",
            tag: "Blog",
          },
        ],
      },
    ],
  },
};

const TOOL_PLAYLIST_URLS: Record<string, { url: string; label: string }> = {
  Photoshop:       { url: "/tools/photoshop",    label: "Photoshop Playlist" },
  Illustrator:     { url: "/tools/illustrator",  label: "Illustrator Playlist" },
  Premiere:        { url: "/tools/premiere",     label: "Premiere Pro Playlist" },
  "After Effects": { url: "/tools/after-effects",label: "After Effects Playlist" },
  Lightroom:       { url: "/tools/lightroom",    label: "Lightroom Playlist" },
  Firefly:         { url: "/tools/firefly",      label: "Firefly Playlist" },
  Express:         { url: "/tools/express",      label: "Adobe Express Playlist" },
  InDesign:        { url: "/tools/indesign",     label: "InDesign Playlist" },
  Fresco:          { url: "/tools/fresco",       label: "Fresco Playlist" },
  "Substance 3D":  { url: "/tools/substance-3d", label: "Substance 3D Playlist" },
};

const ALWAYS_SHOW: RelatedLink[] = [
  { label: "Browse All Videos",     url: "/videos",    tag: "Library",   icon: Library },
  { label: "All Courses",           url: "/courses",   tag: "Courses",   icon: GradCapIcon },
  { label: "View the Schedule",     url: "/schedule",  tag: "Schedule",  icon: CalendarDays },
  { label: "Subscribe on YouTube",  url: "https://www.youtube.com/@AdobeLiveCommunity?sub_confirmation=1", tag: "YouTube", icon: Youtube, external: true },
];

function computeRelatedLinks(destinations: Destination[]): RelatedLink[] {
  const seen = new Set<string>();
  const links: RelatedLink[] = [];

  // 1. Tool playlists for any toolName referenced in destinations
  for (const dest of destinations) {
    if (dest.toolName) {
      const playlist = TOOL_PLAYLIST_URLS[dest.toolName];
      if (playlist && !seen.has(playlist.url) && dest.url !== playlist.url) {
        seen.add(playlist.url);
        links.push({ label: playlist.label, url: playlist.url, tag: "Playlist", icon: Play });
      }
    }
  }

  // 2. If any destination points to a course, add the courses index
  const hasCourse = destinations.some((d) => d.url.startsWith("/courses/"));
  if (hasCourse && !seen.has("/courses")) {
    seen.add("/courses");
    links.push({ label: "All Courses", url: "/courses", tag: "Courses", icon: GradCapIcon });
  }

  // 3. If any destination is schedule/live, add the videos page
  const hasSchedule = destinations.some((d) => d.url.startsWith("/schedule"));
  if (hasSchedule && !seen.has("/videos")) {
    seen.add("/videos");
    links.push({ label: "Browse All Videos", url: "/videos", tag: "Library", icon: Library });
  }

  // 4. Always-present links, skipping duplicates and ones already in primary destinations
  const primaryUrls = new Set(destinations.map((d) => d.url));
  for (const link of ALWAYS_SHOW) {
    if (!seen.has(link.url) && !primaryUrls.has(link.url)) {
      seen.add(link.url);
      links.push(link);
    }
  }

  return links;
}

// Icon for graduation cap (not in lucide, use Users as placeholder already imported)
function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

interface HistoryEntry {
  nodeId: string;
  question: string;
  choiceLabel: string;
}

interface PathFinderProps {
  initialTool?: string | null;
}

export default function PathFinder({ initialTool }: PathFinderProps) {
  const router = useRouter();
  const [currentNodeId, setCurrentNodeId] = useState<string>("root");
  const [destinations, setDestinations] = useState<Destination[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(initialTool ?? null);
  const sessionId = useRef<string>("");

  useEffect(() => {
    sessionId.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }, []);

  // Sync activeTool when initialTool changes (URL-driven)
  useEffect(() => {
    setActiveTool(initialTool ?? null);
  }, [initialTool]);

  const node = NODES[currentNodeId];
  const relatedLinks = useMemo(() => destinations ? computeRelatedLinks(destinations) : [], [destinations]);

  const intro = sectionIntro(activeTool);

  function handleOption(option: (typeof node.options)[0]) {
    const entry: HistoryEntry = {
      nodeId: currentNodeId,
      question: node.question,
      choiceLabel: option.label,
    };

    if (option.destinations) {
      setHistory((h) => [...h, entry]);
      setDestinations(option.destinations!);

      // Log the choice with destination info
      logGuideClick({
        session_id: sessionId.current,
        node_id: currentNodeId,
        question: node.question,
        choice_label: option.label,
        destination_url: option.destinations[0]?.url,
        destination_label: option.destinations[0]?.label,
      });

      // If any destination has a toolName, navigate to update URL so server renders recommendations
      const toolDest = option.destinations.find((d) => d.toolName);
      if (toolDest?.toolName) {
        setActiveTool(toolDest.toolName);
        router.replace(`/guide?tool=${encodeURIComponent(toolDest.toolName)}`, { scroll: false });
        setTimeout(() => {
          document.getElementById("video-recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      }
    } else if (option.next) {
      setHistory((h) => [...h, entry]);
      setCurrentNodeId(option.next!);
      setDestinations(null);

      // Log the branch navigation
      logGuideClick({
        session_id: sessionId.current,
        node_id: currentNodeId,
        question: node.question,
        choice_label: option.label,
      });
    }
  }

  function reset() {
    setCurrentNodeId("root");
    setDestinations(null);
    setHistory([]);
    setActiveTool(null);
    router.replace("/guide", { scroll: false });
  }

  function goBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentNodeId(prev.nodeId);
    setDestinations(null);
  }

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section label */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4 text-[#FA0F00]/90" />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.16em] bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #FA0F00 0%, #FF6B00 45%, #FFD200 100%)" }}
            >
              {intro.kicker}
            </span>
          </div>
          <h2 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight leading-[1.2]">
            {intro.title}
          </h2>
          <p className="text-white/42 text-[15px] mt-3 max-w-2xl leading-relaxed">
            {intro.body}
          </p>
        </motion.div>

        {/* Breadcrumb trail */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {history.map((h, i) => (
              <span key={i} className="flex items-center gap-2 text-white/40 text-xs">
                {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate max-w-[160px]">{h.choiceLabel}</span>
              </span>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!destinations ? (
            <motion.div
              key={currentNodeId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {activeTool && currentNodeId === "root" && (
                <div className="mb-4 rounded-xl border border-white/[0.08] bg-gradient-to-r from-[#FA0F00]/10 via-white/[0.02] to-transparent px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-white/50 text-xs leading-relaxed sm:max-w-[min(100%,28rem)]">
                    <span className="text-white/70 font-medium">Context:</span> this guide was opened with{" "}
                    <span className="text-white/85">{activeTool}</span> selected. Related videos appear below. You may
                    also open the dedicated application hub.
                  </p>
                  <Link
                    href={`/tools/${getToolSlugByName(activeTool)}`}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/90 hover:bg-white/[0.08] hover:border-white/20 transition-colors"
                  >
                    {activeTool} hub
                    <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                  </Link>
                </div>
              )}

              {/* Question card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 mb-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <h3 className="text-white text-lg sm:text-xl font-semibold tracking-tight mb-1">{node.question}</h3>
                {node.subtitle && (
                  <p className="text-white/40 text-sm mb-7 leading-relaxed">{node.subtitle}</p>
                )}
                {!node.subtitle && <div className="mb-7" />}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {node.options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleOption(opt)}
                      className="group flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200 text-left"
                    >
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                        style={{ background: `${opt.color}14`, border: `1px solid ${opt.color}28` }}
                      >
                        <opt.icon className="w-4.5 h-4.5" style={{ color: opt.color, width: 18, height: 18 }} />
                      </div>
                      <span className="text-white/70 group-hover:text-white/95 text-sm font-medium transition-colors duration-200 leading-snug pr-1">
                        {opt.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-white/40 ml-auto flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div className="flex gap-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-white/38 hover:text-white/65 text-xs font-medium transition-colors duration-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Previous step
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-white/28 hover:text-white/55 text-xs font-medium transition-colors duration-200"
                  >
                    Start again
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="destinations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Result card */}
              <div className="rounded-2xl border border-[#FA0F00]/20 bg-[#FA0F00]/[0.04] p-6 sm:p-8 mb-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FA0F00]" />
                  <span className="text-[#FA0F00]/90 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Suggested destinations
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {destinations.map((dest) => {
                    const isExternal = dest.url.startsWith("http");
                    const cardClass = "group flex items-start gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.045] transition-all duration-200";
                    const inner = (
                      <>
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#FA0F00]/15 border border-[#FA0F00]/25 flex items-center justify-center mt-0.5">
                          <Play className="w-4 h-4 text-[#FA0F00] fill-[#FA0F00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-white font-semibold text-sm group-hover:text-white/90">{dest.label}</span>
                            {dest.tag && (
                              <span className="px-1.5 py-0.5 rounded-full bg-white/8 text-white/50 text-[10px] font-semibold uppercase tracking-wide">
                                {dest.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-white/45 text-xs leading-relaxed">{dest.description}</p>
                        </div>
                        {isExternal
                          ? <ExternalLink className="w-4 h-4 text-white/25 group-hover:text-white/50 flex-shrink-0 mt-1 transition-colors duration-200" />
                          : <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-white/50 flex-shrink-0 mt-1 transition-colors duration-200" />
                        }
                      </>
                    );
                    return isExternal ? (
                      <a key={dest.url} href={dest.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
                        {inner}
                      </a>
                    ) : (
                      <Link key={dest.url} href={dest.url} className={cardClass}>
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* More to explore */}
              {relatedLinks.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
                  <p className="text-white/32 text-[11px] font-semibold uppercase tracking-[0.14em] mb-4">Also worth a look</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {relatedLinks.map((link) => {
                      const isExternal = link.external || link.url.startsWith("http");
                      const inner = (
                        <div className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200">
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center">
                            <link.icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/65 transition-colors duration-200" />
                          </div>
                          <span className="flex-1 text-white/55 group-hover:text-white/80 text-xs font-medium transition-colors duration-200 leading-snug">
                            {link.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-white/6 text-white/30 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0">
                            {link.tag}
                          </span>
                          {isExternal
                            ? <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors duration-200" />
                            : <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors duration-200" />
                          }
                        </div>
                      );
                      return isExternal ? (
                        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                          {inner}
                        </a>
                      ) : (
                        <Link key={link.url} href={link.url}>
                          {inner}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-4">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-white/38 hover:text-white/65 text-xs font-medium transition-colors duration-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Previous step
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-white/28 hover:text-white/55 text-xs font-medium transition-colors duration-200"
                >
                  Start again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
