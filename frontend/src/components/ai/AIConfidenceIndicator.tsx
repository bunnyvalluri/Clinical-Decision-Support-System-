"use client";

import * as React from "react";
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";

interface AIConfidenceIndicatorProps {
  status: "GROUNDED" | "PARTIALLY_GROUNDED" | "UNSUPPORTED" | "ERROR" | string;
  confidence?: number;
}

export const AIConfidenceIndicator: React.FC<AIConfidenceIndicatorProps> = ({
  status,
  confidence = 1.0,
}) => {
  const normalized = status.toUpperCase();

  if (normalized === "GROUNDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
        <CheckCircle className="h-3 w-3 text-emerald-600" />
        Literature Grounded ({Math.round(confidence * 100)}%)
      </span>
    );
  }

  if (normalized === "PARTIALLY_GROUNDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
        <AlertTriangle className="h-3 w-3 text-amber-600" />
        Partially Grounded ({Math.round(confidence * 100)}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200">
      <XCircle className="h-3 w-3 text-rose-600" />
      Ungrounded Claim
    </span>
  );
};
