"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

export interface FeatureDriftScore {
  psi: number;
  ks_pvalue: number;
  drift_detected: boolean;
}

export interface DriftReportData {
  model_name: string;
  model_version: string;
  status: "NORMAL" | "WARNING" | "CRITICAL" | string;
  feature_drift_scores: Record<string, FeatureDriftScore>;
  prediction_drift_score: number;
  features_drifted: string[];
  summary: string;
  evaluated_at?: string;
}

export interface ModelDriftDashboardProps {
  report?: DriftReportData;
  isLoading?: boolean;
}

export function ModelDriftDashboard({ report, isLoading = false }: ModelDriftDashboardProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
        Analyzing distribution stability and feature drift...
      </div>
    );
  }

  const data = report || {
    model_name: "random_forest_risk_model",
    model_version: "1.0.0",
    status: "NORMAL",
    feature_drift_scores: {
      systolic_bp: { psi: 0.042, ks_pvalue: 0.38, drift_detected: false },
      heart_rate: { psi: 0.038, ks_pvalue: 0.42, drift_detected: false },
      glucose_level: { psi: 0.112, ks_pvalue: 0.04, drift_detected: true },
      oxygen_saturation: { psi: 0.085, ks_pvalue: 0.12, drift_detected: false },
    },
    prediction_drift_score: 0.045,
    features_drifted: ["glucose_level"],
    summary: "All features within acceptable population stability parameters (PSI < 0.25).",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Critical Drift</Badge>;
      case "WARNING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Moderate Shift</Badge>;
      default:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Normal / In-Distribution</Badge>;
    }
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-xs">
      <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Model & Population Drift Monitoring
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{data.model_name} v{data.model_version}</span>
            {getStatusBadge(data.status)}
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Kolmogorov-Smirnov and Population Stability Index (PSI) tracking against training baseline.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Drift metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="text-slate-500 block">Prediction Drift (PSI)</span>
            <span className="text-base font-bold font-mono text-slate-800">{data.prediction_drift_score.toFixed(3)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="text-slate-500 block">Features Shifted</span>
            <span className="text-base font-bold font-mono text-slate-800">{data.features_drifted.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="text-slate-500 block">Warning Threshold</span>
            <span className="text-base font-bold font-mono text-slate-800">PSI &gt; 0.10</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="text-slate-500 block">Critical Threshold</span>
            <span className="text-base font-bold font-mono text-slate-800">PSI &gt; 0.25</span>
          </div>
        </div>

        {/* Feature scores list */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Feature-Level Population Stability
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.entries(data.feature_drift_scores).map(([feat, score]) => (
              <div key={feat} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-medium text-slate-800">{feat}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500">PSI: {score.psi.toFixed(3)}</span>
                  {score.drift_detected ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                      Shifted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      Stable
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary note */}
        <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
          <strong className="text-slate-800 font-semibold">Audit Summary: </strong>
          {data.summary}
        </div>
      </CardContent>
    </Card>
  );
}
