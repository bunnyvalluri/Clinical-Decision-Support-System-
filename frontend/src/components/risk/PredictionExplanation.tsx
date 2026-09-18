import React from "react";
import { ArrowDownRight, ArrowUpRight, HelpCircle, Info } from "lucide-react";
import { ContributingFactor } from "@/services/risk/riskApi";

export interface PredictionExplanationProps {
  factors: ContributingFactor[];
  method?: string;
  baselineValue?: number | null;
  className?: string;
}

export const PredictionExplanation: React.FC<PredictionExplanationProps> = ({
  factors,
  method = "TreeSHAP",
  baselineValue,
  className = "",
}) => {
  if (!factors || factors.length === 0) {
    return (
      <div className={`p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs ${className}`}>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-600" />
          <span>Explanation unavailable for this prediction.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Explainable AI Attributions
          </span>
          <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            {method}
          </span>
        </div>
        {baselineValue !== null && baselineValue !== undefined && (
          <span className="text-[11px] text-slate-600 font-mono">
            Prior Log-Odds: {baselineValue.toFixed(3)}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-600">
        Top contributing biomarkers driving this patient&apos;s risk assessment. Red indicates features increasing predicted risk; green indicates protective features.
      </p>

      <div className="divide-y divide-slate-100">
        {factors.map((factor, idx) => {
          const name = factor.feature_name || factor.feature || `Feature #${idx + 1}`;
          const val = factor.value !== undefined && factor.value !== null ? String(factor.value) : "Observed";
          const contribution = factor.contribution !== undefined ? Number(factor.contribution) : 0;
          const isRiskIncreasing =
            factor.direction?.toLowerCase().includes("increase") ||
            factor.direction?.toLowerCase().includes("risk") ||
            contribution > 0;

          return (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-900">
                  <span>{name}</span>
                  <span className="text-slate-600 font-normal">({val})</span>
                </div>
                {factor.description && (
                  <p className="text-[11px] text-slate-600">{factor.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {contribution !== 0 && (
                  <span className="font-mono text-[11px] text-slate-600">
                    {contribution > 0 ? `+${contribution.toFixed(3)}` : contribution.toFixed(3)}
                  </span>
                )}
                {isRiskIncreasing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <ArrowUpRight className="w-3 h-3 text-rose-600" />
                    Increases Risk
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                    Protective
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
