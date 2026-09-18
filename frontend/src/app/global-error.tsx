"use client";

import * as React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Client-side diagnostic telemetry logging
    console.error("Root Application Boundary Failure:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-800 tracking-tight">HealthNova AI</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
              Critical Fault Boundary
            </span>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Application Boundary Exception
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              A root layout exception occurred. HealthNova AI has safely isolated the clinical session to safeguard data integrity.
            </p>
            {error?.digest && (
              <span className="inline-block mt-3 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-500">
                Digest: {error.digest}
              </span>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => reset()}
              className="w-full gap-2 text-xs shadow-sm bg-slate-900 text-white hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
