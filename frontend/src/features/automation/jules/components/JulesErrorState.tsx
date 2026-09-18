"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function JulesErrorState({
  title = "Failed to load Jules automation data",
  message = "An error occurred contacting the backend automation service.",
  onRetry,
}: Props) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center shadow-xs">
      <div className="h-12 w-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
