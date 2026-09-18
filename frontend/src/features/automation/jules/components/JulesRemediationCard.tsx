"use client";

import React from "react";
import Link from "next/link";
import {
  GitBranch,
  ArrowRight,
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
} from "lucide-react";
import { JulesRemediationJob } from "@/types/jules";
import { JulesStatusBadge } from "./JulesStatusBadge";

interface Props {
  job: JulesRemediationJob;
  onApprove?: (job: JulesRemediationJob) => void;
}

export function JulesRemediationCard({ job, onApprove }: Props) {
  const isHighSeverity = job.severity === "HIGH" || job.severity === "CRITICAL";
  const needsApproval =
    job.status === "PLAN_PENDING_APPROVAL" || job.status === "PENDING_AUTHORIZATION";

  let severityBadge = "bg-slate-100 text-slate-700 border-slate-200";
  if (job.severity === "LOW") {
    severityBadge = "bg-teal-50 text-teal-700 border-teal-200";
  } else if (job.severity === "MEDIUM") {
    severityBadge = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (job.severity === "HIGH") {
    severityBadge = "bg-amber-50 text-amber-800 border-amber-300";
  } else if (job.severity === "CRITICAL") {
    severityBadge = "bg-rose-50 text-rose-800 border-rose-300";
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${severityBadge}`}
            >
              {job.severity}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {job.correlation_id}
            </span>
          </div>
          <JulesStatusBadge status={job.status} />
        </div>

        {/* Title */}
        <Link
          href={`/admin/automation/jules/remediations/${job.id}`}
          className="text-sm sm:text-base font-bold text-slate-900 hover:text-teal-700 transition-colors line-clamp-1 block mb-1.5"
        >
          {job.title}
        </Link>

        {/* Description preview */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>
      </div>

      {/* Meta Bar & Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3 text-slate-400" />
            {job.branch}
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>{job.trigger_type}</span>
        </div>

        <div className="flex items-center gap-2">
          {needsApproval && onApprove && (
            <button
              onClick={() => onApprove(job)}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Approve Plan</span>
            </button>
          )}

          {job.pr_url && (
            <a
              href={job.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>View PR</span>
            </a>
          )}

          <Link
            href={`/admin/automation/jules/remediations/${job.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
