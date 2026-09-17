"use client";

import React from "react";
import type { NocoDBRow } from "@/services/nocodb/types";

interface DataQualityDrawerProps {
  row: NocoDBRow | null;
  onClose: () => void;
  onUpdateStatus?: (status: string) => void;
}

export function DataQualityDrawer({
  row,
  onClose,
  onUpdateStatus,
}: DataQualityDrawerProps) {
  if (!row) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Quality Anomaly Detail
          </span>
          <h3 className="text-sm font-bold text-slate-900 mt-1">
            {row.rule_id || row._anon_ref_id || "Record Inspector"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
            Target Table
          </label>
          <div className="font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200">
            {row.table_name || "N/A"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
              Check Type
            </label>
            <div className="text-slate-800 font-medium">
              {row.check_type || "Anomaly"}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
              Severity
            </label>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                row.severity === "Critical"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {row.severity || "Medium"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
            Affected Records Count
          </label>
          <div className="text-slate-900 font-bold text-base font-mono">
            {row.affected_records ?? 0} records
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Current Resolution Status
          </label>
          <div className="flex gap-2">
            {["Open", "Investigating", "Resolved"].map((st) => (
              <button
                key={st}
                onClick={() => onUpdateStatus && onUpdateStatus(st)}
                className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                  row.status === st
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-1">Remediation Protocol</h4>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Verify clinical source telemetry ingestion logs in Neon PostgreSQL. If records
            contain physiological outliers beyond 3 sigma standard deviations, escalate
            to attending nursing staff for sensor calibration.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
}
