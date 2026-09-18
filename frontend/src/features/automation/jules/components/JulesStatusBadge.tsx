"use client";

import React from "react";
import {
  Clock,
  Cpu,
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertCircle,
  XCircle,
  GitPullRequest,
} from "lucide-react";

interface Props {
  status: string;
  size?: "sm" | "md";
}

export function JulesStatusBadge({ status, size = "sm" }: Props) {
  const norm = (status || "").toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = Clock;
  let label = status;

  switch (norm) {
    case "QUEUED":
      colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
      Icon = Clock;
      label = "Queued";
      break;
    case "PLANNING":
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
      Icon = Cpu;
      label = "Planning";
      break;
    case "PLAN_PENDING_APPROVAL":
    case "PENDING_AUTHORIZATION":
      colorClasses = "bg-amber-50 text-amber-800 border-amber-300 animate-pulse";
      Icon = ShieldAlert;
      label = "Approval Required";
      break;
    case "AUTHORIZED":
      colorClasses = "bg-teal-50 text-teal-700 border-teal-200";
      Icon = CheckCircle2;
      label = "Authorized";
      break;
    case "EXECUTING":
      colorClasses = "bg-purple-50 text-purple-700 border-purple-200";
      Icon = Play;
      label = "Executing Fix";
      break;
    case "VALIDATING":
      colorClasses = "bg-sky-50 text-sky-700 border-sky-200";
      Icon = Cpu;
      label = "Validating";
      break;
    case "AWAITING_REVIEW":
      colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
      Icon = ShieldAlert;
      label = "Awaiting Review";
      break;
    case "PR_CREATED":
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      Icon = GitPullRequest;
      label = "PR Created";
      break;
    case "COMPLETED":
    case "MERGED":
    case "PASSED":
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-300";
      Icon = CheckCircle2;
      label = norm === "PASSED" ? "Passed" : "Completed";
      break;
    case "FAILED":
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
      Icon = AlertCircle;
      label = "Failed";
      break;
    case "CANCELLED":
    case "REJECTED":
      colorClasses = "bg-slate-100 text-slate-500 border-slate-200";
      Icon = XCircle;
      label = norm === "REJECTED" ? "Rejected" : "Cancelled";
      break;
    default:
      break;
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-full border shadow-2xs whitespace-nowrap ${colorClasses} ${padding}`}
    >
      <Icon className={iconSize} />
      <span>{label}</span>
    </span>
  );
}
