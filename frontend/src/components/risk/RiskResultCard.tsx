import React from "react";
import { RiskLevelBadge } from "./RiskLevelBadge";
import { PredictionConfidence } from "./PredictionConfidence";
import { PredictionExplanation } from "./PredictionExplanation";
import { DataQualityIndicator } from "./DataQualityIndicator";
import { UncertaintyIndicator } from "./UncertaintyIndicator";
import { ClinicalAlert } from "./ClinicalAlert";
import { ClinicalReviewPanel } from "./ClinicalReviewPanel";
import { AlertCircle, Clock, Cpu, FileText, ShieldAlert, Sparkles, User } from "lucide-react";
import { RiskLevel, RiskPrediction } from "@/services/risk/riskApi";

export interface RiskResultCardProps {
  prediction: RiskPrediction;
  patientName?: string;
  onRecordReview?: (predictionId: string, override: RiskLevel, rationale: string) => Promise<void>;
  disabledReview?: boolean;
}

export const RiskResultCard: React.FC<RiskResultCardProps> = ({
  prediction,
  patientName,
  onRecordReview,
  disabledReview = false,
}) => {
  const cdss = prediction.cdss_guidance;
  const reviewRequired =
    cdss?.suggested_clinical_review === "MANDATORY_STAT" ||
    cdss?.suggested_clinical_review === "REQUIRED" ||
    prediction.risk_level === "HIGH" ||
    prediction.risk_level === "CRITICAL";

  const dateStr = new Date(prediction.prediction_timestamp || prediction.timestamp).toLocaleString();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-4">
      {/* Top Banner with Patient & Meta */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100/70 border border-sky-200 flex items-center justify-center text-sky-800 font-bold text-sm">
            {prediction.risk_level[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {patientName || `Patient MRN: ${prediction.patient_mrn || prediction.patient}`}
              </h3>
              <RiskLevelBadge level={prediction.risk_level} />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-600" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-600" />
                {prediction.model_name} (v{prediction.model_version || prediction.model_version_str})
              </span>
            </div>
          </div>
        </div>

        {/* Quality & Uncertainty badges */}
        <div className="flex flex-wrap items-center gap-2">
          <DataQualityIndicator
            status={cdss?.data_quality_status || "VALID"}
            issueCount={cdss?.data_quality_issues?.length || 0}
          />
          <UncertaintyIndicator
            uncertaintyScore={prediction.uncertainty_score}
            oodStatus={prediction.ood_status}
            isAbstaining={prediction.is_abstaining}
          />
        </div>
      </div>

      <div className="p-5 pt-0 space-y-4">
        {/* Deterministic Rules & Urgent Clinical Alerts */}
        {cdss?.deterministic_alerts && cdss.deterministic_alerts.length > 0 && (
          <ClinicalAlert alerts={cdss.deterministic_alerts} />
        )}

        {/* Clinical Synthesis / Summary Narrative */}
        {cdss?.clinical_summary && (
          <div className="p-3.5 rounded-lg bg-sky-50/50 border border-sky-200/80 text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span className="flex items-center gap-1.5 text-sky-900">
                <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                Intelligent Clinical Decision Support Synthesis
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  cdss.suggested_clinical_review === "MANDATORY_STAT"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : cdss.suggested_clinical_review === "REQUIRED"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                Review: {cdss.suggested_clinical_review}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{cdss.clinical_summary}</p>
          </div>
        )}

        {/* Confidence & Explainability Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <PredictionConfidence
              confidence={Number(prediction.confidence_score || prediction.probability)}
              probability={Number(prediction.probability)}
              confidenceLevel={cdss?.confidence_level || "HIGH"}
              latencyMs={Number(prediction.inference_latency || prediction.inference_latency_ms)}
              isAbstaining={prediction.is_abstaining}
            />
          </div>

          <div className="lg:col-span-2">
            <PredictionExplanation
              factors={
                cdss?.key_contributing_factors ||
                prediction.explanation?.top_risk_factors ||
                []
              }
              method={prediction.explanation?.method || "TreeSHAP"}
              baselineValue={prediction.explanation?.baseline_value}
            />
          </div>
        </div>

        {/* Physician Clinical Review & Sign-Off */}
        {onRecordReview && (
          <ClinicalReviewPanel
            predictionId={prediction.id || prediction.prediction_id}
            currentRiskLevel={prediction.risk_level}
            currentOverride={prediction.clinician_override}
            currentRationale={prediction.override_reason}
            overriddenByName={prediction.overridden_by_name}
            onRecordReview={onRecordReview}
            disabled={disabledReview}
          />
        )}

        {/* Mandatory Clinical Safety Disclaimer */}
        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span>
            {cdss?.safety_disclaimer ||
              "HealthNova AI Clinical Decision Support is decision support only. Not an autonomous diagnosis or prescription. Attending clinician review is mandatory."}
          </span>
        </div>
      </div>
    </div>
  );
};
