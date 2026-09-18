import React from "react";
import { CheckCircle, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";

export interface DataQualityIndicatorProps {
  status: string;
  issueCount?: number;
  className?: string;
}

export const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({
  status = "VALID",
  issueCount = 0,
  className = "",
}) => {
  const normStatus = status.toUpperCase();

  if (normStatus === "VALID" || issueCount === 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Data Quality: <strong>Verified & In-Bounds</strong></span>
      </div>
    );
  }

  if (normStatus.includes("CRITICAL")) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md ${className}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Data Quality: <strong>{issueCount} Anomaly Detected</strong></span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md ${className}`}>
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      <span>Data Quality: <strong>{issueCount} Warning(s)</strong></span>
    </div>
  );
};
