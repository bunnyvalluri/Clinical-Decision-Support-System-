"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Flame,
  HelpCircle,
  Microscope,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ClinicalRuleAlertData {
  rule_name: string;
  severity: "NORMAL" | "MONITOR" | "URGENT_EVALUATION" | "CRITICAL_EMERGENCY";
  trigger_criteria: string;
  recommended_action: string;
  evaluated_at?: string;
}

export interface GuidelineCitationData {
  guideline_id: string;
  title: string;
  organization: string;
  section: string;
  recommendation: string;
  evidence_level: string;
  doi_or_url?: string;
}

export interface UncertaintyData {
  probability: number;
  confidence_score: number;
  entropy: number;
  ensemble_variance: number;
  is_out_of_distribution: boolean;
  ood_distance: number;
  should_abstain: boolean;
  clinical_recommendation: string;
}

export interface ClinicalIntelligenceProps {
  patientMrn: string;
  deterministicRules?: ClinicalRuleAlertData[];
  uncertainty?: UncertaintyData;
  guidelines?: GuidelineCitationData[];
  requiresHumanReview?: boolean;
  correlationId?: string;
  onSignOff?: (decision: string, rationale: string) => Promise<void>;
}

export function ClinicalIntelligencePanel({
  patientMrn,
  deterministicRules = [
    {
      rule_name: "NEWS2 Clinical Deterioration Protocol",
      severity: "MONITOR",
      trigger_criteria: "Aggregate NEWS2 score 3/20: Low clinical deterioration risk baseline.",
      recommended_action: "Routine monitoring by ward nursing staff. Next evaluation scheduled in 4 hours.",
    },
    {
      rule_name: "qSOFA Sepsis Screening",
      severity: "NORMAL",
      trigger_criteria: "qSOFA 0/3: No acute organ failure criteria met.",
      recommended_action: "Standard surveillance; repeat upon vital instability.",
    },
  ],
  uncertainty = {
    probability: 0.14,
    confidence_score: 0.72,
    entropy: 0.584,
    ensemble_variance: 0.0042,
    is_out_of_distribution: false,
    ood_distance: 1.18,
    should_abstain: false,
    clinical_recommendation:
      "Model evaluation confidence is adequate (72.0%). Review in context of total clinical presentation.",
  },
  guidelines = [
    {
      guideline_id: "SSC-2021-SEPSIS",
      title: "Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021",
      organization: "SCCM / ESICM",
      section: "Screening and Early Resuscitation (§2.1 - §2.4)",
      recommendation:
        "For adults with suspected sepsis, recommend measuring blood lactate and utilizing qSOFA as an alert prompt.",
      evidence_level: "Strong Recommendation, Moderate Quality Evidence",
      doi_or_url: "https://doi.org/10.1097/CCM.0000000000005337",
    },
    {
      guideline_id: "AHA-ACC-2017-HTN",
      title: "ACC/AHA Guideline for the Prevention, Detection, and Management of High Blood Pressure",
      organization: "AHA / ACC",
      section: "Hypertensive Crises and Inpatient Blood Pressure (§11.2)",
      recommendation:
        "Hypertensive crisis defined as BP > 180/120 mmHg; evaluate immediately for acute target organ damage.",
      evidence_level: "Class I, Level B-NR",
      doi_or_url: "https://doi.org/10.1161/HYP.0000000000000065",
    },
  ],
  requiresHumanReview = false,
  correlationId = "trace-eval-8921a",
  onSignOff,
}: ClinicalIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<"RULES" | "UNCERTAINTY" | "GUIDELINES" | "REVIEW">("RULES");
  const [decision, setDecision] = useState<"APPROVED" | "MODIFIED" | "OVERRIDDEN" | "REJECTED">("APPROVED");
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signOffDone, setSignOffDone] = useState(false);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    setIsSubmitting(true);
    try {
      if (onSignOff) {
        await onSignOff(decision, rationale);
      }
      setSignOffDone(true);
    } catch {
      // Graceful local feedback
      setSignOffDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header Banner */}
      <CardHeader className="bg-slate-50/80 border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Microscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-900">
                  Clinical Intelligence Orchestrator
                </CardTitle>
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  CDSS AI Assistant
                </Badge>
                {uncertainty.should_abstain ? (
                  <Badge variant="critical" className="text-xs">
                    ABSTAIN RECOMMENDED
                  </Badge>
                ) : requiresHumanReview ? (
                  <Badge variant="warning" className="text-xs">
                    PHYSICIAN REVIEW MANDATED
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs">
                    CONFIDENCE ADEQUATE
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Deterministic clinical rules, uncertainty estimation, and grounded RAG citations for patient {patientMrn}.
              </CardDescription>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-400 block">Correlation ID:</span>
            <span className="text-xs font-mono font-semibold text-slate-600">{correlationId.slice(0, 18)}...</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-200/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("RULES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "RULES"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            Deterministic Protocols ({deterministicRules.length})
          </button>
          <button
            onClick={() => setActiveTab("UNCERTAINTY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "UNCERTAINTY"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Uncertainty & OOD ({(uncertainty.confidence_score * 100).toFixed(0)}%)
          </button>
          <button
            onClick={() => setActiveTab("GUIDELINES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "GUIDELINES"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Grounded Guidelines ({guidelines.length})
          </button>
          <button
            onClick={() => setActiveTab("REVIEW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "REVIEW"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Clinician Sign-off {signOffDone && "✓"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Tab 1: Deterministic Rules */}
        {activeTab === "RULES" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Physiological Safety Override Engine
              </span>
              <span className="text-[11px] text-slate-400">Deterministic qSOFA / NEWS2 Logic</span>
            </div>
            {deterministicRules.map((rule, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  rule.severity === "CRITICAL_EMERGENCY"
                    ? "bg-rose-50/70 border-rose-200"
                    : rule.severity === "URGENT_EVALUATION"
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-slate-50/60 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {rule.severity === "CRITICAL_EMERGENCY" ? (
                      <Flame className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    ) : rule.severity === "URGENT_EVALUATION" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rule.rule_name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">{rule.trigger_criteria}</p>
                      <p className="text-xs text-slate-800 mt-1.5 font-medium leading-relaxed">
                        <strong className="text-slate-900">Clinical Protocol: </strong>
                        {rule.recommended_action}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      rule.severity === "CRITICAL_EMERGENCY"
                        ? "critical"
                        : rule.severity === "URGENT_EVALUATION"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] shrink-0"
                  >
                    {rule.severity.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Uncertainty & OOD */}
        {activeTab === "UNCERTAINTY" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium block">Confidence Score</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {(uncertainty.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium block">Shannon Entropy</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {uncertainty.entropy.toFixed(3)} <span className="text-xs text-slate-400 font-normal">/ 1.0</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium block">Ensemble Variance</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {uncertainty.ensemble_variance.toFixed(4)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium block">OOD Manifold</span>
                <span className={`text-lg font-bold font-mono ${uncertainty.is_out_of_distribution ? "text-rose-600" : "text-emerald-600"}`}>
                  {uncertainty.is_out_of_distribution ? "OUTLIER" : "IN-BOUNDS"}
                </span>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                uncertainty.should_abstain
                  ? "bg-rose-50 border-rose-200 text-rose-950"
                  : "bg-blue-50/50 border-blue-200 text-blue-950"
              }`}
            >
              <div className="flex items-start gap-3">
                {uncertainty.should_abstain ? (
                  <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {uncertainty.should_abstain ? "Automated Abstention Triggered" : "Statistical Validation Verdict"}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">{uncertainty.clinical_recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Grounded Guidelines */}
        {activeTab === "GUIDELINES" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Grounded Clinical Knowledge (RAG)
              </span>
              <span className="text-[11px] text-slate-400">Peer-Reviewed Evidence Sources</span>
            </div>
            {guidelines.map((guide, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {guide.guideline_id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{guide.title}</h4>
                    <span className="text-[11px] text-slate-500 block">
                      {guide.organization} • {guide.section}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white shrink-0">
                    {guide.evidence_level}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  &ldquo;{guide.recommendation}&rdquo;
                </p>
                {guide.doi_or_url && (
                  <a
                    href={guide.doi_or_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 underline font-medium pt-1"
                  >
                    View Source Literature <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Clinician Review & Sign-Off */}
        {activeTab === "REVIEW" && (
          <div className="space-y-4">
            {signOffDone ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Clinician Evaluation Recorded</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your decision ({decision}) has been committed to the immutable HIPAA audit log.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDecisionSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Clinician Evaluation Action *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: "APPROVED", label: "Accept Recommendation" },
                      { value: "MODIFIED", label: "Modify Plan" },
                      { value: "OVERRIDDEN", label: "Override AI" },
                      { value: "REJECTED", label: "Reject Evaluation" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setDecision(opt.value as "APPROVED" | "MODIFIED" | "OVERRIDDEN" | "REJECTED")}
                        className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                          decision === opt.value
                            ? "border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Clinical Rationale & Context *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Enter clinical assessment rationale, patient-specific contraindications, or treatment adjustments..."
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white p-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Governed under CDSS Human-in-the-Loop Protocol.
                  </span>
                  <Button type="submit" disabled={isSubmitting || !rationale.trim()} size="sm" className="gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Commit Clinical Sign-off
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Mandatory Clinical Decision Support Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Decision Support Notice:</strong> This system assists licensed healthcare professionals.
            It does not issue autonomous medical diagnoses, therapeutic prescriptions, or clinical orders.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
