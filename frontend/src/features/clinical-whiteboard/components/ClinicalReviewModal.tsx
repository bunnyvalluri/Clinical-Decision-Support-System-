"use client";

import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, AlertOctagon, FileEdit } from "lucide-react";
import { ClinicalWhiteboard } from "../types/whiteboard";

interface ClinicalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiteboard: ClinicalWhiteboard;
  userRole: string;
  onReviewSubmit: (action: "SUBMIT" | "APPROVE" | "REQUEST_CHANGES", notes: string) => Promise<void>;
}

export default function ClinicalReviewModal({
  isOpen,
  onClose,
  whiteboard,
  userRole,
  onReviewSubmit,
}: ClinicalReviewModalProps) {
  const [action, setAction] = useState<"SUBMIT" | "APPROVE" | "REQUEST_CHANGES">("SUBMIT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isDoctorOrAdmin = ["DOCTOR", "CLINICIAN", "IT_ADMIN", "ADMIN"].includes(userRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onReviewSubmit(action, notes);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-semibold text-slate-900">Clinical Governance & Review</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <p className="font-semibold">Prompt 32 Non-Authoritative Invariant Notice:</p>
            <p className="mt-0.5 text-amber-800">
              Clinical whiteboards are auxiliary visualization records. Approval indicates multidisciplinary
              consensus on diagram accuracy, locking version {whiteboard.current_version} against accidental modification.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Review Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("SUBMIT")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                  action === "SUBMIT"
                    ? "border-sky-600 bg-sky-50 text-sky-900 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <FileEdit className="h-4 w-4 text-sky-600" />
                <span className="text-xs">Submit Review</span>
              </button>

              {isDoctorOrAdmin && (
                <button
                  type="button"
                  onClick={() => setAction("APPROVE")}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                    action === "APPROVE"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs">Physician Sign-Off</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAction("REQUEST_CHANGES")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                  action === "REQUEST_CHANGES"
                    ? "border-rose-600 bg-rose-50 text-rose-900 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <AlertOctagon className="h-4 w-4 text-rose-600" />
                <span className="text-xs">Request Changes</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Review Notes & Observations
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Reviewed triage escalation branches against surviving sepsis guidelines. Protocol approved for ward implementation."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Commit Review Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
