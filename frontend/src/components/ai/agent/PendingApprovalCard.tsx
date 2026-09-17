"use client";

import * as React from "react";
import { ShieldAlert, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentApprovalDTO, approvalService } from "@/services/ai/approvalService";

interface PendingApprovalCardProps {
  approval: AgentApprovalDTO;
  onResolved?: (updatedApproval: AgentApprovalDTO) => void;
}

export const PendingApprovalCard: React.FC<PendingApprovalCardProps> = ({
  approval,
  onResolved,
}) => {
  const [rationale, setRationale] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await approvalService.decideApproval(approval.id, decision, rationale);
      if (onResolved) {
        onResolved(updated);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to submit decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = approval.status === "REQUESTED" || approval.status === "PENDING";

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Human Clinician Approval Required
            </h4>
            <p className="text-xs text-slate-500">
              High-Risk Clinical Action Gate · Sign-Off Enforced
            </p>
          </div>
        </div>

        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            approval.status === "APPROVED"
              ? "bg-emerald-100 text-emerald-800"
              : approval.status === "REJECTED"
              ? "bg-rose-100 text-rose-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {approval.status}
        </span>
      </div>

      <div className="rounded-lg bg-white p-3 border border-amber-200 text-xs space-y-2">
        <div>
          <span className="font-semibold text-slate-700">Action: </span>
          <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
            {approval.requested_action}
          </span>
        </div>

        <div>
          <span className="font-semibold text-slate-700">Clinical Reason: </span>
          <span className="text-slate-800">{approval.reason}</span>
        </div>

        {approval.patient_mrn && (
          <div>
            <span className="font-semibold text-slate-700">Patient Scope: </span>
            <span className="font-mono text-slate-800">{approval.patient_mrn}</span>
          </div>
        )}

        {approval.evidence_summary && Object.keys(approval.evidence_summary).length > 0 && (
          <div>
            <span className="font-semibold text-slate-700">Evidence Summary: </span>
            <pre className="mt-1 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] overflow-x-auto text-slate-700">
              {JSON.stringify(approval.evidence_summary, null, 2)}
            </pre>
          </div>
        )}

        {approval.action_payload && Object.keys(approval.action_payload).length > 0 && (
          <div>
            <span className="font-semibold text-slate-700">Proposed Action Payload: </span>
            <pre className="mt-1 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] overflow-x-auto text-slate-700">
              {JSON.stringify(approval.action_payload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {isPending ? (
        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-slate-700 block">
            Clinician Rationale / Attestation Notes:
          </label>
          <input
            type="text"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="e.g., Reviewed vitals and concur with recommendation; ordering STAT labs..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleDecision("REJECTED")}
              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reject Action
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleDecision("APPROVED")}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Authorize & Sign Off
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span>
              Reviewed by: <strong>{approval.reviewed_by_name || "Clinician"}</strong>
            </span>
            {approval.reviewed_at && (
              <span className="text-slate-400 text-[11px]">
                {new Date(approval.reviewed_at).toLocaleString()}
              </span>
            )}
          </div>
          {approval.clinician_rationale && (
            <div className="mt-1 text-slate-700 italic">
              &quot;{approval.clinician_rationale}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingApprovalCard;
