"use client";

import React from "react";

interface LoopReadyScoreMeterProps {
  score: number;
}

export const LoopReadyScoreMeter: React.FC<LoopReadyScoreMeterProps> = ({ score }) => {
  const getColor = (val: number) => {
    if (val >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (val >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loop Ready Score
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Measured via upstream @cobusgreyling/loop doctor
        </div>
      </div>
      <div className={`text-2xl font-bold px-4 py-2 rounded-xl border ${getColor(score)}`}>
        {score}%
      </div>
    </div>
  );
};
