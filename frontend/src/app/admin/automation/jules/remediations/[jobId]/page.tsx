"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  RefreshCw,
  XCircle,
  FileCode,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesRemediationJob } from "@/types/jules";
import {
  JulesStatusBadge,
  JulesValidationPanel,
  JulesApprovalDialog,
  JulesErrorState,
} from "@/features/automation/jules/components";

export default function JulesRemediationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<JulesRemediationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await julesApi.getRemediation(jobId);
      setJob(data);
    } catch (err: any) {
      setError(err.message || "Failed to load remediation job");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const handleConfirmApproval = async (j: JulesRemediationJob, reason: string) => {
    await julesApi.approveRemediation(j.id, reason);
    await loadJob();
  };

  const handleCancelJob = async () => {
    if (!confirm("Are you sure you want to cancel this remediation job?")) return;
    try {
      await julesApi.cancelRemediation(jobId);
      await loadJob();
    } catch (err: any) {
      alert(err.message || "Failed to cancel job");
    }
  };

  if (loading && !job) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-100 rounded" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <JulesErrorState message={error || "Remediation job not found"} onRetry={loadJob} />
      </div>
    );
  }

  const needsApproval =
    job.status === "PLAN_PENDING_APPROVAL" || job.status === "PENDING_AUTHORIZATION";
  const canCancel = !["COMPLETED", "FAILED", "CANCELLED", "REJECTED"].includes(job.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/automation/jules/remediations"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-950 truncate max-w-xl">
                {job.title}
              </h1>
              <JulesStatusBadge status={job.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {job.correlation_id} &bull; {job.repository}:{job.branch}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needsApproval && (
            <button
              onClick={() => setApprovalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Authorize Plan</span>
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancelJob}
              className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
            >
              Cancel Job
            </button>
          )}

          <button
            onClick={loadJob}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pull Request Card if PR created */}
      {job.pr_url && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <p className="font-bold text-slate-950">
                Remediation Pull Request Created {job.pr_number ? `#${job.pr_number}` : ""}
              </p>
              <p className="text-[11px] text-slate-500 font-mono truncate max-w-lg">
                {job.pr_url}
              </p>
            </div>
          </div>
          <a
            href={job.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <span>Inspect PR</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Issue Details Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          REMEDIATION SPECIFICATION
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">CATEGORY</span>
            <span className="font-bold text-slate-800">{job.issue_category}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">SEVERITY</span>
            <span className="font-bold text-amber-700">{job.severity}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">TRIGGER</span>
            <span className="font-bold text-slate-800">{job.trigger_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">PROMPT VERSION</span>
            <span className="font-bold text-slate-800">{job.prompt_version}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 mb-1">Issue Description:</p>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {job.validation_output?.error_log && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-slate-500" />
              <span>Error Log Trace:</span>
            </p>
            <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-48 leading-snug">
              {job.validation_output.error_log}
            </pre>
          </div>
        )}
      </div>

      {/* Validation Panel */}
      <JulesValidationPanel
        validationStatus={job.validation_status}
        affectedFiles={job.validation_output?.affected_files}
      />

      {/* Active Jules Session Link */}
      {job.session && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <FileCode className="h-4 w-4 text-teal-600" />
            <div>
              <p className="font-bold text-slate-900">Linked Jules Session</p>
              <p className="font-mono text-[11px] text-slate-500">
                {job.session.external_session_id || job.session.id}
              </p>
            </div>
          </div>
          <Link
            href={`/admin/automation/jules/sessions/${job.session.id}`}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-teal-700 shadow-2xs transition-colors"
          >
            Inspect Session &rarr;
          </Link>
        </div>
      )}

      {/* Approval Modal */}
      <JulesApprovalDialog
        job={job}
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
}
