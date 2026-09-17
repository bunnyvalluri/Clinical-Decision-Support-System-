"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AgentRunDetail, AgentRunDetailData } from "@/components/security/AgentRunDetail";
import { AgentRunTimeline, TimelineEvent } from "@/components/security/AgentRunTimeline";
import { ToolCallTimeline, ToolCallItem } from "@/components/security/ToolCallTimeline";
import { SecurityEvidenceViewer, EvidenceItem } from "@/components/security/SecurityEvidenceViewer";
import { Button } from "@/components/ui/button";

export default function AgentRunDetailPage() {
  const params = useParams();
  const runId = (params?.agentRunId as string) || "run-8f9214b2-a4e1";

  const [runData] = useState<AgentRunDetailData>({
    id: runId,
    provider: "PENTEST_AGENTS",
    agent: "API_SECURITY",
    task: "Simulated IDOR and privilege escalation assessment against /api/v1/predictions/",
    target_name: "Synthetic CDSS Test Gateway",
    status: "COMPLETED",
    start_time: new Date(Date.now() - 3600000).toISOString(),
    end_time: new Date().toISOString(),
    token_usage: {
      prompt_tokens: 1420,
      completion_tokens: 580,
      total_tokens: 2000,
      estimated_cost: 0.004,
    },
    correlation_id: "corr-819a2f-e8",
    workspace_path: "security_workspaces/assessment_synthetic_01/",
    result: {
      status: "COMPLETED",
      findings_discovered: 1,
      policy_verifications_passed: 7,
    },
  });

  const [timeline] = useState<TimelineEvent[]>([
    {
      id: "t1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      stage: "Sandbox Provisioned",
      description: "Isolated workspace directory initialized with non-root security boundaries.",
      status: "success",
    },
    {
      id: "t2",
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      stage: "Target Authorization Verified",
      description: "Dual-custody signature checked; scope strictly allowlisted to synthetic routes.",
      status: "success",
    },
    {
      id: "t3",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      stage: "7-Question Validation Gate",
      description: "Deterministic validation confirmed reproducible impact with zero PHI.",
      status: "success",
    },
    {
      id: "t4",
      timestamp: new Date().toISOString(),
      stage: "Workspace Cleaned Up",
      description: "Ephemeral workspace deleted from disk. Audit records stored in Neon DB.",
      status: "success",
    },
  ]);

  const [toolCalls] = useState<ToolCallItem[]>([
    {
      timestamp: new Date(Date.now() - 2800000).toISOString(),
      tool: "search_writeups",
      args: { query: "IDOR claim validation bypass", limit: 3 },
    },
    {
      timestamp: new Date(Date.now() - 2500000).toISOString(),
      tool: "probe_synthetic_endpoint",
      args: { target_url: "http://localhost:8000/api/v1/predictions/export/", method: "GET" },
    },
  ]);

  const [evidence] = useState<EvidenceItem[]>([
    {
      id: "ev-1",
      evidence_type: "REPRODUCTION_POC",
      reproduction_steps: "GET /api/v1/predictions/export/?tenant_id=synthetic_2 with auth header of synthetic_1",
      sanitized_request: {
        method: "GET",
        headers: { Authorization: "Bearer [REDACTED_SYNTHETIC_TOKEN]" },
      },
      evidence_hash: "d41d8cd98f00b204e9800998ecf8427e",
      captured_at: new Date().toISOString(),
    },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <Link href="/admin/security/agents">
          <Button variant="outline" size="sm" className="bg-white text-slate-700 border-slate-200">
            ← Back to Agent Runs
          </Button>
        </Link>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
          Generate Draft Bounty Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AgentRunDetail run={runData} />
          <SecurityEvidenceViewer evidence={evidence} />
        </div>
        <div className="space-y-6">
          <AgentRunTimeline events={timeline} />
          <ToolCallTimeline toolCalls={toolCalls} />
        </div>
      </div>
    </div>
  );
}
