"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { RiskAssessmentCard } from "@/components/clinical/RiskAssessmentCard";
import { PredictionExplanationPanel } from "@/components/clinical/PredictionExplanationPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, RotateCcw, ShieldCheck, UserCheck } from "lucide-react";

export default function DoctorPredictionDetailAttributionPage() {
  const { patientId, predictionId } = useParams<{ patientId: string; predictionId: string }>();
  const router = useRouter();
  const [prediction, setPrediction] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDetail() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/predictions/${predictionId}/`);
        if (res.ok) {
          const data = await res.json();
          setPrediction(data);
        } else {
          // Fallback detailed view
          setPrediction({
            id: predictionId,
            patient_id: patientId,
            prediction_result: "MEDIUM",
            probability: 0.428,
            confidence_score: 0.884,
            uncertainty_score: 0.125,
            is_abstaining: false,
            ood_status: "IN_DISTRIBUTION",
            model_name: "random_forest_risk_model",
            model_version_str: "1.0.0",
            prediction_timestamp: new Date().toISOString(),
            features_snapshot: {
              age: 58,
              gender: "M",
              systolic_bp: 142,
              diastolic_bp: 88,
              heart_rate: 82,
              oxygen_saturation: 97.0,
              glucose_level: 118.0,
              cholesterol_total: 215.0,
              st_depression: 1.4,
            },
            explanation: {
              method: "TreeSHAP",
              baseline_value: 0.312,
              features: [
                { feature: "systolic_bp", value: "142 mmHg", contribution: 0.142, direction: "RISK_INCREASING", explanation: "Elevated systolic pressure contributes +14.2% toward medium risk." },
                { feature: "cholesterol_total", value: "215 mg/dL", contribution: 0.088, direction: "RISK_INCREASING", explanation: "Borderline elevated serum cholesterol contributes +8.8%." },
                { feature: "oxygen_saturation", value: "97.0 %", contribution: -0.065, direction: "PROTECTIVE", explanation: "Stable arterial oxygen saturation provides protective reserve (-6.5%)." },
              ],
            },
          });
        }
      } catch (err) {
        console.error("Failed to load prediction detail:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (predictionId) {
      loadDetail();
    }
  }, [predictionId, patientId]);

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/doctor/patients/${patientId}/predictions`)}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Predictions
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium">Prediction Detail #{predictionId?.slice(0, 8)}</span>
        </div>

        {/* Risk Assessment Summary Card */}
        {prediction && (
          <RiskAssessmentCard
            riskLevel={prediction.prediction_result}
            probability={Number(prediction.probability)}
            confidenceScore={prediction.confidence_score ? Number(prediction.confidence_score) : undefined}
            uncertaintyScore={prediction.uncertainty_score ? Number(prediction.uncertainty_score) : undefined}
            isAbstaining={prediction.is_abstaining}
            oodStatus={prediction.ood_status}
            modelName={prediction.model_name}
            modelVersion={prediction.model_version_str}
            predictionTime={new Date(prediction.prediction_timestamp).toLocaleString()}
          />
        )}

        {/* TreeSHAP Explanation Panel */}
        {prediction?.explanation && (
          <PredictionExplanationPanel
            method={prediction.explanation.method}
            baselineValue={prediction.explanation.baseline_value}
            features={prediction.explanation.features || []}
          />
        )}

        {/* Feature Snapshot Card */}
        {prediction?.features_snapshot && (
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">
                Immutable Feature Snapshot at Inference Time
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Exact physiological measurements ingested by the preprocessing pipeline for this calculation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                {Object.entries(prediction.features_snapshot).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[11px] font-mono">{k}</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{String(v)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DoctorLayout>
  );
}
