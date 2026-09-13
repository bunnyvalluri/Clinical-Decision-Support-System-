"use client";

import Link from "next/link";
import { ArrowLeft, FileQuestion, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-5">
        <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-sm">
          <FileQuestion className="h-8 w-8" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
            Error 404 — Record Not Located
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Clinical Resource Not Found
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The patient chart, risk assessment, or clinical report you are attempting to access does not exist or may have been archived.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="default" size="sm" className="w-full gap-2 text-xs shadow-sm">
              <HeartPulse className="h-3.5 w-3.5" />
              Return to Dashboard
            </Button>
          </Link>
          <Link href="/patients" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              Patient Registry
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
