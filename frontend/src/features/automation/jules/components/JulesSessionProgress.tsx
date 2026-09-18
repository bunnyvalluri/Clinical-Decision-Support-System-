"use client";

import React from "react";
import { Check, Clock, Cpu, Play, ShieldAlert, GitPullRequest } from "lucide-react";
import { JulesSessionState } from "@/types/jules";

interface Props {
  state: JulesSessionState;
}

const STEPS = [
  { id: "QUEUED", label: "Queued", icon: Clock },
  { id: "PLANNING", label: "Planning", icon: Cpu },
  { id: "PLAN_PENDING_APPROVAL", label: "Plan Approval", icon: ShieldAlert },
  { id: "EXECUTING", label: "Executing", icon: Play },
  { id: "VALIDATING", label: "Validating", icon: Cpu },
  { id: "COMPLETED", label: "Completed", icon: Check },
];

export function JulesSessionProgress({ state }: Props) {
  const getStepIndex = (s: string) => {
    switch (s) {
      case "QUEUED":
        return 0;
      case "PLANNING":
        return 1;
      case "PLAN_PENDING_APPROVAL":
        return 2;
      case "EXECUTING":
        return 3;
      case "VALIDATING":
        return 4;
      case "AWAITING_REVIEW":
      case "APPROVED":
      case "PR_CREATED":
      case "COMPLETED":
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(state);
  const isFailed = state === "FAILED" || state === "CANCELLED";

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Background Line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIndex || (idx === 5 && currentIndex === 5 && !isFailed);
          const isCurrent = idx === currentIndex && !isFailed;
          const isPending = idx > currentIndex;

          let circleBg = "bg-white border-slate-300 text-slate-400";
          if (isDone) {
            circleBg = "bg-teal-600 border-teal-600 text-white shadow-xs";
          } else if (isCurrent) {
            circleBg = "bg-teal-50 border-teal-600 text-teal-700 ring-4 ring-teal-100 shadow-sm";
          } else if (isFailed && idx === currentIndex) {
            circleBg = "bg-rose-50 border-rose-500 text-rose-700 ring-4 ring-rose-100";
          }

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${circleBg}`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`mt-2 text-[10px] font-mono whitespace-nowrap ${
                  isCurrent
                    ? "font-bold text-slate-900"
                    : isDone
                    ? "font-semibold text-teal-700"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
