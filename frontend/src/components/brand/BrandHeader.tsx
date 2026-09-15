import * as React from "react";
import { BrandLogo } from "./BrandLogo";
import { BRAND_CONFIG } from "@/config/brand";

interface BrandHeaderProps {
  roleSubtitle?: string;
  wsConnected?: boolean;
  statusText?: string;
  className?: string;
  rightSlot?: React.ReactNode;
}

/**
 * BrandHeader
 *
 * Consistent header banner displaying HealthNova AI, role subtitle,
 * and live system telemetry status.
 */
export function BrandHeader({
  roleSubtitle,
  wsConnected = true,
  statusText = "Live Telemetry",
  className = "",
  rightSlot,
}: BrandHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <BrandLogo
          size="md"
          showSubtitle={Boolean(roleSubtitle)}
          subtitle={roleSubtitle}
        />
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border shadow-2xs ${
            wsConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
          title={statusText}
        >
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              wsConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="font-semibold">{statusText}</span>
        </div>

        {rightSlot}
      </div>
    </header>
  );
}
