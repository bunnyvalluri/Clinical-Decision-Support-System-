"use client";

import React, { useState, useMemo } from "react";
import type { NocoDBDataset, DatasetCategory } from "@/services/nocodb/types";
import { getCategoryMeta, formatDatasetRowCount } from "@/services/nocodb/nocodbDatasets";

interface DatasetSelectorProps {
  datasets: NocoDBDataset[];
  selectedSlug: string | null;
  onSelectDataset: (slug: string) => void;
  isLoading?: boolean;
}

export function DatasetSelector({
  datasets,
  selectedSlug,
  onSelectDataset,
  isLoading = false,
}: DatasetSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    datasets.forEach((d) => set.add(d.category));
    return Array.from(set);
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) => {
      const matchCat = selectedCategory === "ALL" || d.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [datasets, selectedCategory, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Governed Analytics Datasets</h2>
          <p className="text-xs text-slate-500">
            Select an auxiliary projection to explore, query, or audit.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 mb-4 pb-2 border-b border-slate-100">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({datasets.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {getCategoryMeta(cat as DatasetCategory).label}
          </button>
        ))}
      </div>

      {/* Datasets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-lg p-3 animate-pulse bg-slate-50 h-24"
            />
          ))}
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-500">
          No datasets match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDatasets.map((ds) => {
            const isSelected = ds.slug === selectedSlug;
            const meta = getCategoryMeta(ds.category);
            return (
              <div
                key={ds.id}
                onClick={() => onSelectDataset(ds.slug)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {formatDatasetRowCount(ds.row_count)} rows
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1">
                  {ds.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {ds.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
