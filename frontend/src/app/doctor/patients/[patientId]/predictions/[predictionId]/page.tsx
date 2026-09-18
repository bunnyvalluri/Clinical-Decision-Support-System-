"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { RiskResultCard } from "@/components/risk/RiskResultCard";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { RiskLevel, RiskPrediction, riskApi } from "@/services/risk/riskApi";

export default function DoctorPredictionDetailPage() {
  const { patientId, predictionId } = useParams<{ patientId: string; predictionId: string }>();
  const router = useRouter();

  const [prediction, setPrediction] = React.useState<RiskPrediction | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadPrediction = React.useCallback(async () => {
    if (!predictionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await riskApi.getPrediction(predictionId);
      setPrediction(data);
    } catch (err: any) {
      console.error("Failed to load prediction detail:", err);
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to load prediction detail from database."
      );
    } finally {
      setIsLoading(false);
    }
  }, [predictionId]);

  React.useEffect(() => {
    loadPrediction();
  }, [loadPrediction]);

  const handleRecordReview = async (predId: string, override: RiskLevel, rationale: string) => {
    const updated = await riskApi.recordReview(predId, {
      clinician_override: override,
      override_reason: rationale,
    });
    setPrediction(updated);
  };

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/doctor/patients/${patientId}/predictions`)}
              className="gap-1 text-xs text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Patient Risk History
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">
              Prediction #{predictionId ? predictionId.slice(0, 8) : ""}
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

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center rounded-xl border border-slate-200 bg-white">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading clinical decision support details...</p>
          </div>
        ) : prediction ? (
          <RiskResultCard
            prediction={prediction}
            patientName={`Patient MRN: ${prediction.patient_mrn || patientId}`}
            onRecordReview={handleRecordReview}
          />
        ) : (
          <div className="p-8 text-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
            Prediction record not found.
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
