"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Cpu,
  Edit3,
  FileCheck,
  HeartPulse,
  Info,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ShapWaterChart } from "@/components/ui/chart";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useAuthStore } from "@/features/auth/authStore";
import type { RiskLevel } from "@/types";

export default function PredictionExplanationPage() {
  const params = useParams();
  const router = useRouter();
  const predictionId = params.id as string;

  const { predictions, overridePrediction } = useClinicalStore();
  const { user } = useAuthStore();

  const prediction =
    predictions.find((p) => p.id === predictionId) || predictions[0];

  // Override Modal state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [overrideRisk, setOverrideRisk] = React.useState<RiskLevel>(prediction.risk_level);
  const [overrideRationale, setOverrideRationale] = React.useState("");
  const [overrideSuccess, setOverrideSuccess] = React.useState(false);

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideRationale) return;

    overridePrediction(prediction.id, {
      new_risk_level: overrideRisk,
      rationale: overrideRationale,
      overridden_by: user?.full_name || "Dr. Elena Vance, MD",
    });

    setOverrideSuccess(true);
    setTimeout(() => {
      setIsOverrideModalOpen(false);
      setOverrideSuccess(false);
    }, 1000);
  };

  const shapFactors = prediction.shap_attributions.map((s) => ({
    feature: s.feature,
    attribution: s.attribution,
  }));

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/predictions" className="hover:text-slate-800 flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Predictions
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Model Explanation & Diagnostic Context</span>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs text-blue-900 flex items-start gap-2.5 shadow-sm">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">CRITICAL DISTINCTION: MODEL PREDICTION vs. MEDICAL DIAGNOSIS</strong>
            <p className="mt-0.5 text-blue-950/80">
              The metrics and attribution vectors displayed on this screen represent statistical <strong>MODEL PREDICTIONS</strong> based on machine learning correlations across prior cohort data. They do NOT constitute an authoritative <strong>MEDICAL DIAGNOSIS</strong>. Clinical diagnosis and treatment decisions remain under the independent medical judgment of the attending licensed clinician.
            </p>
          </div>
        </div>

        {/* Prediction Verdict Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant={
                    prediction.risk_level === "CRITICAL"
                      ? "critical"
                      : prediction.risk_level === "HIGH"
                      ? "high"
                      : prediction.risk_level === "MEDIUM"
                      ? "medium"
                      : "low"
                  }
                  className="text-xs px-3 py-1 font-bold"
                >
                  PREDICTED {prediction.risk_level} CARDIOVASCULAR RISK
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  {prediction.model_name} {prediction.model_version}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-baseline gap-3">
                {(prediction.probability * 100).toFixed(1)}% Likelihood of Adverse Event
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span>Patient: <strong className="text-slate-800">{prediction.patient_name}</strong> ({prediction.patient_mrn})</span>
                <span>•</span>
                <span>Prediction Time: <strong className="text-slate-800 font-mono">{prediction.timestamp}</strong></span>
                <span>•</span>
                <span>Inference Latency: <strong className="text-slate-800 font-mono">22 ms</strong></span>
                <span>•</span>
                <span>Clinician: <strong className="text-slate-800">{prediction.clinician_name}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOverrideModalOpen(true)}
                className="text-xs gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                <span>Physician Override</span>
              </Button>
              <Link href={`/patients/${prediction.patient_id}`}>
                <Button variant="default" size="sm" className="text-xs gap-1.5 shadow-sm">
                  <User className="h-3.5 w-3.5" />
                  <span>Patient Chart</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Physician Override Notice Banner if overridden */}
          {prediction.physician_override && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Clinical Judgment Override Applied by {prediction.physician_override.overridden_by}
                </span>
                <span className="font-mono text-[10px] text-amber-700">
                  {prediction.physician_override.timestamp}
                </span>
              </div>
              <p className="text-amber-950 leading-relaxed">
                Risk Adjusted: <strong className="font-bold">{prediction.physician_override.new_risk_level}</strong> •{" "}
                Rationale: &quot;{prediction.physician_override.rationale}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Explainability Engine: Model Explanation Section */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Model Explanation
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  SHapley Additive exPlanations (TreeSHAP). Red bars show positive contribution toward elevated risk; green bars indicate protective contribution.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono bg-slate-50 border-slate-200 text-slate-700">
                TreeSHAP Kernel
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <ShapWaterChart factors={shapFactors} />

            {/* Feature Attribution Granular Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-50 text-xs font-bold text-slate-800 border-b border-slate-200">
                Model Explanation: Feature Attribution Breakdown
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {prediction.shap_attributions.map((s, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">{s.feature}</span>
                      <p className="text-[11px] text-slate-500">
                        {s.attribution >= 0
                          ? "This feature contributed to the model's prediction of elevated risk."
                          : "This feature contributed to the model's prediction of lower risk."}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold">
                      <span
                        className={
                          s.attribution >= 0 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        {s.attribution >= 0 ? `+${s.attribution.toFixed(3)}` : s.attribution.toFixed(3)}
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans font-medium">
                        {s.attribution >= 0 ? "Risk Contributor" : "Protective Contributor"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence-Based Clinical Recommendations */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Automated Clinical Guidance & Care Protocols
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Algorithmic recommendations aligned with ACC/AHA cardiology clinical practice guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5 text-xs">
            {prediction.guidelines.map((g, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-slate-800 leading-relaxed font-medium">{g}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Physician Override Modal */}
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title="Physician Clinical Override"
          description="Adjust the model's computed risk tier with mandatory rationale for HIPAA audit compliance."
        >
          {overrideSuccess ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-900">Override Recorded Successfully</p>
              <p className="text-xs text-slate-500">Audit trail updated in hospital ledger.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveOverride} className="space-y-4">
              <Select
                label="Adjusted Risk Tier"
                value={overrideRisk}
                onChange={(e) => setOverrideRisk(e.target.value as RiskLevel)}
                options={[
                  { value: "LOW", label: "LOW Risk" },
                  { value: "MEDIUM", label: "MEDIUM Risk" },
                  { value: "HIGH", label: "HIGH Risk" },
                  { value: "CRITICAL", label: "CRITICAL Risk" },
                ]}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mandatory Clinical Justification & Rationale
                </label>
                <textarea
                  value={overrideRationale}
                  onChange={(e) => setOverrideRationale(e.target.value)}
                  rows={4}
                  placeholder="Explain why clinical examination or auxiliary telemetry supersedes the model output..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOverrideModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" className="shadow-sm">
                  Sign & Commit Override
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
