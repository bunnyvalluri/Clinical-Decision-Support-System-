import * as React from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { BRAND_CONFIG } from "@/config/brand";

export default function RootLoading() {
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none"
      role="status"
      aria-label="Loading HealthNova AI"
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="relative">
          <BrandMark size="lg" />
          <span className="absolute -inset-1 rounded-2xl bg-teal-500/20 animate-ping pointer-events-none" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            {BRAND_CONFIG.brandName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronizing clinical intelligence telemetry…
          </p>
        </div>
        <div className="w-40 h-1 rounded-full bg-slate-200 overflow-hidden">
          <div className="w-full h-full bg-teal-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
