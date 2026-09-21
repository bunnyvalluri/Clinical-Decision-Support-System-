"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileDiff,
  Layers,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { InteroperabilityService } from "@/services/interoperability/InteroperabilityService";
import type {
  ConflictStatus,
  ConflictType,
  FHIRMappingConflictItem,
  ResolutionAction,
} from "@/services/interoperability/InteroperabilityTypes";

export default function InformaticistReconciliationPage() {
  const [conflicts, setConflicts] = React.useState<FHIRMappingConflictItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING_REVIEW");
  const [selectedConflict, setSelectedConflict] = React.useState<FHIRMappingConflictItem | null>(null);
  const [resolutionAction, setResolutionAction] = React.useState<ResolutionAction>("MERGE_RECORDS");
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [resolving, setResolving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await InteroperabilityService.fetchConflicts({
        status: statusFilter || undefined,
      });
      setConflicts(res.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load reconciliation review queue.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolve = async () => {
    if (!selectedConflict) return;
    try {
      setResolving(true);
      setSuccessMsg(null);
      setError(null);
      await InteroperabilityService.resolveConflict(
        selectedConflict.id,
        resolutionAction,
        resolutionNotes
      );
      setSuccessMsg(`Conflict successfully resolved with action: ${resolutionAction}`);
      setSelectedConflict(null);
      setResolutionNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to resolve conflict.");
    } finally {
      setResolving(false);
    }
  };

  const getConflictTypeBadge = (type: ConflictType) => {
    switch (type) {
      case "OVERWRITE_PROTECTION_TRIGGERED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DUPLICATE_PATIENT_MATCH":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "VALUE_OUT_OF_BOUNDS":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/informaticist/interoperability" className="text-xs font-semibold text-amber-800 hover:underline">
              ← Interoperability Hub
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600">Reconciliation Queue</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Clinical Reconciliation & Human Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Audit and decide on ambiguous patient matches, duplicate records, and authoritative overwrite protection events.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="">All Review Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED_APPLY">Approved & Applied</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-emerald-800">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && conflicts.length === 0 && (
        <div className="p-12 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <UserCheck className="h-10 w-10 text-emerald-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Reconciliation Queue is Clean</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {statusFilter === "PENDING_REVIEW"
              ? "Zero pending conflicts or ambiguous patient matches requiring human clinician review."
              : "No conflicts found for the selected status filter."}
          </p>
        </div>
      )}

      {/* Conflict Items List */}
      <div className="grid grid-cols-1 gap-4">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {conflict.resource_type}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getConflictTypeBadge(conflict.conflict_type)}`}>
                  {conflict.conflict_type}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                  Status: {conflict.status}
                </span>
                {conflict.confidence_score && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Match: {(Number(conflict.confidence_score) * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                Created: {new Date(conflict.created_at).toLocaleString()}
              </div>
            </div>

            {/* Field Discrepancies Side-by-Side Diff */}
            {conflict.discrepancy_details && Object.keys(conflict.discrepancy_details).length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <FileDiff className="h-3.5 w-3.5 text-slate-500" />
                  Detected Field Discrepancies (Authoritative vs Incoming)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {Object.entries(conflict.discrepancy_details).map(([field, vals]: [string, any]) => (
                    <div key={field} className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider block">
                        {field}
                      </span>
                      {vals?.existing !== undefined ? (
                        <div className="mt-1 space-y-0.5">
                          <div className="text-slate-500">
                            Authoritative: <strong className="text-slate-800">{vals.existing || "(empty)"}</strong>
                          </div>
                          <div className="text-amber-700">
                            Incoming: <strong className="text-amber-900">{vals.incoming || "(empty)"}</strong>
                          </div>
                        </div>
                      ) : (
                        <pre className="text-[11px] text-slate-600 mt-1 overflow-x-auto">
                          {JSON.stringify(vals, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Details if already resolved */}
            {conflict.status !== "PENDING_REVIEW" && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>
                  Resolution: <strong className="text-slate-900">{conflict.resolution_action}</strong> by{" "}
                  <strong className="text-slate-900">{conflict.resolved_by_name || "Clinician"}</strong> at{" "}
                  {conflict.resolved_at ? new Date(conflict.resolved_at).toLocaleString() : ""}
                </div>
                {conflict.resolution_notes && (
                  <div className="italic text-slate-500">"{conflict.resolution_notes}"</div>
                )}
              </div>
            )}

            {/* Action Buttons for Pending Conflict */}
            {conflict.status === "PENDING_REVIEW" && (
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setSelectedConflict(conflict)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Review & Resolve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resolve Modal / Dialog */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Human Reconciliation Decision
                </h3>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Select an authorized clinical reconciliation action. Neon PostgreSQL will be updated
                according to explicit healthcare data integrity rules.
              </p>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5">
                  Reconciliation Action
                </label>
                <div className="space-y-2">
                  {[
                    {
                      action: "MERGE_RECORDS",
                      label: "Merge Non-Conflicting Fields",
                      desc: "Preserves existing values; fills only empty/missing fields on internal record.",
                    },
                    {
                      action: "OVERWRITE_EXISTING",
                      label: "Overwrite Authoritative Record",
                      desc: "Explicit clinician authorization to update internal record with external data.",
                    },
                    {
                      action: "CREATE_NEW_RECORD",
                      label: "Create Distinct Record",
                      desc: "Ingests external record as a new disjoint internal entity.",
                    },
                    {
                      action: "REJECT_INCOMING",
                      label: "Reject Incoming Payload",
                      desc: "Discards incoming data without modifying internal database.",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.action}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        resolutionAction === opt.action
                          ? "bg-amber-50/60 border-amber-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        value={opt.action}
                        checked={resolutionAction === opt.action}
                        onChange={(e) => setResolutionAction(e.target.value as ResolutionAction)}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <strong className="text-slate-900 block">{opt.label}</strong>
                        <span className="text-slate-500 text-[11px]">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Clinical Justification / Audit Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="State reason for decision (e.g. Verified with attending physician or hospital EHR)..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedConflict(null)}
                disabled={resolving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {resolving ? "Executing..." : "Apply Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
