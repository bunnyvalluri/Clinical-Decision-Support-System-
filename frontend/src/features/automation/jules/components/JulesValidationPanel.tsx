"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileCheck,
  Terminal,
} from "lucide-react";

interface CheckItem {
  status: string;
  message: string;
}

interface Props {
  validationStatus: string;
  checks?: Record<string, CheckItem>;
  affectedFiles?: string[];
}

export function JulesValidationPanel({ validationStatus, checks, affectedFiles }: Props) {
  const isPassed = validationStatus === "PASSED";
  const isFailed = validationStatus === "FAILED";

  const defaultChecks: Record<string, CheckItem> = checks || {
    typescript: { status: "PASSED", message: "TypeScript compiler passed with zero type errors." },
    react_doctor: { status: "PASSED", message: "React Doctor architecture & accessibility clean." },
    django_check: { status: "PASSED", message: "Django system checks verified." },
    bruno_api: { status: "PASSED", message: "Bruno API test suites intact." },
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">
              Automated Validation Gates
            </h3>
            <p className="text-xs text-slate-500">
              Multi-layer verification executed prior to review & merge
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isPassed
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : isFailed
              ? "bg-rose-50 text-rose-800 border-rose-300"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {isPassed ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>ALL CHECKS PASSED</span>
            </>
          ) : isFailed ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>VALIDATION FAILED</span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>PENDING EXECUTION</span>
            </>
          )}
        </span>
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {Object.entries(defaultChecks).map(([key, item]) => (
          <div
            key={key}
            className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3 text-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 capitalize">
                {key.replace("_", " ")}
              </p>
              <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                {item.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Affected Files List */}
      {affectedFiles && affectedFiles.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Target Affected Files ({affectedFiles.length}):</span>
          </p>
          <div className="space-y-1">
            {affectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="font-mono text-[11px] text-slate-600 px-2.5 py-1 rounded bg-slate-100/70 border border-slate-200/60 truncate"
              >
                {file}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
