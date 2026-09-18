"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  HeartPulse,
  HelpCircle,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

interface PatientPrediction {
  id: string;
  prediction_result: string;
  probability: number | string;
  model_name: string;
  model_version_str: string;
  prediction_timestamp: string;
  is_abstaining?: boolean;
  ood_status?: string;
  uncertainty_score?: number | string;
  cdss_guidance?: {
    risk_level: string;
    suggested_clinical_review: string;
    clinical_summary: string;
    safety_disclaimer: string;
  };
}

export default function UserRiskCenterPage() {
  const [predictions, setPredictions] = React.useState<PatientPrediction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRiskData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/predictions/");
      const items = res.data?.results || res.data?.data || res.data || [];
      setPredictions(Array.isArray(items) ? items : []);
    } catch (err: unknown) {
      console.warn("Could not fetch user predictions:", err);
      setError("Unable to load real-time risk profile. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRiskData();
  }, [fetchRiskData]);

  const latest = predictions.length > 0 ? predictions[0] : null;
  const riskLevel = latest?.prediction_result || "LOW";

  const getRiskStyle = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          badge: "bg-red-100 text-red-800 border-red-200",
          desc: "Critical risk tier detected. Clinician urgent review required.",
        };
      case "HIGH":
        return {
          bg: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-700",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          desc: "Elevated risk tier identified. Scheduled medical follow-up recommended.",
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          desc: "Moderate physiological variation noted. Continue routine vital monitoring.",
        };
      default:
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          desc: "Stable baseline parameters. Maintain prescribed wellness plan.",
        };
    }
  };

  const style = getRiskStyle(riskLevel);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personal Health Risk Center</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Clinical Decision Support
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Physician-reviewed risk assessments and longitudinal wellness tracking.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRiskData}
            disabled={isLoading}
            className="gap-1.5 text-xs self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {/* Clinical Safety Disclaimer Alert */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-slate-700 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-blue-900">Healthcare AI Safety Notice</p>
            <p className="text-slate-600">
              Risk scores and automated assessments provide advisory clinical decision support only. HealthNova AI does
              NOT issue autonomous medical diagnoses or prescribe medications. All clinical findings must be verified
              by your licensed physician.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-12 text-center text-xs text-slate-500">
              Loading current clinical risk status...
            </CardContent>
          </Card>
        ) : !latest ? (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-16 text-center">
              <HeartPulse className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold text-base">No clinical events available.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No risk predictions or diagnostic vitals have been recorded for your profile yet.
              </p>
              <Link href="/user/medical-records">
                <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs">
                  View Health Records
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Primary Status Card */}
            <Card className={`border ${style.border} ${style.bg}`}>
              <CardHeader className="p-5 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <CardDescription className="text-xs font-medium text-slate-600">
                      Current Assessed Risk Status
                    </CardDescription>
                    <CardTitle className={`text-2xl font-black ${style.text}`}>
                      {riskLevel} RISK TIER
                    </CardTitle>
                  </div>
                  <Badge className={style.badge}>{riskLevel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <p className="text-xs text-slate-700">{style.desc}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500">Probability Score</p>
                    <p className="text-base font-bold text-slate-900">
                      {(Number(latest.probability) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500">Model Pipeline</p>
                    <p className="text-base font-bold text-slate-900 truncate">
                      {latest.model_name || "Random Forest"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500">Model Version</p>
                    <p className="text-base font-bold text-slate-900 font-mono text-xs mt-1">
                      {latest.model_version_str || "v1.0.0"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500">Assessed Timestamp</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {new Date(latest.prediction_timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historical Risk Trajectory */}
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="p-5 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Longitudinal Risk History
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Chronological record of risk predictions generated during clinical encounters.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 divide-y divide-slate-100">
                {predictions.map((p, idx) => (
                  <div key={p.id || idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Assessment #{predictions.length - idx}</span>
                        <Badge variant="outline" className={`text-[10px] ${getRiskStyle(p.prediction_result).badge}`}>
                          {p.prediction_result}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Score: {(Number(p.probability) * 100).toFixed(1)}% · Model: {p.model_name || "RF"} ({p.model_version_str || "v1.0"})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">
                        {new Date(p.prediction_timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
  );
}

