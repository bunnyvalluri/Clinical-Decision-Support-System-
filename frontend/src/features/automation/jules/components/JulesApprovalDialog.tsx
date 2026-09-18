"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  X,
  AlertTriangle,
  FileCode,
  GitBranch,
} from "lucide-react";
import { JulesRemediationJob } from "@/types/jules";

interface Props {
  job: JulesRemediationJob | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (job: JulesRemediationJob, reason: string) => Promise<void>;
}

export function JulesApprovalDialog({ job, isOpen, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(job, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to approve remediation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">
              Dual-Custody Plan Approval
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {job.correlation_id}
            </p>
          </div>
        </div>

        {/* Issue Details Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              ISSUE TITLE
            </span>
            <p className="font-bold text-slate-900">{job.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Target Branch:</span>{" "}
              <span className="font-semibold text-slate-700">{job.branch}</span>
            </div>
            <div>
              <span className="text-slate-400">Severity:</span>{" "}
              <span className="font-semibold text-amber-700">{job.severity}</span>
            </div>
          </div>
        </div>

        {/* Safety Warning */}
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">
            <strong>Clinical Safety Invariant:</strong> Approving signals Jules to proceed with code execution in an isolated branch. Production direct modification remains strictly blocked.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs mb-4">
            {error}
          </div>
        )}

        {/* Approval Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Approval Rationale / Instructions (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified root cause in logs. Proceed with targeted patch."
              rows={3}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? "Approving..." : "Confirm & Authorize Fix"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
