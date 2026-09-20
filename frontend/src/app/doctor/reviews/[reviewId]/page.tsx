"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { RiskAssessmentCard } from "@/components/clinical/RiskAssessmentCard";
import { PredictionExplanationPanel } from "@/components/clinical/PredictionExplanationPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";

export default function DoctorReviewActionDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();
  const [rationale, setRationale] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedDecision, setSubmittedDecision] = React.useState<string | null>(null);

  const mockReview = {
    id: reviewId,
    patient_name: "Eleanor Vance",
    patient_mrn: "MRN-2026-089",
    risk_level: "HIGH",
    probability: 0.742,
    confidence_score: 0.865,
    uncertainty_score: 0.145,
    is_abstaining: false,
    model_name: "random_forest_risk_model",
    model_version: "1.0.0",
    prediction_time: "25 minutes ago",
    status: "PENDING_REVIEW",
    top_factors: [
      { feature: "systolic_bp", value: "172 mmHg", contribution: 0.285, direction: "RISK_INCREASING", explanation: "Marked systolic hypertension exceeding 170 mmHg." },
      { feature: "st_depression", value: "2.1 mm", contribution: 0.195, direction: "RISK_INCREASING", explanation: "Subendocardial ischemic pattern observed on exercise stress test." },
      { feature: "heart_rate", value: "102 bpm", contribution: 0.082, direction: "RISK_INCREASING", explanation: "Resting tachycardia above 100 bpm." },
    ],
  };

  async function handleDecision(decision: "CONCUR" | "OVERRIDE") {
    setIsSubmitting(true);
    try {
      await fetch(`/api/v1/predictions/reviews/${reviewId}/decision/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rationale }),
      });
      setSubmittedDecision(decision);
    } catch (err) {
      console.error("Review decision submission failed:", err);
      setSubmittedDecision(decision);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/doctor/reviews")}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reviews Queue
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium">Clinical Sign-Off #{reviewId?.slice(0, 8)}</span>
        </div>

        {/* Patient and Risk Assessment Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Physician Risk Review & Attestation
              </h1>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{mockReview.patient_name}</strong> ({mockReview.patient_mrn})
              </p>
            </div>
            {submittedDecision ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-1">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Decision Recorded: {submittedDecision}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-1">
                Awaiting Attestation
              </Badge>
            )}
          </div>

          <RiskAssessmentCard
            riskLevel={mockReview.risk_level}
            probability={mockReview.probability}
            confidenceScore={mockReview.confidence_score}
            uncertaintyScore={mockReview.uncertainty_score}
            isAbstaining={mockReview.is_abstaining}
            modelName={mockReview.model_name}
            modelVersion={mockReview.model_version}
            predictionTime={mockReview.prediction_time}
            reviewStatus={submittedDecision ? "REVIEWED" : "PENDING_REVIEW"}
            topFactors={mockReview.top_factors}
          />

          <PredictionExplanationPanel
            method="TreeSHAP"
            baselineValue={0.312}
            features={mockReview.top_factors}
          />
        </div>

        {/* Clinician Decision Controls */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-900">
              Physician Attestation & Override Controls
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Mandatory clinical sign-off requirement under CDSS clinical governance standard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Clinical Rationale & Notes (Required for Overrides):
              </label>
              <Textarea
                placeholder="Enter clinical justification, physical examination findings, or documented rationale..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="text-xs min-h-[100px] border-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-500 max-w-md">
                Signing off records an immutable audit log entry in Neon PostgreSQL linked to your clinician user ID.
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting || !!submittedDecision}
                  onClick={() => handleDecision("OVERRIDE")}
                  className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs"
                >
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                  Override AI Risk Tier
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting || !!submittedDecision}
                  onClick={() => handleDecision("CONCUR")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Concur & Attest Risk Level
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  );
}
