import * as React from "react";
import { HeartPulse, ShieldCheck, Lock } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

interface BrandFooterProps {
  className?: string;
  condensed?: boolean;
}

/**
 * BrandFooter
 *
 * Professional healthcare footer displaying dynamic year, brand copyright,
 * enterprise branding, compliance badges, and clinical safety disclaimer.
 */
export function BrandFooter({ className = "", condensed = false }: BrandFooterProps) {
  const currentYear = new Date().getFullYear();

  if (condensed) {
    return (
      <footer
        className={`py-4 px-6 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-2">
          <HeartPulse className="h-3.5 w-3.5 text-teal-600 shrink-0" />
          <span>
            &copy; {currentYear} {BRAND_CONFIG.brandName}. All rights reserved.
          </span>
        </div>
        <p className="text-[11px] text-slate-400 text-center sm:text-right">
          {BRAND_CONFIG.disclaimers.clinicalSafety}
        </p>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-slate-200 bg-slate-50/70 py-6 px-4 sm:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <HeartPulse className="h-4 w-4 text-teal-600" />
            <span>&copy; {currentYear} {BRAND_CONFIG.brandName}</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>21 CFR Part 11 &amp; HIPAA Aligned</span>
          </div>
        </div>

        <p className="text-center sm:text-right text-[11px] text-slate-500 max-w-md">
          {BRAND_CONFIG.disclaimers.clinicalSafety}
        </p>
      </div>
    </footer>
  );
}
