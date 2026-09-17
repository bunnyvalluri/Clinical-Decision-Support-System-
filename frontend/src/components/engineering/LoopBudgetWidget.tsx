"use client";

import React from "react";

interface LoopBudgetWidgetProps {
  dailyLimit: number;
  currentSpend: number;
  hardStop: boolean;
}

export const LoopBudgetWidget: React.FC<LoopBudgetWidgetProps> = ({
  dailyLimit,
  currentSpend,
  hardStop,
}) => {
  const percent = Math.min(Math.round((currentSpend / dailyLimit) * 100), 100);

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Daily Budget Cap
        </span>
        <span className="text-xs font-mono text-slate-700">
          ${currentSpend.toFixed(2)} / ${dailyLimit.toFixed(2)}
        </span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${
            percent > 85 ? "bg-rose-500" : percent > 50 ? "bg-amber-500" : "bg-blue-600"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{percent}% Consumed</span>
        <span>{hardStop ? "Hard Stop: Active" : "Warning Only"}</span>
      </div>
    </div>
  );
};
