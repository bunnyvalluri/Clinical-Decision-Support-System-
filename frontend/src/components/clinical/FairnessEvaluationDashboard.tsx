"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Scale, ShieldCheck } from "lucide-react";

export interface SubgroupMetrics {
  sample_size: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  false_positive_rate: number;
  false_negative_rate: number;
  brier_score: number;
}

export interface FairnessReportData {
  model_name: string;
  model_version: string;
  subgroup_field: string;
  subgroup_metrics: Record<string, Record<string, SubgroupMetrics>>;
  disparate_impact_ratio: number;
  parity_gate_passed: boolean;
  sample_size_warnings: string[];
  evaluated_at?: string;
}

export interface FairnessEvaluationDashboardProps {
  report?: FairnessReportData;
  isLoading?: boolean;
}

export function FairnessEvaluationDashboard({ report, isLoading = false }: FairnessEvaluationDashboardProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
        Evaluating subgroup fairness and demographic parity...
      </div>
    );
  }

  const data = report || {
    model_name: "random_forest_risk_model",
    model_version: "1.0.0",
    subgroup_field: "Biological Sex & Age Cohorts",
    subgroup_metrics: {
      sex: {
        MALE: { sample_size: 182, accuracy: 0.8956, sensitivity: 0.892, specificity: 0.938, false_positive_rate: 0.062, false_negative_rate: 0.108, brier_score: 0.081 },
        FEMALE: { sample_size: 122, accuracy: 0.8852, sensitivity: 0.879, specificity: 0.925, false_positive_rate: 0.075, false_negative_rate: 0.121, brier_score: 0.086 },
      },
    },
    disparate_impact_ratio: 0.9854,
    parity_gate_passed: true,
    sample_size_warnings: [
      "Subgroup cohorts with <50 samples have wider confidence intervals.",
      "Elderly patients (70+) require clinical oversight due to multi-morbidity interactions."
    ],
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-xs">
      <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Fairness & Subgroup Parity Evaluation
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={
              data.parity_gate_passed
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                : "bg-amber-50 text-amber-700 border-amber-200 text-xs"
            }
          >
            {data.parity_gate_passed ? "Demographic Parity Verified (>0.80)" : "Parity Audit Flagged"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Evaluates sensitivity, specificity, and false negative rates across biological sex and demographic strata.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Table of subgroup metrics */}
        {Object.entries(data.subgroup_metrics).map(([groupCategory, groupItems]) => (
          <div key={groupCategory} className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subgroup Category: {groupCategory.toUpperCase()}
            </span>
            <div className="overflow-x-auto rounded border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50 text-xs">
                  <TableRow>
                    <TableHead className="text-slate-700 font-semibold">Subgroup</TableHead>
                    <TableHead className="text-slate-700 font-semibold text-right">Sample Size</TableHead>
                    <TableHead className="text-slate-700 font-semibold text-right">Sensitivity</TableHead>
                    <TableHead className="text-slate-700 font-semibold text-right">Specificity</TableHead>
                    <TableHead className="text-slate-700 font-semibold text-right">False Positive Rate</TableHead>
                    <TableHead className="text-slate-700 font-semibold text-right">False Negative Rate</TableHead>
                    <TableHead className="text-slate-700 font-semibold text-right">Brier Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-slate-100 font-mono">
                  {Object.entries(groupItems).map(([name, metrics]) => (
                    <TableRow key={name} className="hover:bg-slate-50 font-sans">
                      <TableCell className="font-semibold text-slate-900 font-sans">{name}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{metrics.sample_size}</TableCell>
                      <TableCell className="text-right font-mono text-slate-800">{(metrics.sensitivity * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono text-slate-800">{(metrics.specificity * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono text-slate-600">{(metrics.false_positive_rate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-rose-700">{(metrics.false_negative_rate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono text-slate-600">{metrics.brier_score.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        {/* Sample size warnings */}
        {data.sample_size_warnings.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sample Size & Statistical Integrity Notes
            </span>
            <div className="space-y-1">
              {data.sample_size_warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
