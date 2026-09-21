"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { RiskAssessmentCard } from "@/components/clinical/RiskAssessmentCard";
import { PredictionExplanationPanel } from "@/components/clinical/PredictionExplanationPanel";
import { PredictionFeedbackModal } from "@/components/clinical/PredictionFeedbackModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquarePlus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { RiskLevel, RiskPrediction, riskApi } from "@/services/risk/riskApi";
import apiClient from "@/services/apiClient";

export default function DoctorReviewActionDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();

  const [prediction, setPrediction] = React.useState<RiskPrediction | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [overrideRiskTier, setOverrideRiskTier] = React.useState<RiskLevel>("MEDIUM");
  const [rationale, setRationale] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedDecision, setSubmittedDecision] = React.useState<string | null>(null);

  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState<boolean>(false);

  const loadPrediction = React.useCallback(async () => {
    if (!reviewId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await riskApi.getPrediction(reviewId);
      setPrediction(data);
      if (data.clinician_override) {
        setOverrideRiskTier(data.clinician_override as RiskLevel);
      }
      if (data.override_reason) {
        setRationale(data.override_reason);
      }
    } catch (err: any) {
      console.warn("Could not load direct prediction, trying fallback:", err);
      try {
        const res = await apiClient.get(`/api/v1/predictions/${reviewId}/`);
        setPrediction(res.data);
      } catch (err2: any) {
        setLoadError(
          err2?.response?.data?.error ||
            err2?.message ||
            "Unable to load prediction record from Neon PostgreSQL database."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [reviewId]);

  React.useEffect(() => {
    loadPrediction();
  }, [loadPrediction]);

  async function handleDecision(decision: "CONCUR" | "OVERRIDE") {
    if (decision === "OVERRIDE" && !rationale.trim()) {
      setSubmitError("Documented clinical rationale is mandatory when overriding AI risk predictions.");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      try {
        await apiClient.post(`/api/v1/predictions/reviews/${reviewId}/decision/`, {
          decision,
          status: "REVIEWED",
          rationale: rationale.trim(),
          override_risk_level: decision === "OVERRIDE" ? overrideRiskTier : undefined,
        });
      } catch {
        // Direct route fallback
        await apiClient.post(`/api/v1/prediction-reviews/${reviewId}/decision/`, {
          decision,
          status: "REVIEWED",
          rationale: rationale.trim(),
          override_risk_level: decision === "OVERRIDE" ? overrideRiskTier : undefined,
        });
      }
      setSubmittedDecision(decision);
      loadPrediction();
    } catch (err: any) {
      console.error("Review decision submission failed:", err);
      setSubmitError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to record clinical review decision."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const patientName = prediction?.patient ? `Patient ${prediction.patient}` : `MRN: ${prediction?.patient_mrn || reviewId}`;
  const rawFactors: Array<{ feature?: string; feature_name?: string; contribution?: number; description?: string }> =
    prediction?.cdss_guidance?.key_contributing_factors ||
    prediction?.explanation?.top_risk_factors ||
    [];
  const topFactors = rawFactors.map((f) => ({
    feature: f.feature ?? f.feature_name ?? "Unknown",
    contribution: f.contribution ?? 0,
    description: f.description,
  }));

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/doctor/reviews")}
              className="gap-1 text-xs text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Reviews Queue
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium font-mono">
              Review #{reviewId?.slice(0, 8)}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadPrediction}
            disabled={isLoading}
            className="h-8 text-xs gap-1.5 border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center rounded-xl border border-slate-200 bg-white space-y-3">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">Loading Clinical Inference</h3>
            <p className="text-xs text-slate-500">
              Retrieving authoritative prediction metadata, TreeSHAP attributions, and patient chart from Neon PostgreSQL...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && loadError && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Unable to Load Review Item</span>
            </div>
            <p>{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPrediction}
              className="text-xs border-rose-300 hover:bg-rose-100"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Prediction Display */}
        {!isLoading && prediction && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Physician Risk Review & Attestation
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Patient: <strong className="text-slate-900">{patientName}</strong> — MRN:{" "}
                  <strong className="font-mono text-slate-800">{prediction.patient_mrn || "RECORDED"}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="text-xs border-slate-300 gap-1.5 h-8"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-sky-700" />
                  Clinical Feedback
                </Button>

                {submittedDecision || prediction.clinician_override ? (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs py-1">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Decision Recorded:{" "}
                    {submittedDecision || (prediction.clinician_override ? `OVERRIDDEN (${prediction.clinician_override})` : "CONCURRED")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs py-1">
                    <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" /> Awaiting Attestation
                  </Badge>
                )}
              </div>
            </div>

            {/* Risk Assessment Card */}
            <RiskAssessmentCard
              riskLevel={prediction.risk_level}
              probability={prediction.probability}
              confidenceScore={prediction.confidence_score ?? undefined}
              uncertaintyScore={prediction.uncertainty_score ?? undefined}
              isAbstaining={prediction.is_abstaining}
              modelName={prediction.model_name}
              modelVersion={prediction.model_version_str || String(prediction.model_version || "1.0.0")}
              predictionTime={new Date(prediction.prediction_timestamp || prediction.timestamp).toLocaleString()}
              reviewStatus={prediction.clinician_override ? "OVERRIDDEN" : submittedDecision ? "REVIEWED" : "PENDING_REVIEW"}
              topFactors={topFactors}
            />

            {/* Explanation Panel */}
            <PredictionExplanationPanel
              method={prediction.explanation?.method || "TreeSHAP"}
              baselineValue={prediction.explanation?.baseline_value ?? 0.312}
              features={topFactors}
            />

            {/* Attestation Controls Card */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold text-slate-900">
                  Physician Attestation & Override Controls
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Mandatory clinical sign-off requirement under CDSS governance standard. All actions are logged immutably.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Override Risk Tier (if overriding):
                    </label>
                    <Select
                      value={overrideRiskTier}
                      onValueChange={(val) => setOverrideRiskTier(val as RiskLevel)}
                    >
                      <SelectTrigger className="text-xs border-slate-200 bg-white">
                        <SelectValue placeholder="Select target risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">LOW Risk</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM Risk</SelectItem>
                        <SelectItem value="HIGH">HIGH Risk</SelectItem>
                        <SelectItem value="CRITICAL">CRITICAL Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Clinical Rationale & Attestation Notes:
                    </label>
                    <Textarea
                      placeholder="Mandatory justification if overriding AI tier. Document clinical rationale, bedside findings, or diagnostic corroboration..."
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      className="text-xs min-h-[90px] border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 max-w-md">
                    Signing off writes an immutable audit log entry in Neon PostgreSQL linked to your clinician user ID and broadcasts to the patient channel.
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting || !!submittedDecision}
                      onClick={() => handleDecision("OVERRIDE")}
                      className="border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-medium"
                    >
                      <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                      Override AI Tier to {overrideRiskTier}
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSubmitting || !!submittedDecision}
                      onClick={() => handleDecision("CONCUR")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium"
                    >
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      Concur & Attest Risk Level
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clinical Prediction Feedback Modal */}
        {prediction && (
          <PredictionFeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            predictionId={prediction.id || prediction.prediction_id || reviewId}
            patientName={patientName}
            onFeedbackSubmitted={() => {
              loadPrediction();
            }}
          />
        )}
      </div>
    </DoctorLayout>
  );
}
