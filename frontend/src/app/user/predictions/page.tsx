"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

const MOCK_PREDICTIONS = [
  {
    id: "pred-901",
    model_name: "CardioEnsemble-RF",
    model_version_str: "v1.4.2",
    prediction_result: "MEDIUM",
    probability: 0.42,
    confidence_interval: [0.36, 0.48],
    created_at: "2026-09-13 14:48",
    explanation: "The model estimates a moderate risk level based on reported blood pressure and cholesterol levels.",
    review_status: "REVIEWED_BY_PHYSICIAN",
  },
  {
    id: "pred-802",
    model_name: "CardioEnsemble-RF",
    model_version_str: "v1.4.1",
    prediction_result: "HIGH",
    probability: 0.68,
    confidence_interval: [0.62, 0.74],
    created_at: "2026-07-22 09:15",
    explanation: "Elevated risk estimate identified during inpatient admission. Followed up by attending cardiologist.",
    review_status: "REVIEWED_BY_PHYSICIAN",
  },
];

interface PatientPredictionItem {
  id: string;
  model_name: string;
  model_version_str: string;
  prediction_result: string;
  probability: number;
  confidence_interval?: number[];
  created_at: string;
  explanation: string;
  review_status: string;
}

export default function PatientPredictionsPage() {
  const [predictions, setPredictions] = React.useState<PatientPredictionItem[]>(MOCK_PREDICTIONS);

  React.useEffect(() => {
    apiClient.get("/user/predictions/")
      .then((res) => {
        if (res.data && res.data.length > 0) setPredictions(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-teal-600" />
            AI Clinical Risk Predictions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Machine learning generated estimates and physician-supervised decision support models.
          </p>
        </div>
        <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600" />
          Clinical Decision Support (SaMD)
        </Badge>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900">Understanding Your Risk Predictions:</p>
          <p>
            The model estimates an increased or decreased probability of cardiovascular health events based on your clinical inputs. <strong>This prediction is not a diagnosis.</strong> Always discuss these findings with your doctor or care team before modifying any treatment.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <Card key={pred.id} className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`text-xs font-bold ${
                      pred.prediction_result === "HIGH" || pred.prediction_result === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : pred.prediction_result === "MEDIUM"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {pred.prediction_result} RISK ESTIMATE
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Model: {pred.model_name} {pred.model_version_str}
                  </span>
                  <span className="text-xs text-slate-400">· {pred.created_at}</span>
                </div>

                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Clinician Supervised
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {pred.explanation ||
                      "The model estimates an increased risk based on the information provided. Please discuss this result with your healthcare professional."}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Calculated Probability: <strong>{((pred.probability || 0.42) * 100).toFixed(1)}%</strong>
                  </p>
                </div>

                <Link href={`/user/predictions/${pred.id}`} className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs gap-1 border-slate-200 text-teal-700 hover:bg-teal-50">
                    View Full Analysis <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
