import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export interface RiskLevelBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  className?: string;
  showIcon?: boolean;
}

export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({
  level,
  className = "",
  showIcon = true,
}) => {
  const normLevel = (level || "LOW").toUpperCase();

  switch (normLevel) {
    case "CRITICAL":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
          role="status"
          aria-label="Critical Risk Level"
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />}
          CRITICAL RISK
        </span>
      );
    case "HIGH":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
          role="status"
          aria-label="High Risk Level"
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />}
          HIGH RISK
        </span>
      );
    case "MEDIUM":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 ${className}`}
          role="status"
          aria-label="Medium Risk Level"
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />}
          MEDIUM RISK
        </span>
      );
    case "LOW":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
          role="status"
          aria-label="Low Risk Level"
        >
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />}
          LOW RISK
        </span>
      );
  }
};
