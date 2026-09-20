import React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { ModelEvaluationBenchmark, RiskModel } from "@/services/risk/riskApi";

export interface ModelComparisonTableProps {
  models: RiskModel[];
  evaluations?: ModelEvaluationBenchmark[];
}

export const ModelComparisonTable: React.FC<ModelComparisonTableProps> = ({
  models,
  evaluations = [],
}) => {
  if (!models || models.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg text-center">
        No registered clinical risk models found.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Clinical Machine Learning Model Registry & Benchmarks
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Real metrics calculated from the held-out validation cohort (EHR Inpatient Multi-Center Cohort).
          </p>
        </div>
        <span className="text-xs text-slate-600 font-medium">
          Source: <strong className="text-slate-800">Neon PostgreSQL Model Registry</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="text-xs font-semibold text-slate-700">Model Architecture</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Accuracy</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Precision (Macro)</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Recall (Macro)</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">F1 Score</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">ROC-AUC</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Preprocessing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => {
              const isChampion = model.model_name === "random_forest_risk_model" || model.status === "ACTIVE" || model.status === "PRODUCTION";
              const accStr = model.accuracy !== null && model.accuracy !== undefined ? `${(model.accuracy * 100).toFixed(1)}%` : "N/A";
              const precStr = model.precision !== null && model.precision !== undefined ? `${(model.precision * 100).toFixed(1)}%` : "N/A";
              const recStr = model.recall !== null && model.recall !== undefined ? `${(model.recall * 100).toFixed(1)}%` : "N/A";
              const f1Str = model.f1_score !== null && model.f1_score !== undefined ? `${(model.f1_score * 100).toFixed(1)}%` : "N/A";
              const aucStr = model.roc_auc !== null && model.roc_auc !== undefined ? model.roc_auc.toFixed(3) : "N/A";

              return (
                <TableRow key={model.id} className={isChampion ? "bg-sky-50/30 hover:bg-sky-50/50" : "hover:bg-slate-50/50"}>
                  <TableCell className="text-xs">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {isChampion && <Zap className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      <span>{model.algorithm || model.model_name}</span>
                      <span className="text-slate-600 font-normal">v{model.version}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5 truncate max-w-[200px]" title={model.checksum}>
                      SHA-256: {model.checksum ? model.checksum.slice(0, 16) : "N/A"}...
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    {isChampion ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {model.status}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs font-mono font-medium text-slate-900">{accStr}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-700">{precStr}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-700">{recStr}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-700">{f1Str}</TableCell>
                  <TableCell className="text-xs font-mono font-medium text-slate-900">{aucStr}</TableCell>
                  <TableCell className="text-xs text-slate-600">{model.preprocessing_version || "v1.0"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
