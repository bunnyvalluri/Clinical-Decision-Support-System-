"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Database,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SearchService } from "@/services/search/searchService";
import { buildSearchFilterPayload, type FilterState } from "@/services/search/searchFilters";
import { type SearchHit, type SearchResponse } from "@/services/search/searchTypes";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({});
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableIndexes, setAvailableIndexes] = useState<string[]>([]);

  // Load authorized index list
  useEffect(() => {
    SearchService.getIndexes().then((res) => {
      setAvailableIndexes(res.map((r) => r.index_uid));
    });
  }, []);

  const executeSearch = useCallback(async (newPage = 1) => {
    setIsLoading(true);
    try {
      const filterPayload = buildSearchFilterPayload(filters);
      const res = await SearchService.search({
        q: query,
        index: category || undefined,
        page: newPage,
        limit: 15,
        filters: filterPayload,
      });
      setResults(res);
      setPage(newPage);
    } catch {
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, category, filters]);

  useEffect(() => {
    executeSearch(1);
  }, [category, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(1);
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  Meilisearch v1.12.0
                </span>
                <span className="text-xs font-semibold text-slate-400">•</span>
                <span className="text-xs font-semibold text-teal-700">
                  Fast Clinical Information Retrieval
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Global Clinical Search Platform
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Typo-tolerant, authorization-aware search across patients, risk predictions, clinical encounters, and registered models.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => executeSearch(page)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Primary Search Input */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient name, MRN (e.g. MRN-90241), model version, symptom..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 px-5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content Layout: Filters + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-4">
            <SearchFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters({})}
              availableCategories={availableIndexes}
              selectedCategory={category}
              onSelectCategory={setCategory}
            />

            {/* Invariant Safeguard Notice */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero-Trust Projection</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Search queries are governed strictly by your active role credentials. Unauthorized patient PHI and raw secrets are excluded at the Django projection layer.
              </p>
            </div>
          </div>

          {/* Results Column */}
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" />
            <p className="text-xs font-semibold text-slate-600">Loading Search Platform...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
