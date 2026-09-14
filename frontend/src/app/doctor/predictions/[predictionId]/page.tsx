"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  HeartPulse,
  Info,
  Layers,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function PredictionDetailPage() {
  const { predictionId } = useParams<{ predictionId: string }>();
  const router = useRouter();
  const { predictions } = useClinicalStore();

  const pred = predictions.find((p) => String(p.id) === predictionId);

  if (!pred) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-4">
          <HeartPulse className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="text-slate-500">Prediction not found (ID: {predictionId})</p>
          <Button variant="outline" onClick={() => router.push("/doctor/predictions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Predictions
          </Button>
        </div>
      </div>
    );
  }

  const riskColor =
    pred.risk_level === "HIGH"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : pred.risk_level === "MEDIUM"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const features: Record<string, number> =
    (pred.feature_contributions as Record<string, number> | undefined) ||
    pred.shap_attributions?.reduce((acc: Record<string, number>, s) => {
      acc[s.feature] = s.attribution;
      return acc;
    }, {}) ||
    {};

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/doctor/predictions")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Predictions
        </Button>
      </div>

      {/* Header card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{pred.patient_name}</h1>
                  <p className="text-sm text-slate-500">
                    MRN: {pred.patient_mrn} · Age: {pred.age ?? pred.clinical_factors?.age ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <Badge className={`border text-sm px-3 py-1 ${riskColor}`}>
              {pred.risk_level} RISK
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Prediction Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Risk Probability</span>
              <span className="font-bold text-slate-900">{(pred.probability * 100).toFixed(2)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  pred.risk_level === "HIGH"
                    ? "bg-rose-500"
                    : pred.risk_level === "MEDIUM"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${pred.probability * 100}%` }}
              />
            </div>

            {pred.confidence_interval && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Confidence Interval (95%)</span>
                <span className="font-medium text-slate-700 text-sm">
                  {[
                    typeof pred.confidence_interval[0] === "number"
                      ? `${(pred.confidence_interval[0] * 100).toFixed(1)}%`
                      : "—",
                    typeof pred.confidence_interval[1] === "number"
                      ? `${(pred.confidence_interval[1] * 100).toFixed(1)}%`
                      : "—",
                  ].join(" – ")}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Model Version</span>
              <span className="font-medium text-slate-700 text-sm">{pred.model_version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Generated</span>
              <span className="font-medium text-slate-700 text-sm">
                {new Date(pred.created_at || pred.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Review Status</span>
              <Badge
                className={
                  pred.review_status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : pred.review_status === "REJECTED"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }
              >
                {pred.review_status || "PENDING"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Feature contributions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              Feature Contributions (SHAP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(features).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Feature contributions not available for this prediction.
              </p>
            ) : (
              Object.entries(features)
                .sort(([, a], [, b]) => Math.abs(Number(b)) - Math.abs(Number(a)))
                .slice(0, 8)
                .map(([feature, value]) => {
                  const numVal = Number(value);
                  const positive = numVal > 0;
                  const absVal = Math.abs(numVal);
                  const maxVal = 0.5;
                  const width = Math.min((absVal / maxVal) * 100, 100);
                  return (
                    <div key={feature} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium capitalize">
                          {feature.replace(/_/g, " ")}
                        </span>
                        <span className={positive ? "text-rose-600" : "text-emerald-600"}>
                          {positive ? "+" : ""}{numVal.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${positive ? "bg-rose-400" : "bg-emerald-400"}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 space-y-1">
          <p className="font-semibold">Clinical Decision Support — Not Autonomous Diagnosis</p>
          <p className="text-blue-600 text-xs">
            This AI-generated assessment is intended to support — not replace — clinical judgment.
            All predictions require physician review before clinical action.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/doctor/patients/${pred.patient_id}`)}
          className="gap-2"
        >
          View Patient Record
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <MessageSquare className="h-4 w-4" />
          Add Clinical Review
        </Button>
      </div>
    </div>
  );
}
