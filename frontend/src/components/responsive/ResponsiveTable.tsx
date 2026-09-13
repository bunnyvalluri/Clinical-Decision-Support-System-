"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  priority?: "high" | "medium" | "low"; // 'low' hidden on tablet, 'high' always in mobile card
  sticky?: boolean;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  mobileCardRender,
  emptyState,
  isLoading,
  className,
}: ResponsiveTableProps<T>) {
  const [scrollAffordance, setScrollAffordance] = React.useState({ left: false, right: false });
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setScrollAffordance({
        left: scrollLeft > 10,
        right: scrollLeft < scrollWidth - clientWidth - 10,
      });
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading clinical records...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      emptyState || (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500 font-mono">
          No records found matching clinical criteria.
        </div>
      )
    );
  }

  return (
    <div className={cn("w-full min-w-0 space-y-3", className)}>
      {/* ================================================================== */}
      {/* 1. Mobile Cards View (< 768px)                                      */}
      {/* ================================================================== */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => {
          if (mobileCardRender) {
            return (
              <React.Fragment key={keyExtractor(item, index)}>
                {mobileCardRender(item, index)}
              </React.Fragment>
            );
          }

          // Fallback Default Card Render: High and Medium priority fields stacked
          return (
            <div
              key={keyExtractor(item, index)}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5 transition-all active:scale-[0.99]"
            >
              {columns
                .filter((col) => col.priority !== "low")
                .map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-medium shrink-0">{col.header}:</span>
                    <div className="text-right font-semibold text-slate-900 min-w-0 truncate">
                      {col.render(item, index)}
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* 2. Desktop & Tablet Full Table (>= 768px)                           */}
      {/* ================================================================== */}
      <div className="hidden md:block relative rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Scroll Edge Shadows for Horizontal Scroll Affordance */}
        {scrollAffordance.left && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/10 to-transparent pointer-events-none z-20" />
        )}
        {scrollAffordance.right && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/10 to-transparent pointer-events-none z-20" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="overflow-x-auto overflow-y-hidden"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3.5 whitespace-nowrap",
                      col.sticky ? "sticky left-0 bg-slate-50/95 backdrop-blur-xs z-10 font-bold text-slate-800" : "",
                      col.priority === "low" ? "hidden lg:table-cell" : "",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 align-middle",
                        col.sticky ? "sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 font-semibold text-slate-900" : "",
                        col.priority === "low" ? "hidden lg:table-cell" : "",
                        col.className
                      )}
                    >
                      {col.render(item, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
