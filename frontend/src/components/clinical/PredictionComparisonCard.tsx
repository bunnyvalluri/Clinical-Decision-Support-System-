"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileText,
  HelpCircle,
  MessageSquarePlus,
  Minus,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FeatureDifference,
  PredictionComparisonResult,
  RiskLevel,
} from "@/services/risk/riskApi";

interface PredictionComparisonCardProps {
  comparison: PredictionComparisonResult;
  onReviewClick?: (predictionId: string) => void;
  onFeedbackClick?: (predictionId: string) => void;
  onRefresh?: () => void;
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; badgeClass: string; borderClass: string; bgClass: string; textClass: string }
> = {
  LOW: {
    label: "Low Risk",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "border-emerald-200",
    bgClass: "bg-emerald-50/50",
    textClass: "text-emerald-700",
  },
  MEDIUM: {
    label: "Medium Risk",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    borderClass: "border-amber-200",
    bgClass: "bg-amber-50/50",
    textClass: "text-amber-700",
  },
  HIGH: {
    label: "High Risk",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    borderClass: "border-rose-200",
    bgClass: "bg-rose-50/50",
    textClass: "text-rose-700",
  },
  CRITICAL: {
    label: "Critical Risk",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    borderClass: "border-purple-200",
    bgClass: "bg-purple-50/50",
    textClass: "text-purple-700",
  },
};

export function PredictionComparisonCard({
  comparison,
  onReviewClick,
  onFeedbackClick,
  onRefresh,
}: PredictionComparisonCardProps) {
  const {
    is_initial_prediction,
    patient_mrn,
    risk_changed,
    transition_direction,
    risk_transition,
    time_between_formatted,
    current_prediction,
    previous_prediction,
    model_version_changed,
    feature_changes,
    feature_changes_count,
    shap_divergence,
    alerts_generated,
  } = comparison;

  const currentRisk = current_prediction.clinician_override || current_prediction.risk_level;
  const currentRiskCfg = RISK_CONFIG[currentRisk] || RISK_CONFIG.LOW;

  const prevRisk = previous_prediction
    ? previous_prediction.clinician_override || previous_prediction.risk_level
    : null;
  const prevRiskCfg = prevRisk ? RISK_CONFIG[prevRisk] : null;

  return (
    <Card className="border border-slate-200 bg-white shadow-xs">
      {/* Header */}
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-700" />
              <CardTitle className="text-lg font-bold text-slate-900">
                Current vs. Previous Risk Prediction Comparison
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Patient MRN: <strong className="text-slate-800 font-mono">{patient_mrn}</strong> —
              Authoritative Source: <strong className="text-slate-800">Neon PostgreSQL</strong>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="h-8 gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                Refresh
              </Button>
            )}
            {onFeedbackClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFeedbackClick(current_prediction.id)}
                className="h-8 gap-1.5 text-xs border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                <MessageSquarePlus className="h-3.5 w-3.5 text-sky-600" />
                Feedback
              </Button>
            )}
            {onReviewClick && (
              <Button
                size="sm"
                onClick={() => onReviewClick(current_prediction.id)}
                className="h-8 gap-1.5 text-xs bg-sky-700 hover:bg-sky-800 text-white"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Record Review
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Transition Summary Banner */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {transition_direction === "ESCALATION" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              ) : transition_direction === "DE_ESCALATION" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingDown className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Minus className="h-5 w-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Risk Trajectory Transition:
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-semibold text-xs ${
                      transition_direction === "ESCALATION"
                        ? "border-rose-300 bg-rose-50 text-rose-800"
                        : transition_direction === "DE_ESCALATION"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-white text-slate-800"
                    }`}
                  >
                    {risk_transition}
                  </Badge>
                  {transition_direction === "ESCALATION" && (
                    <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      Risk Escalated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Elapsed: <strong>{time_between_formatted}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Validated Input Changes: <strong>{feature_changes_count}</strong>
                  </span>
                </div>
              </div>
            </div>

            {alerts_generated && alerts_generated.length > 0 && (
              <Badge className="bg-rose-600 text-white font-semibold gap-1 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                Clinical Escalation Alert Active
              </Badge>
            )}
          </div>
        </div>

        {/* Side-by-Side Cards: Previous vs Current */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Previous Prediction */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Previous Assessment
              </span>
              {previous_prediction && (
                <span className="text-xs text-slate-500">
                  {new Date(previous_prediction.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            {previous_prediction && prevRiskCfg ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className={`text-sm px-2.5 py-1 ${prevRiskCfg.badgeClass}`}>
                      {prevRiskCfg.label}
                    </Badge>
                    {previous_prediction.clinician_override && (
                      <span className="block text-[11px] text-amber-700 font-medium mt-1">
                        Physician Override: {previous_prediction.clinician_override}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {(previous_prediction.probability * 100).toFixed(1)}%
                    </span>
                    <span className="block text-[10px] text-slate-500">Predicted Risk</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model:</span>
                    <span className="font-medium text-slate-800">
                      {previous_prediction.model_name} (v{previous_prediction.model_version})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Review Status:</span>
                    <span className="font-medium text-slate-800">
                      {previous_prediction.review_status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No previous prediction recorded. This assessment serves as initial patient baseline.
              </div>
            )}
          </div>

          {/* Current Prediction */}
          <div className="rounded-lg border-2 border-sky-300 bg-sky-50/20 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-600 animate-pulse" />
                Current Authoritative Prediction
              </span>
              <span className="text-xs text-slate-500">
                {new Date(current_prediction.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className={`text-sm px-2.5 py-1 ${currentRiskCfg.badgeClass}`}>
                    {currentRiskCfg.label}
                  </Badge>
                  {current_prediction.clinician_override && (
                    <span className="block text-[11px] text-amber-700 font-medium mt-1">
                      Physician Override: {current_prediction.clinician_override}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    {(current_prediction.probability * 100).toFixed(1)}%
                  </span>
                  <span className="block text-[10px] text-slate-500">Predicted Risk</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-sky-100 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Model & Version:</span>
                  <span className="font-medium text-slate-800">
                    {current_prediction.model_name} (v{current_prediction.model_version})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Review Status:</span>
                  <span className="font-medium text-slate-800">
                    {current_prediction.review_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Version Change Alert */}
        {model_version_changed && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Cpu className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Model Lineage Note:</strong> The current prediction was produced by a different model version than the prior assessment. Inferences reflect updated model coefficients and feature schema versions.
            </div>
          </div>
        )}

        {/* Validated Input Feature Changes Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Validated Clinical Input Changes ({feature_changes.length})
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              Comparing immutable feature snapshots
            </span>
          </div>

          {feature_changes.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-500">
              No input feature changes detected between assessment intervals.
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50 text-[11px] text-slate-700">
                  <TableRow>
                    <TableHead className="font-bold">Clinical Parameter</TableHead>
                    <TableHead className="font-bold">Previous Value</TableHead>
                    <TableHead className="font-bold">Current Value</TableHead>
                    <TableHead className="font-bold">Delta</TableHead>
                    <TableHead className="font-bold">Trend</TableHead>
                    <TableHead className="font-bold">Clinical Significance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-slate-100">
                  {feature_changes.map((fc: FeatureDifference) => (
                    <TableRow key={fc.feature} className="hover:bg-slate-50/60">
                      <TableCell className="font-medium text-slate-900">
                        {fc.display_name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {fc.previous_value !== null ? `${fc.previous_value} ${fc.unit}` : "--"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {fc.current_value !== null ? `${fc.current_value} ${fc.unit}` : "--"}
                      </TableCell>
                      <TableCell>
                        {fc.delta !== null ? (
                          <span
                            className={`font-mono font-semibold ${
                              fc.delta > 0
                                ? "text-rose-700"
                                : fc.delta < 0
                                ? "text-emerald-700"
                                : "text-slate-600"
                            }`}
                          >
                            {fc.delta > 0 ? `+${fc.delta}` : fc.delta} {fc.unit}
                            {fc.percentage_change !== null && (
                              <span className="text-[10px] text-slate-400 ml-1">
                                ({fc.percentage_change > 0 ? `+${fc.percentage_change}` : fc.percentage_change}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {fc.direction === "INCREASED" ? (
                          <span className="inline-flex items-center text-rose-700 font-medium gap-0.5">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Increased
                          </span>
                        ) : fc.direction === "DECREASED" ? (
                          <span className="inline-flex items-center text-emerald-700 font-medium gap-0.5">
                            <ArrowDownRight className="h-3.5 w-3.5" />
                            Decreased
                          </span>
                        ) : (
                          <span className="text-slate-400">Unchanged</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {fc.is_significant ? (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px]">
                            Significant Shift
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal Range</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* TreeSHAP Factor Divergence */}
        {shap_divergence.available && shap_divergence.shifted_factors?.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  TreeSHAP Model Factor Weight Shifts
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Mathematical contribution changes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shap_divergence.shifted_factors.map((factor) => (
                <div
                  key={factor.feature}
                  className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{factor.display_name}</span>
                    <span
                      className={`font-mono font-bold ${
                        factor.shap_shift > 0 ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {factor.shap_shift > 0 ? `+${factor.shap_shift}` : factor.shap_shift}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Prior SHAP: {factor.previous_shap}</span>
                    <span>Current SHAP: {factor.current_shap}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-Causation Medical Disclaimer */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            Clinical Decision Support System (SaMD) Notice
          </div>
          <p>
            Machine learning risk predictions and TreeSHAP attribution shifts reflect statistical model associations derived from validated patient inputs. Predictions do NOT constitute an autonomous diagnosis, prescription, or clinical order. All clinical treatment decisions require independent evaluation by a qualified medical professional.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
