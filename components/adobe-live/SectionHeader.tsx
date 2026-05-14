import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  icon?: LucideIcon;
  label?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export default function SectionHeader({
  icon: Icon,
  label,
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  const isExternal = action?.href.startsWith("http");

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        {(Icon || label) && (
          <div className="flex items-center gap-2 mb-2">
            {Icon && (
              <Icon
                className="w-4 h-4"
                style={{ color: "#FA0F00" }}
              />
            )}

            {label && (
              <span
                className="text-xs font-bold uppercase tracking-[0.15em] bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #FA0F00 0%, #FF6B00 50%, #FFD200 100%)",
                }}
              >
                {label}
              </span>
            )}
          </div>
        )}

        <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-none">
          {title}
        </h2>

        {subtitle && (
          <p className="text-white/50 text-sm mt-1.5 max-w-lg">
            {subtitle}
          </p>
        )}
      </div>

      {action &&
        (isExternal ? (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all duration-200"
          >
            {action.label} →
          </a>
        ) : (
          <Link
            href={action.href}
            className="flex-shrink-0 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all duration-200"
          >
            {action.label} →
          </Link>
        ))}
    </div>
  );
}