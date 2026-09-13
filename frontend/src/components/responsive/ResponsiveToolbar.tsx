"use client";

import * as React from "react";
import { Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResponsiveToolbarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ResponsiveToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records, MRN, diagnosis...",
  filters,
  actions,
  className,
}: ResponsiveToolbarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3", className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="touch-target w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Desktop Inline Filters & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
          {filters && (
            <>
              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-2">
                {filters}
              </div>

              {/* Mobile Filter Sheet Trigger Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="touch-target md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Filter className="h-4 w-4 text-slate-500" />
                <span>Filters</span>
              </button>
            </>
          )}

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {mobileFilterOpen && filters && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto pb-safe">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Filter className="h-4 w-4 text-teal-600" />
                <span>Filter Clinical Records</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="touch-target p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              {filters}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="touch-target w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
