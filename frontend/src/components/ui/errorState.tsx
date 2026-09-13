import * as React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load clinical data",
  message = "An unexpected error occurred while communicating with the hospital decision support system.",
  code,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 rounded-xl border border-rose-200 bg-rose-50/50 text-center max-w-lg mx-auto my-6 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-rose-200 text-rose-600 mb-4 shadow-sm">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-md">{message}</p>
      {code && (
        <span className="mt-3 px-2.5 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-500">
          ERR_CODE: {code}
        </span>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-5 gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
}
