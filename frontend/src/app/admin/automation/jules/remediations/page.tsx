"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  ShieldAlert,
  Search,
  Filter,
} from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesRemediationJob } from "@/types/jules";
import {
  JulesRemediationCard,
  JulesApprovalDialog,
  JulesErrorState,
} from "@/features/automation/jules/components";

export function JulesRemediationsListPage() {
  const [jobs, setJobs] = useState<JulesRemediationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Approval state
  const [selectedJob, setSelectedJob] = useState<JulesRemediationJob | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await julesApi.listRemediations();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load remediation jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleOpenApproval = (job: JulesRemediationJob) => {
    setSelectedJob(job);
    setApprovalModalOpen(true);
  };

  const handleConfirmApproval = async (job: JulesRemediationJob, reason: string) => {
    await julesApi.approveRemediation(job.id, reason);
    await loadJobs();
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSeverity = filterSeverity === "ALL" || job.severity === filterSeverity;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.correlation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.issue_category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/automation/jules"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950">
              Automated Code Remediations
            </h1>
            <p className="text-xs text-slate-500">
              Bug fixes, CI failure mitigations, and automated security patches
            </p>
          </div>
        </div>

        <button
          onClick={loadJobs}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <JulesErrorState message={error} onRetry={loadJobs} />}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, correlation ID, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Severity:</span>
          {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                filterSeverity === sev
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
          No remediation jobs match the active filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JulesRemediationCard
              key={job.id}
              job={job}
              onApprove={handleOpenApproval}
            />
          ))}
        </div>
      )}

      {/* Approval Modal */}
      <JulesApprovalDialog
        job={selectedJob}
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
}

export default JulesRemediationsListPage;
