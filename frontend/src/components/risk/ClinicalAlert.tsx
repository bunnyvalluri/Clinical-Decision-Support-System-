import React from "react";
import { AlertCircle, AlertTriangle, BellRing, ShieldAlert } from "lucide-react";
import { DeterministicAlert } from "@/services/risk/riskApi";

export interface ClinicalAlertProps {
  alerts: DeterministicAlert[];
  className?: string;
}

export const ClinicalAlert: React.FC<ClinicalAlertProps> = ({ alerts, className = "" }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {alerts.map((alert, idx) => {
        const isCritical = alert.severity === "CRITICAL" || alert.severity === "CRITICAL_EMERGENCY";

        return (
          <div
            key={idx}
            className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
              isCritical
                ? "bg-rose-50/80 border-rose-200 text-rose-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
            role="alert"
          >
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {alert.rule_name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isCritical ? "bg-rose-200/70 text-rose-900" : "bg-amber-200/70 text-amber-900"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="font-mono text-slate-700">{alert.trigger_criteria}</p>
              {alert.recommended_action && (
                <p className="text-slate-800 font-medium pt-1 border-t border-rose-100">
                  Recommendation: {alert.recommended_action}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
