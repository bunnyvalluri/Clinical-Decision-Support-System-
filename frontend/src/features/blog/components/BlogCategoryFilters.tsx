"use client";

import React from "react";
import { BlogCategory } from "../types/blogTypes";

interface BlogCategoryFiltersProps {
  categories: BlogCategory[];
  activeCategory: string;
  onSelectCategory: (categorySlug: string) => void;
}

export function BlogCategoryFilters({
  categories,
  activeCategory,
  onSelectCategory,
}: BlogCategoryFiltersProps) {
  const isAllActive = !activeCategory || activeCategory === "all";

  return (
    <section aria-label="Article categories" className="w-full py-4 border-b border-slate-200/80 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-1 scrollbar-none snap-x-mandatory">
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

          {/* Database Driven Categories */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`touch-target px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 snap-start shrink-0 ${
                  isActive
                    ? "bg-slate-950 text-white shadow-xs font-bold ring-2 ring-slate-950/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 border border-slate-200/60"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
