import * as React from "react";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "primary" | "white" | "monochrome";
}

const SIZE_MAP = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
};

/**
 * BrandMark
 *
 * Professional healthcare technology mark:
 * Stylized geometric mark incorporating a medical cross nexus, clinical pulse wave,
 * and intelligence data nodes.
 */
export function BrandMark({ size = "md", className = "", variant = "primary" }: BrandMarkProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const bgStyle =
    variant === "white"
      ? "bg-white text-teal-700 shadow-sm border border-slate-200"
      : variant === "monochrome"
      ? "bg-slate-900 text-white"
      : "bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-xs border border-teal-500/20";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl font-black shrink-0 select-none ${sizeClass} ${bgStyle} ${className}`}
      aria-label="HealthNova AI Brand Mark"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[70%] h-[70%]"
        aria-hidden="true"
      >
        {/* Left vertical pillar */}
        <rect x="6" y="5" width="4.5" height="26" rx="2.25" fill="currentColor" />
        {/* Right vertical pillar */}
        <rect x="25.5" y="5" width="4.5" height="26" rx="2.25" fill="currentColor" />
        {/* Central horizontal bridge with medical cross / pulse notch */}
        <path
          d="M10.5 18H14.5L16.5 13.5L19.5 22.5L21.5 18H25.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Intelligence nexus nodes */}
        <circle cx="16.5" cy="13.5" r="1.5" fill="white" />
        <circle cx="19.5" cy="22.5" r="1.5" fill="white" />
      </svg>
    </div>
  );
}
