"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Command,
  HeartPulse,
  Loader2,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { SearchService } from "@/services/search/searchService";
import { type SearchHit, type SearchSuggestion } from "@/services/search/searchTypes";
import { SearchResults } from "./SearchResults";

interface GlobalSearchProps {
  placeholder?: string;
  defaultIndex?: string;
  className?: string;
}

export function GlobalSearch({
  placeholder = "Search patients, MRN, predictions, models (Ctrl+K)...",
  defaultIndex,
  className = "",
}: GlobalSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex || "");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"meilisearch" | "degraded_postgres" | "unavailable">("meilisearch");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Live debounced search execution
  useEffect(() => {
    if (!isOpen) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await SearchService.search(
          {
            q: query,
            index: selectedIndex || undefined,
            limit: 8,
          },
          controller.signal
        );

        setResults(res.hits || []);
        setSearchMode(res.search_mode || "meilisearch");

        // Fetch autocomplete suggestions
        const sugg = await SearchService.getSuggestions(
          query,
          selectedIndex || undefined,
          controller.signal
        );
        setSuggestions(sugg || []);
      } catch (err: any) {
        if (err?.name !== "CanceledError") {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedIndex, isOpen]);

  return (
    <>
      {/* Trigger Bar */}
      <div
        onClick={() => setIsOpen(true)}
        className={`relative flex items-center w-full cursor-pointer select-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 shadow-sm hover:border-emerald-400 hover:bg-white transition-all ${className}`}
      >
        <Search className="mr-2 h-4 w-4 text-slate-400" />
        <span className="truncate flex-1">{placeholder}</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-xs">
          <Command className="h-3 w-3" />K
        </kbd>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-16">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
            {/* Search Input Header */}
            <div className="flex items-center border-b border-slate-200 px-4 py-3 bg-white">
              <Search className="mr-3 h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a patient name, MRN, clinical risk, model..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />}
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded p-1 text-slate-400 hover:text-slate-600 mr-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                ESC
              </button>
            </div>

            {/* Quick Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs">
              {[
                { id: "", label: "All Records" },
                { id: "patients", label: "Patients" },
                { id: "predictions", label: "Risk Predictions" },
                { id: "clinical_records", label: "Clinical Encounters" },
                { id: "models", label: "ML Models" },
                { id: "whiteboards", label: "Whiteboards" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedIndex(tab.id)}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-colors shrink-0 text-[11px] ${
                    selectedIndex === tab.id
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Suggestions Pills if available */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-white px-4 py-2">
                <span className="text-[10px] font-semibold uppercase text-slate-400 mr-1">
                  Suggestions:
                </span>
                {suggestions.map((s) => (
                  <button
                    key={s.id || s.label}
                    onClick={() => setQuery(s.label)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body / Results */}
            <div className="max-h-[60vh] overflow-y-auto p-4 bg-slate-50/40">
              <SearchResults
                hits={results}
                isLoading={isLoading}
                searchMode={searchMode}
                query={query}
                onSelectHit={(hit) => {
                  setIsOpen(false);
                  if (hit.entity_type === "patient") {
                    router.push(`/patients`);
                  } else if (hit.entity_type === "prediction") {
                    router.push(`/predictions`);
                  } else if (hit.entity_type === "model") {
                    router.push(`/admin/models`);
                  } else {
                    router.push(`/dashboard`);
                  }
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Meilisearch v1.12.0 • Authorization Protected</span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <span>Open Full Search Hub</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
