"use client";

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export default function GradientBorder({ children, className = "", padding = "p-px" }: GradientBorderProps) {
  return (
    <div className={`relative rounded-2xl ${padding} bg-gradient-to-br from-[#FA0F00] via-[#FF6B35] to-[#FFB800] ${className}`}>
      <div className="relative rounded-2xl bg-[#0a0a0a] h-full w-full">
        {children}
      </div>
    </div>
  );
}
