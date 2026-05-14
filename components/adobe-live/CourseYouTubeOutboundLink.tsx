"use client";

import { trackContentClick } from "@/lib/analytics";

type Props = {
  href: string;
  courseId: string;
  title: string;
  tool: string;
  tags: string[];
  className?: string;
  children: React.ReactNode;
};

export default function CourseYouTubeOutboundLink({
  href,
  courseId,
  title,
  tool,
  tags,
  className,
  children,
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackContentClick(courseId, title, "course-playlist", "course-detail-youtube", [
          tool,
          ...tags.slice(0, 4),
        ])
      }
    >
      {children}
    </a>
  );
}
