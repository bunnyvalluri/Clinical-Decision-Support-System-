"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export interface ModelBenchmarkItem {
  model_id: string;
  model_name: string;
  algorithm: string;
  version: string;
  status: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  sensitivity: number;
  specificity: number;
  brier_score?: number;
  calibration_status: string;
  evaluation_version: string;
  dataset_identifier?: string;
  is_active?: boolean;
}

export interface ModelComparisonTableProps {
  models: ModelBenchmarkItem[];
  isLoading?: boolean;
}

export function ModelComparisonTable({ models, isLoading = false }: ModelComparisonTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
        Loading comparative model evaluation benchmarks...
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
        No active model evaluations found. Execute the training & evaluation pipeline to generate verified benchmarks.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow>
            <TableHead className="text-xs font-semibold text-slate-700">Model / Architecture</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Accuracy</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Precision</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Recall</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">F1-Score</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">ROC-AUC</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">PR-AUC</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Sensitivity</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Specificity</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-center">Calibration</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-center">Eval Version</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100 text-xs font-medium">
          {models.map((m) => {
            const isChampion = m.status === "PRODUCTION" || m.is_active;
            return (
              <TableRow key={m.model_id} className={isChampion ? "bg-blue-50/20 hover:bg-blue-50/40" : "hover:bg-slate-50"}>
                <TableCell className="font-semibold text-slate-900">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      {m.algorithm}
                      {isChampion && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                          Champion
                        </Badge>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{m.model_name} v{m.version}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-slate-800">{(m.accuracy * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono text-slate-800">{(m.precision * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono text-slate-800">{(m.recall * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono font-semibold text-slate-900">{(m.f1_score * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono text-blue-700 font-semibold">{m.roc_auc.toFixed(3)}</TableCell>
                <TableCell className="text-right font-mono text-slate-800">{m.pr_auc.toFixed(3)}</TableCell>
                <TableCell className="text-right font-mono text-slate-800">{(m.sensitivity * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono text-slate-800">{(m.specificity * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-center font-mono text-[11px] text-slate-600">
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                    {m.calibration_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono text-[11px] text-slate-500">
                  {m.evaluation_version}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
