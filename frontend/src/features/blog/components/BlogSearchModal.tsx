"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Loader2, ArrowRight, BookOpen } from "lucide-react";
import { searchArticles } from "../services/blogService";
import { BlogSearchResult } from "../types/blogTypes";

interface BlogSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BlogSearchModal({ isOpen, onClose }: BlogSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchArticles(query);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Blog Articles"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search healthcare AI, clinical guidelines, wearables..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-teal-600 shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!query.trim() && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type keywords to search verified educational and clinical articles.
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No articles matched your search &quot;{query}&quot;.
            </div>
          )}

          {results.map((art) => (
            <Link
              key={art.id}
              href={`/blog/${art.slug}`}
              onClick={onClose}
              className="group flex items-start justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors text-left"
            >
              <div className="space-y-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {art.category_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {art.reading_time_minutes} min read
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                  {art.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {art.excerpt}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 shrink-0 mt-2 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400">
          <span>Press ESC to close</span>
          <span className="flex items-center gap-1 font-medium">
            <BookOpen className="h-3 w-3 text-teal-600" />
            HealthNova AI Research Index
          </span>
        </div>
      </div>
    </div>
  );
}
