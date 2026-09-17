"use client";

import React, { useState, useEffect } from "react";
import { Activity, HeartPulse, Lock, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SearchService } from "@/services/search/searchService";
import { type SearchResponse } from "@/services/search/searchTypes";

export default function PatientSelfSearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"predictions" | "clinical_records">("predictions");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const executeSearch = async (targetPage = 1) => {
    setIsLoading(true);
    try {
      // Backend automatically applies mandatory `user_id = <patient_id>` filter
      const res = await SearchService.search({
        q: query,
        index: activeTab,
        page: targetPage,
        limit: 10,
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
  }, [activeTab]);

  return (
    <Shell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  Patient Health Portal
                </span>
                <span className="text-xs font-semibold text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">Confidential Self-Service</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                My Health Records & Risk Inferences
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Search your historical risk assessments, verified vital signs snapshots, and wellness records.
              </p>
            </div>
            <button
              onClick={() => executeSearch(page)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Privacy Security Banner */}
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>HIPAA Privacy Lock:</strong> You are strictly viewing your own authenticated patient records. Other patient information is cryptographically inaccessible.
            </span>
          </div>

          {/* Tab Selector */}
          <div className="mt-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            {[
              { id: "predictions", label: "My Risk Evaluations", icon: HeartPulse },
              { id: "clinical_records", label: "My Vital Sign History", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
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
                placeholder="Search date, model, or risk category..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-4 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Container */}
        <div className="space-y-4">
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
    </Shell>
  );
}
