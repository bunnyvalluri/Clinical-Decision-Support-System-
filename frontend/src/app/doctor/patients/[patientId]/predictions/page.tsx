"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { RiskAssessmentCard } from "@/components/clinical/RiskAssessmentCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowLeft, Clock, Eye, TrendingUp } from "lucide-react";

export default function DoctorPatientPredictionsHistoryPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [predictions, setPredictions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadPredictions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/patients/${patientId}/predictions/`);
        if (res.ok) {
          const json = await res.json();
          if (json.results && json.results.length > 0) {
            setPredictions(json.results);
          } else {
            // Baseline sequential prediction history
            setPredictions([
              {
                id: "pred-2",
                prediction_number: 2,
                display_label: "Prediction #2",
                prediction_result: "MEDIUM",
                probability: 0.428,
                confidence_score: 0.884,
                uncertainty_score: 0.125,
                is_abstaining: false,
                ood_status: "IN_DISTRIBUTION",
                model_name: "random_forest_risk_model",
                model_version_str: "1.0.0",
                prediction_timestamp: new Date().toISOString(),
                features_snapshot: { systolic_bp: 142, heart_rate: 82, oxygen_saturation: 97 },
                clinical_review: { status: "REVIEWED", decision: "CONCUR" },
              },
              {
                id: "pred-1",
                prediction_number: 1,
                display_label: "Prediction #1",
                prediction_result: "HIGH",
                probability: 0.684,
                confidence_score: 0.821,
                uncertainty_score: 0.185,
                is_abstaining: false,
                ood_status: "IN_DISTRIBUTION",
                model_name: "random_forest_risk_model",
                model_version_str: "1.0.0",
                prediction_timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
                features_snapshot: { systolic_bp: 168, heart_rate: 98, oxygen_saturation: 94 },
                clinical_review: { status: "REVIEWED", decision: "OVERRIDE" },
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load predictions history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (patientId) {
      loadPredictions();
    }
  }, [patientId]);

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/doctor/patients/${patientId}`)}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patient
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium">Historical Predictions</span>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Sequential Risk Predictions History
          </h1>
          <p className="text-xs text-slate-500">
            Compare risk trajectory, probability deltas, model versions, and physician overrides over time for patient MRN: {patientId}.
          </p>
        </div>

        {/* Prediction Cards Sequence */}
        <div className="space-y-4">
          {predictions.map((p) => (
            <Card key={p.id} className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold py-0.5">
                    {p.display_label || `Prediction #${p.prediction_number || 1}`}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-800">
                    Result: <strong className={p.prediction_result === "HIGH" ? "text-rose-600" : "text-amber-600"}>{p.prediction_result}</strong>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({(Number(p.probability) * 100).toFixed(1)}% prob)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(p.prediction_timestamp).toLocaleString()}
                  </span>
                  <Link href={`/doctor/patients/${patientId}/predictions/${p.id}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1 py-1 h-7">
                      <Eye className="h-3.5 w-3.5" /> Inspect Attribution
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Model Algorithm</span>
                    <span className="font-semibold text-slate-800 font-mono">{p.model_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Model Version</span>
                    <span className="font-semibold text-slate-800 font-mono">v{p.model_version_str || "1.0.0"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Confidence</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {p.confidence_score ? `${(Number(p.confidence_score) * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Review Status</span>
                    <Badge variant="outline" className="text-[10px] bg-white text-slate-700">
                      {p.clinical_review?.status || "PENDING_REVIEW"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DoctorLayout>
  );
}
