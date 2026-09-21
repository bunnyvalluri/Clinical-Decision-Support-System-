"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Send,
  Shield,
  Stethoscope,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/services/apiClient";

export interface ClinicalReviewModalProps {
  predictionId: string;
  patientName: string;
  mrn: string;
  currentRiskLevel: string;
  probability: number;
  modelVersion: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STRUCTURED_REASONS = [
  { value: "CLINICAL_PRESENTATION_DISCORDANT", label: "Patient clinical presentation discordant with vitals" },
  { value: "TRANSIENT_PHYSIOLOGICAL_FACTOR", label: "Transient physiological factor (e.g. post-exertion, anxiety)" },
  { value: "KNOWN_CHRONIC_BASELINE", label: "Known chronic baseline condition (e.g. stable COPD, baseline CKD)" },
  { value: "RECENT_MEDICATION_EFFECT", label: "Recent medication administration altering acute parameters" },
  { value: "LAB_ARTIFACT_OR_HEMOLYZED", label: "Suspected laboratory artifact or hemolyzed sample" },
  { value: "SPECIALIST_CONSULT_CONCURRENCE", label: "Consultant specialist recommendation overrides automated risk" },
  { value: "OTHER_DOCUMENTED", label: "Other documented clinical justification" },
];

export function ClinicalReviewModal({
  predictionId,
  patientName,
  mrn,
  currentRiskLevel,
  probability,
  modelVersion,
  open,
  onClose,
  onSuccess,
}: ClinicalReviewModalProps) {
  const [decision, setDecision] = React.useState<string>("CONCUR");
  const [overrideRiskLevel, setOverrideRiskLevel] = React.useState<string>("LOW");
  const [structuredReason, setStructuredReason] = React.useState<string>(STRUCTURED_REASONS[0].value);
  const [rationale, setRationale] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (decision === "OVERRIDE" && !rationale.trim()) {
      setErrorMessage("Documented clinical rationale is mandatory when overriding AI predictions.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/api/prediction-reviews/${predictionId}/decision/`, {
        decision,
        status: decision === "CONCUR" ? "REVIEWED" : (decision === "OVERRIDE" ? "OVERRIDDEN" : "REQUIRES_MORE_DATA"),
        override_risk_level: decision === "OVERRIDE" ? overrideRiskLevel : undefined,
        structured_reason: decision === "OVERRIDE" ? structuredReason : undefined,
        rationale: rationale.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to record clinical review:", err);
      setErrorMessage(err?.response?.data?.error || "Failed to submit clinical review decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Human Clinician Review Sign-Off</h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-700">{patientName}</span> ({mrn})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* AI Assessment Snapshot */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-500">Predicted Risk Tier:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={`font-bold ${
                    currentRiskLevel === "CRITICAL"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : currentRiskLevel === "HIGH"
                      ? "bg-orange-100 text-orange-800 border-orange-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {currentRiskLevel} RISK
                </Badge>
                <span className="font-mono text-slate-600">({(probability * 100).toFixed(1)}% prob)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Model Version:</span>
              <p className="font-mono font-semibold text-slate-700">{modelVersion || "v1.0.0"}</p>
            </div>
          </div>

          {/* Decision Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Physician Review Decision:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "CONCUR", label: "Concur / Accept", icon: CheckCircle2, activeClass: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                { id: "OVERRIDE", label: "Clinical Override", icon: AlertTriangle, activeClass: "border-amber-500 bg-amber-50 text-amber-800" },
                { id: "REQUEST_MORE_DATA", label: "Request Labs", icon: FileCheck, activeClass: "border-blue-500 bg-blue-50 text-blue-800" },
                { id: "ESCALATE", label: "Escalate ICU", icon: AlertCircle, activeClass: "border-rose-500 bg-rose-50 text-rose-800" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDecision(opt.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                    decision === opt.id
                      ? opt.activeClass
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <opt.icon className="h-4 w-4 mb-1" />
                  <span className="font-medium text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Override Fields */}
          {decision === "OVERRIDE" && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 animate-in fade-in">
              <div>
                <label className="block font-semibold text-amber-900 mb-1">Target Override Risk Tier:</label>
                <select
                  value={overrideRiskLevel}
                  onChange={(e) => setOverrideRiskLevel(e.target.value)}
                  className="w-full rounded-md border border-amber-300 bg-white p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="LOW">LOW RISK</option>
                  <option value="MEDIUM">MEDIUM RISK</option>
                  <option value="HIGH">HIGH RISK</option>
                  <option value="CRITICAL">CRITICAL RISK</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-amber-900 mb-1">Standardized Override Justification:</label>
                <select
                  value={structuredReason}
                  onChange={(e) => setStructuredReason(e.target.value)}
                  className="w-full rounded-md border border-amber-300 bg-white p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {STRUCTURED_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Mandatory Rationale */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Documented Clinical Rationale {decision === "OVERRIDE" && <span className="text-rose-600 font-bold">* (Mandatory)</span>}:
            </label>
            <Textarea
              placeholder={
                decision === "OVERRIDE"
                  ? "Detail clinical reasons, examination findings, or secondary diagnostics justifying override..."
                  : "Optional physician impressions and follow-up orders..."
              }
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              className="text-xs bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>

          {errorMessage && (
            <div className="rounded bg-rose-50 border border-rose-200 p-2.5 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {submitting ? "Recording Sign-Off..." : "Submit Clinical Decision"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
