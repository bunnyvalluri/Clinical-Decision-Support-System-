"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  FolderGit2,
  Cpu,
  ShieldAlert,
  Plus,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  JulesHealthCard,
  JulesRemediationCard,
  JulesStatusBadge,
  JulesApprovalDialog,
  JulesErrorState,
} from "@/features/automation/jules/components";
import { julesApi } from "@/services/jules";
import {
  JulesHealthResponse,
  JulesRemediationJob,
  JulesSession,
  JulesActivity,
} from "@/types/jules";

export default function JulesDashboardPage() {
  const [health, setHealth] = useState<JulesHealthResponse | null>(null);
  const [remediations, setRemediations] = useState<JulesRemediationJob[]>([]);
  const [sessions, setSessions] = useState<JulesSession[]>([]);
  const [activities, setActivities] = useState<JulesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal state
  const [selectedJob, setSelectedJob] = useState<JulesRemediationJob | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, remData, sessData, actData] = await Promise.all([
        julesApi.getHealth().catch(() => null),
        julesApi.listRemediations().catch(() => []),
        julesApi.listSessions().catch(() => []),
        julesApi.listGlobalActivity(10).catch(() => []),
      ]);
      setHealth(healthData);
      setRemediations(remData);
      setSessions(sessData);
      setActivities(actData);
    } catch (err: any) {
      setError(err.message || "Failed to load Jules automation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenApproval = (job: JulesRemediationJob) => {
    setSelectedJob(job);
    setApprovalModalOpen(true);
  };

  const handleConfirmApproval = async (job: JulesRemediationJob, reason: string) => {
    await julesApi.approveRemediation(job.id, reason);
    await loadData();
  };

  const pendingApprovals = remediations.filter(
    (r) => r.status === "PLAN_PENDING_APPROVAL" || r.status === "PENDING_AUTHORIZATION"
  );
  const activeRemediations = remediations.filter(
    (r) => !["COMPLETED", "FAILED", "CANCELLED", "REJECTED"].includes(r.status)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              Google Jules Automation
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              ENGINEERING AI
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Autonomous bug remediation, CI failure resolution, and code review support
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/automation/jules/settings"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            Settings
          </Link>

          <Link
            href="/admin/automation/jules/sources"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Sources</span>
          </Link>
        </div>
      </div>

      {error && <JulesErrorState message={error} onRetry={loadData} />}

      {/* Health Overview Card */}
      <JulesHealthCard health={health} loading={loading} onRefresh={loadData} />

      {/* Dual-Custody Approval Required Banner */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
              <h3 className="text-sm font-bold text-amber-950">
                Action Required: {pendingApprovals.length} Remediation Plan{pendingApprovals.length > 1 ? "s" : ""} Pending Approval
              </h3>
            </div>
            <Link
              href="/admin/automation/jules/remediations"
              className="text-xs font-bold text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.slice(0, 2).map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-white border border-amber-200/90 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 line-clamp-1">{job.title}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {job.correlation_id} &bull; {job.branch}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenApproval(job)}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-colors shrink-0"
                >
                  Review Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Remediation Jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-950">
              Active Remediation Jobs ({activeRemediations.length})
            </h2>
          </div>
          <Link
            href="/admin/automation/jules/remediations"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>All Remediations</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <div className="h-36 bg-slate-100 rounded-2xl" />
            <div className="h-36 bg-slate-100 rounded-2xl" />
          </div>
        ) : activeRemediations.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center bg-white text-xs text-slate-400">
            No active remediation jobs in progress. All pipelines healthy.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRemediations.map((job) => (
              <JulesRemediationCard
                key={job.id}
                job={job}
                onApprove={handleOpenApproval}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-950">
            Recent Jules Sessions ({sessions.length})
          </h2>
          <Link
            href="/admin/automation/jules/sessions"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>All Sessions</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Session Title</th>
                  <th className="py-3 px-4 font-bold">Repository</th>
                  <th className="py-3 px-4 font-bold">Branch</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.slice(0, 5).map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {session.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {session.repository}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {session.branch}
                    </td>
                    <td className="py-3 px-4">
                      <JulesStatusBadge status={session.state} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/automation/jules/sessions/${session.id}`}
                        className="font-bold text-teal-700 hover:text-teal-900 underline underline-offset-2"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No Jules sessions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approval Dialog Modal */}
      <JulesApprovalDialog
        job={selectedJob}
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
}
