import React from "react";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

export interface PredictionConfidenceProps {
  confidence: number; // 0.0 - 1.0
  probability: number; // 0.0 - 1.0
  confidenceLevel?: "HIGH" | "MODERATE" | "LOW" | string;
  latencyMs?: number;
  isAbstaining?: boolean;
}

export const PredictionConfidence: React.FC<PredictionConfidenceProps> = ({
  confidence,
  probability,
  confidenceLevel = "HIGH",
  latencyMs,
  isAbstaining = false,
}) => {
  const percentage = Math.round(confidence * 100);
  const probPercentage = Math.round(probability * 100);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Model Confidence & Probability
        </span>
        <div className="flex items-center gap-1.5">
          {isAbstaining ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Abstained
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {confidenceLevel} Confidence
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-slate-800">
          <span>Posterior Probability</span>
          <span className="font-mono">{probPercentage}%</span>
        </div>
        <Progress value={probPercentage} className="h-2 bg-slate-200" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-600" />
          Latency: <strong className="text-slate-800 font-mono">{latencyMs ? `${latencyMs}ms` : "< 15ms"}</strong>
        </span>
        <span>
          Confidence Score: <strong className="text-slate-800 font-mono">{confidence.toFixed(4)}</strong>
        </span>
      </div>
    </div>
  );
};
