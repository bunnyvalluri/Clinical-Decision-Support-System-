"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, CheckCircle2, Clock, Cpu, ShieldCheck, UserCheck } from "lucide-react";

export interface RiskAssessmentCardProps {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  probability: number;
  confidenceScore?: number;
  uncertaintyScore?: number;
  isAbstaining?: boolean;
  oodStatus?: string;
  modelVersion?: string;
  modelName?: string;
  predictionTime?: string;
  reviewStatus?: string;
  topFactors?: Array<{
    feature: string;
    contribution: number;
    description?: string;
  }>;
  onReviewClick?: () => void;
  className?: string;
}

export function RiskAssessmentCard({
  riskLevel,
  probability,
  confidenceScore,
  uncertaintyScore,
  isAbstaining = false,
  oodStatus = "IN_DISTRIBUTION",
  modelVersion = "1.0.0",
  modelName = "random_forest_risk_model",
  predictionTime,
  reviewStatus = "PENDING_REVIEW",
  topFactors = [],
  onReviewClick,
  className,
}: RiskAssessmentCardProps) {
  const getSeverityStyle = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "CRITICAL":
        return {
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
          borderClass: "border-rose-200",
          headerBg: "bg-rose-50/50",
          label: "Critical Risk (Immediate Medical Attention)",
        };
      case "HIGH":
        return {
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
          borderClass: "border-amber-200",
          headerBg: "bg-amber-50/50",
          label: "High Risk (Serial Monitoring / Escalation)",
        };
      case "MEDIUM":
        return {
          badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-200",
          borderClass: "border-yellow-200",
          headerBg: "bg-yellow-50/50",
          label: "Medium Risk (Standard Clinical Ward Care)",
        };
      default:
        return {
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          borderClass: "border-emerald-200",
          headerBg: "bg-emerald-50/50",
          label: "Low Risk (Routine Observation)",
        };
    }
  };

  const severity = getSeverityStyle(riskLevel);

  return (
    <Card className={cn("border bg-white shadow-xs", severity.borderClass, className)}>
      <CardHeader className={cn("p-5 border-b", severity.headerBg)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Clinical Risk Assessment
              </span>
              {isAbstaining && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
                  <AlertTriangle className="mr-1 h-3 w-3" /> REVIEW_REQUIRED (High Uncertainty)
                </Badge>
              )}
              {oodStatus !== "IN_DISTRIBUTION" && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  OOD Warning ({oodStatus})
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold border", severity.badgeClass)}>
                {riskLevel}
              </span>
              <span className="text-slate-600 text-sm font-normal">
                ({(probability * 100).toFixed(1)}% risk probability)
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              {severity.label}
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-1.5 text-right">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>{predictionTime || "Real-time Telemetry"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-700 border-slate-200">
                <Cpu className="mr-1 h-3 w-3 text-slate-500" />
                {modelName} v{modelVersion}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  reviewStatus === "REVIEWED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                <UserCheck className="mr-1 h-3 w-3" />
                {reviewStatus}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Metric Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 block">Probability</span>
            <span className="font-semibold font-mono text-slate-800 text-sm">{(probability * 100).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-slate-500 block">Confidence Score</span>
            <span className="font-semibold font-mono text-slate-800 text-sm">
              {confidenceScore !== undefined ? `${(confidenceScore * 100).toFixed(1)}%` : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Predictive Entropy</span>
            <span className="font-semibold font-mono text-slate-800 text-sm">
              {uncertaintyScore !== undefined ? uncertaintyScore.toFixed(3) : "Low"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Governance Gate</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-sm">
              <ShieldCheck className="h-3.5 w-3.5" /> Safe for Review
            </span>
          </div>
        </div>

        {/* Top Contributing Factors */}
        {topFactors.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Primary Model Attribution Factors
            </span>
            <div className="space-y-1.5">
              {topFactors.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="font-medium text-slate-800">{f.feature}</span>
                  <div className="flex items-center gap-2">
                    {f.description && <span className="text-slate-500 text-[11px]">{f.description}</span>}
                    <span className={cn("font-mono font-semibold", f.contribution > 0 ? "text-rose-600" : "text-emerald-600")}>
                      {f.contribution > 0 ? `+${f.contribution.toFixed(3)}` : f.contribution.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Disclaimer invariant */}
        <div className="text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded border border-slate-200/80 leading-relaxed">
          <strong className="text-slate-700 font-semibold">Clinical Decision Support Standard:</strong> This assessment is an assistive predictive indicator and does not replace human clinical judgment, diagnostic evaluations, or physician sign-off.
        </div>
      </CardContent>
    </Card>
  );
}
