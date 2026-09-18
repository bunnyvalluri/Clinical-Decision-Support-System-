"use client";

import React from "react";
import { Layers, ChevronRight } from "lucide-react";
import { BlogCategory } from "../types/blogTypes";

interface BrowseByTopicProps {
  categories: BlogCategory[];
  activeCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  loading?: boolean;
}

export function BrowseByTopic({
  categories,
  activeCategory,
  onSelectCategory,
  loading,
}: BrowseByTopicProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs h-full justify-between space-y-4">
      <div>
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Layers className="h-4 w-4 text-teal-600" />
          <h3 className="text-base font-bold text-slate-950 tracking-tight">
            Browse by Topic
          </h3>
        </div>

        {loading && (
          <div className="space-y-3 pt-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-6" />
              </div>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center">
            No categories available.
          </p>
        )}

        {!loading && categories.length > 0 && (
          <div className="divide-y divide-slate-100 pt-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`w-full flex items-center justify-between py-2.5 px-2 rounded-xl text-xs font-semibold transition-colors group ${
                    isActive
                      ? "bg-teal-50 text-teal-900 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className={`h-3 w-3 text-slate-400 group-hover:text-teal-600 transition-colors ${isActive ? "text-teal-600" : ""}`} />
                    <span>{cat.name}</span>
                  </span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-teal-200/80 text-teal-900 font-bold"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}>
                    {cat.article_count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
        >
          Reset Filter to All Topics
        </button>
      </div>
    </div>
  );
}
