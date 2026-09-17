"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function SearchPagination({
  page,
  totalPages,
  totalResults,
  limit,
  onPageChange,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalResults);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 rounded-xl shadow-sm">
      <div className="text-xs text-slate-500 font-medium">
        Showing <span className="font-semibold text-slate-900">{startRecord}</span> to{" "}
        <span className="font-semibold text-slate-900">{endRecord}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalResults}</span> records
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <span className="text-xs font-semibold font-mono text-slate-700 px-2">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
