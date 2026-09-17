"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckSquare, HeartPulse, RefreshCw, Search, Users } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SearchService } from "@/services/search/searchService";
import { buildSearchFilterPayload, type FilterState } from "@/services/search/searchFilters";
import { type SearchResponse } from "@/services/search/searchTypes";

export default function NurseSearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"patients" | "triage_records" | "clinical_tasks" | "escalations">("patients");
  const [filters, setFilters] = useState<FilterState>({});
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const executeSearch = async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const payload = buildSearchFilterPayload(filters);
      const res = await SearchService.search({
        q: query,
        index: activeTab,
        page: targetPage,
        limit: 12,
        filters: payload,
      });
      setResults(res);
      setPage(targetPage);
    } catch {
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(1);
  }, [activeTab, filters]);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-200">
                  Nursing Workspace
                </span>
                <span className="text-xs font-semibold text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">Triage & Bedside Task Search</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Nurse Operational Search Center
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Quick lookup for active ward census, emergency triage acuity, scheduled vitals checks, and physician escalations.
              </p>
            </div>
            <button
              onClick={() => executeSearch(page)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Tab Selector */}
          <div className="mt-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            {[
              { id: "patients", label: "Ward Census", icon: Users },
              { id: "triage_records", label: "Triage Intake", icon: AlertTriangle },
              { id: "clinical_tasks", label: "Bedside Tasks", icon: CheckSquare },
              { id: "escalations", label: "Urgent Escalations", icon: HeartPulse },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch(1);
            }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search in ${activeTab.replace("_", " ")}...`}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-4 rounded-xl bg-sky-600 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters({})}
            />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <SearchResults
              hits={results?.hits || []}
              isLoading={isLoading}
              searchMode={results?.search_mode}
              query={query}
            />
            {results && results.total > 0 && (
              <SearchPagination
                page={results.page}
                totalPages={results.total_pages}
                totalResults={results.total}
                limit={results.limit}
                onPageChange={(p) => executeSearch(p)}
              />
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
