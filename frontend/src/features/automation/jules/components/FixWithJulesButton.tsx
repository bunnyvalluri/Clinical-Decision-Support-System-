"use client";

import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { julesApi } from "@/services/jules";
import { RemediationIssueCategory, RemediationSeverity } from "@/types/jules";

interface Props {
  title: string;
  issueCategory: RemediationIssueCategory;
  description: string;
  issueReference?: string;
  affectedFiles?: string[];
  severity?: RemediationSeverity;
  onSuccess?: (jobId: string) => void;
  className?: string;
}

export function FixWithJulesButton({
  title,
  issueCategory,
  description,
  issueReference,
  affectedFiles,
  severity = "MEDIUM",
  onSuccess,
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      const job = await julesApi.createRemediation({
        title,
        issue_category: issueCategory,
        description,
        issue_reference: issueReference,
        affected_files: affectedFiles,
        severity,
      });
      if (onSuccess) {
        onSuccess(job.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to trigger Jules");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handleTrigger}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-teal-200" />
        )}
        <span>{loading ? "Dispatching..." : "Fix with Jules"}</span>
      </button>
      {error && <span className="text-[10px] text-rose-600 mt-1">{error}</span>}
    </div>
  );
}
