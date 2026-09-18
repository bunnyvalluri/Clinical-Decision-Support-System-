import React from "react";
import { AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";

export interface UncertaintyIndicatorProps {
  uncertaintyScore?: number | null;
  oodStatus?: string;
  isAbstaining?: boolean;
  className?: string;
}

export const UncertaintyIndicator: React.FC<UncertaintyIndicatorProps> = ({
  uncertaintyScore,
  oodStatus = "IN_DISTRIBUTION",
  isAbstaining = false,
  className = "",
}) => {
  const isOOD = oodStatus.toUpperCase().includes("OUT_OF_DISTRIBUTION");

  if (isAbstaining) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Status: <strong>Abstained (High Uncertainty / OOD)</strong></span>
      </div>
    );
  }

  if (isOOD) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Distribution: <strong>Out-Of-Distribution Shift</strong></span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md ${className}`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
      <span>
        In-Distribution
        {uncertaintyScore !== null && uncertaintyScore !== undefined && (
          <> (Entropy: <strong className="font-mono">{uncertaintyScore.toFixed(3)}</strong>)</>
        )}
      </span>
    </div>
  );
};
