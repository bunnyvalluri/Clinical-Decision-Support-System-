"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ResponsiveTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: "pill" | "underline";
}

export function ResponsiveTabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "pill",
}: ResponsiveTabsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTabClick = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onChange(id);
    // Smoothly scroll active tab into view on mobile
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  return (
    <div className={cn("w-full relative border-b border-slate-200 pb-0.5", className)}>
      <div
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x-mandatory py-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (variant === "underline") {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => handleTabClick(tab.id, e)}
                className={cn(
                  "touch-target snap-start flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors relative border-b-2",
                  isActive
                    ? "border-teal-600 text-teal-900 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                {Icon && <Icon className={cn("h-4 w-4", isActive ? "text-teal-600" : "text-slate-400")} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-teal-100 text-teal-800 font-bold" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Default Pill Segmented
          return (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => handleTabClick(tab.id, e)}
              className={cn(
                "touch-target snap-start flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all",
                isActive
                  ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent"
              )}
            >
              {Icon && <Icon className={cn("h-4 w-4", isActive ? "text-teal-600" : "text-slate-400")} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-teal-200 text-teal-900 font-bold" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
