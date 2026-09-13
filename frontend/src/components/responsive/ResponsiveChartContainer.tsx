"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export interface ResponsiveChartContainerProps {
  children: React.ReactNode;
  height?: number | string;
  minHeight?: number;
  aspectRatio?: string; // e.g. "16/9" or "4/3"
  title?: string;
  accessibleSummary?: string;
  className?: string;
}

export function ResponsiveChartContainer({
  children,
  height,
  minHeight = 220,
  aspectRatio,
  title,
  accessibleSummary,
  className,
}: ResponsiveChartContainerProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div
        style={{ minHeight }}
        className={cn(
          "w-full flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 animate-pulse p-4 text-xs text-slate-400 font-mono text-center gap-2",
          className
        )}
      >
        <div className="h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span>Initializing Clinical Telemetry Visualization...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        </div>
      )}

      {/* Screen Reader Accessible Summary for Medical Data Visualization */}
      {accessibleSummary && (
        <p className="sr-only" aria-live="polite">
          {accessibleSummary}
        </p>
      )}

      <div
        style={{
          minHeight,
          height: height || (aspectRatio ? undefined : minHeight),
          aspectRatio: aspectRatio,
        }}
        className="w-full relative"
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
