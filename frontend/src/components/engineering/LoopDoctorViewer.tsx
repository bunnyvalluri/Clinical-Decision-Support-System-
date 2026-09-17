"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface LoopDoctorViewerProps {
  score: number;
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}

export const LoopDoctorViewer: React.FC<LoopDoctorViewerProps> = ({
  score,
  healthy,
  issues,
  recommendations,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Loop Doctor Diagnostics
        </h3>
        <Badge
          className={
            healthy
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }
        >
          {healthy ? "Healthy" : "Attention Required"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700">Readiness Score: {score}%</div>
        {issues.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
            {issues.map((iss, idx) => (
              <div key={idx}>• {iss}</div>
            ))}
          </div>
        )}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 space-y-1">
          <div className="font-semibold text-slate-800">Recommendations:</div>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="text-slate-600">• {rec}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
