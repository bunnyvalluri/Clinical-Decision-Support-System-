"use client";

import React from "react";
import { Search } from "lucide-react";
import { BlogCategory } from "../types/blogTypes";

interface BlogCategoryFiltersProps {
  categories: BlogCategory[];
  activeCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  onOpenSearch?: () => void;
}

export function BlogCategoryFilters({
  categories,
  activeCategory,
  onSelectCategory,
  onOpenSearch,
}: BlogCategoryFiltersProps) {
  const isAllActive = !activeCategory || activeCategory === "all";

  return (
    <section aria-label="Article categories" className="w-full py-4 border-b border-slate-200/80 bg-white sticky top-16 z-20 backdrop-blur-md bg-white/95">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Scrollable category pills container */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-1 scrollbar-none snap-x-mandatory flex-1 min-w-0">
            {/* "All" Category Pill */}
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className={`touch-target px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 snap-start shrink-0 ${
                isAllActive
                  ? "bg-slate-950 text-white shadow-xs font-bold ring-2 ring-slate-950/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 border border-slate-200/60"
              }`}
            >
              All
            </button>

            {/* Database / Fallback Driven Categories */}
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`touch-target px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 snap-start shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-950 text-white shadow-xs font-bold ring-2 ring-slate-950/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 border border-slate-200/60"
                  }`}
                >
                  <span>{cat.name}</span>
                  {typeof cat.article_count === "number" && cat.article_count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-slate-800 text-teal-300 font-bold"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {cat.article_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search Action */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search articles"
              className="touch-target hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-teal-300 hover:shadow-xs text-xs font-medium text-slate-600 transition-all shrink-0"
            >
              <Search className="h-3.5 w-3.5 text-teal-600" />
              <span>Search</span>
              <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
