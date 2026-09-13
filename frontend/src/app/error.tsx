"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, HeartPulse, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Clinical System Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 shadow-sm space-y-5">
        <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertOctagon className="h-8 w-8" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
            System Error State
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Application Service Interruption
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            An unexpected client-side exception occurred. Diagnostic error details have been sanitized and recorded in the audit pipeline.
          </p>
          {error?.digest && (
            <span className="inline-block mt-3 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-500">
              Digest: {error.digest}
            </span>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 text-xs shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Action
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <HeartPulse className="h-3.5 w-3.5" />
              Return to Safety
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
