"use client";

import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { type FilterState } from "@/services/search/searchFilters";

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  availableCategories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function SearchFilters({
  filters,
  onChange,
  onReset,
  availableCategories = [],
  selectedCategory = "",
  onSelectCategory,
}: SearchFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Search Filters
          </h3>
        </div>
        <button
          onClick={onReset}
          title="Reset Filters"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category selector if provided */}
      {availableCategories.length > 0 && onSelectCategory && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
            Dataset Index
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Authorized Indexes</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Risk Level Filter */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
          Clinical Risk Level
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((lvl) => {
            const isSelected = (filters.riskLevel || "ALL") === lvl;
            return (
              <button
                key={lvl}
                onClick={() =>
                  onChange({ ...filters, riskLevel: lvl === "ALL" ? undefined : lvl })
                }
                className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold border transition-all text-center ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
          Encounter / Record Status
        </label>
        <select
          value={filters.status || "ALL"}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value === "ALL" ? undefined : e.target.value,
            })
          }
          className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="ESCALATED">Escalated</option>
        </select>
      </div>
    </div>
  );
}
