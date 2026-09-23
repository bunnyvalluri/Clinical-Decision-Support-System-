"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, ChevronRight, HelpCircle, ShieldAlert, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TypedDecisionProps {
  decisionValue: string;
  confidence: number;
  uncertaintyStatus: string;
  requiresReview: boolean;
  schemaName?: string;
  isUnavailable?: boolean;
  onClinicianAction?: (action: "APPROVED" | "OVERRIDDEN" | "REJECTED") => void;
}

export function TypedDecisionBadge({
  decisionValue,
  confidence,
  uncertaintyStatus,
  requiresReview,
  schemaName,
  isUnavailable = false,
  onClinicianAction,
}: TypedDecisionProps) {
  if (isUnavailable) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs">
        <HelpCircle className="h-4 w-4 text-slate-400" />
        <span>AI Workflow Classification: <strong className="text-slate-600">Unavailable</strong></span>
      </div>
    );
  }

  const getUncertaintyColor = (status: string) => {
    switch (status) {
      case "SUPPORTED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "LOW_CONFIDENCE":
      case "PARTIALLY_SUPPORTED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "REQUIRES_CLINICIAN_REVIEW":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 uppercase tracking-wider">
            AI-Assisted Workflow Classification
          </span>
          {schemaName && <span className="text-slate-400">({schemaName})</span>}
        </div>
        <Badge className={getUncertaintyColor(uncertaintyStatus)}>
          {uncertaintyStatus} ({(confidence * 100).toFixed(0)}%)
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">Suggested Routing / Category:</span>
          <span className="text-lg font-bold text-slate-900">{decisionValue}</span>
        </div>
        {requiresReview && (
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md font-medium">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Clinician Review Required
          </div>
        )}
      </div>

      {onClinicianAction && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
          <span className="text-slate-400 mr-2">Sign-off:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => onClinicianAction("APPROVED")}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => onClinicianAction("OVERRIDDEN")}
          >
            Override
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={() => onClinicianAction("REJECTED")}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
export default TypedDecisionBadge;
