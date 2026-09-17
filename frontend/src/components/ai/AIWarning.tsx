"use client";

import * as React from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";

interface AIWarningProps {
  message: string;
  isHighRisk?: boolean;
}

export const AIWarning: React.FC<AIWarningProps> = ({
  message,
  isHighRisk = false,
}) => {
  return (
    <div
      className={`rounded-lg p-3 border text-xs flex items-start gap-2.5 ${
        isHighRisk
          ? "bg-rose-50 border-rose-200 text-rose-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}
    >
      {isHighRisk ? (
        <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      )}
      <div className="leading-relaxed">
        <span className="font-semibold block mb-0.5">
          {isHighRisk ? "Clinical Review Gate Required" : "Clinical Boundary Notice"}
        </span>
        {message}
      </div>
    </div>
  );
};
