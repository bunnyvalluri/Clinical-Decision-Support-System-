import * as React from "react";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { BrandName } from "./BrandName";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

/**
 * BrandLogo
 *
 * Full brand logo combining BrandMark and BrandName.
 * Supports compact mode ("HN" only) for space-constrained layouts.
 */
export function BrandLogo({
  href = "/",
  size = "md",
  showSubtitle = false,
  subtitle,
  compact = false,
  className = "",
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <BrandMark size={size} />
      {!compact && (
        <BrandName
          size={size}
          showSubtitle={showSubtitle}
          subtitle={subtitle}
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
        aria-label="HealthNova AI Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
