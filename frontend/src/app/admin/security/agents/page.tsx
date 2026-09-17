"use client";

import React, { useState, useEffect } from "react";
import { SecurityAgentRunTable, SecurityAgentRunItem } from "@/components/security/SecurityAgentRunTable";
import { AgentCapabilityTable, CapabilityItem } from "@/components/security/AgentCapabilityTable";
import { SecurityProviderSelector, SecurityProviderType } from "@/components/security/SecurityProviderSelector";
import { FindingCluster, ClusterItem } from "@/components/security/FindingCluster";
import { Button } from "@/components/ui/button";

export default function SecurityAgentsPage() {
  const [provider, setProvider] = useState<SecurityProviderType>("PENTEST_AGENTS");
  const [runs, setRuns] = useState<SecurityAgentRunItem[]>([]);
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [clusters, setClusters] = useState<ClusterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch / synthetic data state
    setRuns([
      {
        id: "run-8f9214b2-a4e1",
        provider: "PENTEST_AGENTS",
        agent: "API_SECURITY",
        task: "Simulated IDOR and privilege escalation against /api/v1/predictions/",
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
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "run-3c4159d8-b219",
        provider: "STRIX",
        agent: "SAST",
        task: "Deep code vulnerability audit against API Gateway routers",
        target_name: "Synthetic CDSS Test Gateway",
        status: "COMPLETED",
        start_time: new Date(Date.now() - 7200000).toISOString(),
        end_time: new Date(Date.now() - 3600000).toISOString(),
        token_usage: {
          prompt_tokens: 3100,
          completion_tokens: 1200,
          total_tokens: 4300,
          estimated_cost: 0.009,
        },
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ]);

    setCapabilities([
      {
        id: "cap-1",
        capability: "API_TESTING",
        risk_level: "MEDIUM",
        required_permission: "SECURITY_AGENT_RUN",
        allowed_environment: "SECURITY_TEST",
        network_policy: "RESTRICTED",
        approval_required: true,
        is_active: true,
      },
      {
        id: "cap-2",
        capability: "IDOR",
        risk_level: "HIGH",
        required_permission: "SECURITY_AGENT_RUN",
        allowed_environment: "SECURITY_TEST",
        network_policy: "RESTRICTED",
        approval_required: true,
        is_active: true,
      },
      {
        id: "cap-3",
        capability: "REPORT_GENERATION",
        risk_level: "LOW",
        required_permission: "SECURITY_AGENT_RUN",
        allowed_environment: "SECURITY_TEST",
        network_policy: "NONE",
        approval_required: false,
        is_active: true,
      },
    ]);

    setClusters([
      {
        id: "cluster-1",
        cluster_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        title: "Insecure Direct Object Reference (IDOR) on Synthetic Endpoint",
        vulnerability_type: "IDOR",
        affected_endpoint: "/api/v1/predictions/export/",
        findings_count: 2,
        providers: ["PENTEST_AGENTS", "STRIX"],
        confidence_score: 0.95,
        status: "TRIAGED",
      },
    ]);

    setLoading(false);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Testing Agent Orchestration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Governed multi-provider security automation powered by H-mmer Pentest-Agents and Strix.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white text-slate-700 border-slate-200">
            Export Audit SARIF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            Launch Agent Assessment
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
          Active Security Testing Provider
        </h2>
        <SecurityProviderSelector selectedProvider={provider} onSelectProvider={setProvider} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Recent Agent Runs
        </h2>
        <SecurityAgentRunTable runs={runs} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Correlated Finding Clusters
          </h2>
          <FindingCluster clusters={clusters} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Agent Capability Registry
          </h2>
          <AgentCapabilityTable capabilities={capabilities} />
        </div>
      </div>
    </div>
  );
}
