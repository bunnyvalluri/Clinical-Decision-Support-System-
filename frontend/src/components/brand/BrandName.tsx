import * as React from "react";
import { BRAND_CONFIG } from "@/config/brand";

interface BrandNameProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  highlightAI?: boolean;
}

const SIZE_MAP = {
  sm: {
    title: "text-sm font-bold",
    sub: "text-[9px]",
    badge: "text-[9px] px-1 py-0.5",
  },
  md: {
    title: "text-base font-extrabold",
    sub: "text-[10px]",
    badge: "text-[10px] px-1.5 py-0.5",
  },
  lg: {
    title: "text-xl font-black",
    sub: "text-xs",
    badge: "text-[11px] px-2 py-0.5",
  },
  xl: {
    title: "text-2xl sm:text-3xl font-black",
    sub: "text-xs sm:text-sm",
    badge: "text-xs px-2.5 py-1",
  },
};

/**
 * BrandName
 *
 * Renders the standardized product brand name: HealthNova AI
 * with optional role subtitle or tagline.
 */
export function BrandName({
  size = "md",
  showSubtitle = false,
  subtitle,
  className = "",
  highlightAI = true,
}: BrandNameProps) {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const displaySubtitle = subtitle || BRAND_CONFIG.tagline;

  return (
    <div className={`flex flex-col leading-tight ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className={`tracking-tight text-slate-950 ${currentSize.title}`}>
          HealthNova
        </span>
        {highlightAI ? (
          <span
            className={`font-mono font-bold rounded-md bg-teal-50 text-teal-800 border border-teal-200/80 uppercase ${currentSize.badge}`}
          >
            AI
          </span>
        ) : (
          <span className={`tracking-tight text-teal-700 ${currentSize.title}`}>
            AI
          </span>
        )}
      </div>
      {showSubtitle && (
        <span
          className={`font-medium text-slate-500 mt-0.5 truncate block ${currentSize.sub}`}
        >
          {displaySubtitle}
        </span>
      )}
    </div>
  );
}
