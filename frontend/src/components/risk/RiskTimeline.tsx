import React from "react";
import { RiskLevelBadge } from "./RiskLevelBadge";
import { Clock, ShieldAlert } from "lucide-react";
import { RiskLevel } from "@/services/risk/riskApi";

export interface RiskTimelineItem {
  prediction_id: string;
  timestamp: string;
  risk_level: RiskLevel;
  probability: number;
  model_name: string;
  is_abstaining?: boolean;
  clinician_override?: RiskLevel | null;
}

export interface RiskTimelineProps {
  items: RiskTimelineItem[];
  onSelectPrediction?: (id: string) => void;
  selectedId?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({
  items,
  onSelectPrediction,
  selectedId,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs text-center">
        No prior risk assessments recorded for this patient.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-600" />
          Longitudinal Risk Trajectory
        </h4>
        <span className="text-[11px] text-slate-600">{items.length} total assessment(s)</span>
      </div>

      <div className="relative pl-4 border-l-2 border-slate-200 space-y-3">
        {items.map((item, idx) => {
          const isSelected = selectedId === item.prediction_id;
          const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={item.prediction_id || idx}
              onClick={() => onSelectPrediction && onSelectPrediction(item.prediction_id)}
              className={`relative p-3 rounded-lg border text-xs transition cursor-pointer ${
                isSelected
                  ? "bg-sky-50/70 border-sky-300 ring-1 ring-sky-300"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {/* Dot on timeline */}
              <div
                className={`absolute -left-[21px] top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  item.risk_level === "CRITICAL"
                    ? "bg-rose-600"
                    : item.risk_level === "HIGH"
                    ? "bg-amber-500"
                    : item.risk_level === "MEDIUM"
                    ? "bg-sky-500"
                    : "bg-emerald-500"
                }`}
              />

              <div className="flex items-center justify-between mb-1.5">
                <RiskLevelBadge level={item.risk_level} />
                <span className="text-[11px] text-slate-600 font-mono">{dateStr}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Model: <span className="font-medium text-slate-700">{item.model_name}</span>
                </span>
                <span>
                  Probability: <strong className="font-mono text-slate-800">{Math.round(item.probability * 100)}%</strong>
                </span>
              </div>

              {item.clinician_override && (
                <div className="mt-1 pt-1 border-t border-slate-100 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  Clinician Override: {item.clinician_override}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
