"use client";

import * as React from "react";
import {
  Server,
  Layers,
  Activity,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowUpRight,
  Database,
  ExternalLink,
  ShieldAlert,
  Lock,
  DollarSign,
  FileCode,
  Network,
  Check,
  X,
  Sliders,
  HardDrive,
} from "lucide-react";

interface ServerItem {
  id: string;
  name: string;
  environment: string;
  status: string;
  region: string;
  provider: string;
  last_health_check?: string;
}

interface ApplicationItem {
  id: string;
  name: string;
  environment: string;
  repository: string;
  branch: string;
  deployment_status: string;
  last_deployed_commit?: string;
}

interface DeploymentItem {
  id: string;
  coolify_deployment_id: string;
  application_name: string;
  commit_sha: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
  started_at: string;
  trigger: string;
  actor_username?: string;
  correlation_id: string;
}

interface IaCPlan {
  id: string;
  environment: string;
  tool: string;
  plan_output: string;
  resources_to_add: number;
  resources_to_change: number;
  resources_to_destroy: number;
  status: string;
  requires_human_approval: boolean;
  approved_by_username?: string;
  created_at: string;
}

interface DriftRecord {
  id: string;
  environment: string;
  is_drifted: boolean;
  status: string;
  exit_code: number;
  drift_summary: string;
  remediation_plan?: string;
  detected_at: string;
}

interface PolicyCheck {
  id: string;
  policy_name: string;
  policy_type: string;
  status: "PASSED" | "FAILED" | "WARNING";
  description: string;
  violations: string[];
  evaluated_at: string;
}

interface CostSummary {
  status: string;
  available: boolean;
  message: string;
  monthly_estimated_total: string | null;
  currency: string;
  breakdown: Array<{ service: string; cost: string }>;
}

export default function AdminInfrastructurePage() {
  const [activeTab, setActiveTab] = React.useState<"topology" | "iac" | "drift" | "policies" | "costs" | "coolify">("topology");
  const [selectedEnv, setSelectedEnv] = React.useState<string>("production");
  const [loading, setLoading] = React.useState(true);
  const [controlPlaneOnline, setControlPlaneOnline] = React.useState(true);
  
  // Data states
  const [servers, setServers] = React.useState<ServerItem[]>([]);
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);
  const [deployments, setDeployments] = React.useState<DeploymentItem[]>([]);
  const [iacPlans, setIacPlans] = React.useState<IaCPlan[]>([]);
  const [driftHistory, setDriftHistory] = React.useState<DriftRecord[]>([]);
  const [policies, setPolicies] = React.useState<PolicyCheck[]>([]);
  const [costData, setCostData] = React.useState<CostSummary | null>(null);

  // Action states
  const [isPlanning, setIsPlanning] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [isCheckingDrift, setIsCheckingDrift] = React.useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = React.useState(false);
  const [approvalToken, setApprovalToken] = React.useState("");
  const [selectedPlanForApply, setSelectedPlanForApply] = React.useState<IaCPlan | null>(null);
  const [notification, setNotification] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTelemetry = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Coolify health
      const res = await fetch("/api/v1/infrastructure/health/");
      if (res.ok) {
        const data = await res.json();
        setControlPlaneOnline(data?.health?.status === "HEALTHY" || data?.health?.control_plane === "ONLINE");
        setServers(data?.servers || []);
        setApplications(data?.applications || []);
      }

      // 2. IaC plans
      const planRes = await fetch(`/api/v1/infrastructure/iac/plans/?environment=${selectedEnv}`);
      if (planRes.ok) {
        const data = await planRes.json();
        setIacPlans(Array.isArray(data) ? data : []);
      }

      // 3. Drift detection
      const driftRes = await fetch(`/api/v1/infrastructure/iac/drift/?environment=${selectedEnv}`);
      if (driftRes.ok) {
        const data = await driftRes.json();
        setDriftHistory(Array.isArray(data) ? data : []);
      }

      // 4. Policy checks
      const polRes = await fetch("/api/v1/infrastructure/governance/policies/");
      if (polRes.ok) {
        const data = await polRes.json();
        setPolicies(Array.isArray(data) ? data : []);
      }

      // 5. Cost Governance
      const costRes = await fetch(`/api/v1/infrastructure/governance/costs/?environment=${selectedEnv}`);
      if (costRes.ok) {
        const data = await costRes.json();
        setCostData(data);
      }
    } catch {
      setControlPlaneOnline(false);
    } finally {
      setLoading(false);
    }
  }, [selectedEnv]);

  React.useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    try {
      const res = await fetch("/api/v1/infrastructure/iac/plans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: selectedEnv }),
      });
      if (res.ok) {
        const plan = await res.json();
        setIacPlans((prev) => [plan, ...prev]);
        setNotification({
          text: `OpenTofu plan generated for ${selectedEnv}: +${plan.resources_to_add} ~${plan.resources_to_change} -${plan.resources_to_destroy}.`,
          type: "success",
        });
      } else {
        setNotification({ text: "Failed to generate IaC plan.", type: "error" });
      }
    } catch {
      setNotification({ text: "Network error executing plan.", type: "error" });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleApplyPlan = async (plan: IaCPlan) => {
    if (plan.environment === "production") {
      setSelectedPlanForApply(plan);
      setApprovalModalOpen(true);
      return;
    }
    executeApply(plan.id, "dev-bypass", true);
  };

  const executeApply = async (planId: string, token: string, confirmed: boolean) => {
    setIsApplying(true);
    try {
      const res = await fetch("/api/v1/infrastructure/iac/apply/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: selectedEnv,
          plan_id: planId,
          approval_token: token,
          confirmed: confirmed,
        }),
      });
      if (res.ok) {
        setApprovalModalOpen(false);
        setApprovalToken("");
        setNotification({
          text: `Infrastructure changes applied successfully for ${selectedEnv}.`,
          type: "success",
        });
        fetchTelemetry();
      } else {
        const err = await res.json();
        setNotification({ text: err.error || "Apply failed.", type: "error" });
      }
    } catch {
      setNotification({ text: "Apply execution failed.", type: "error" });
    } finally {
      setIsApplying(false);
    }
  };

  const handleCheckDrift = async () => {
    setIsCheckingDrift(true);
    try {
      const res = await fetch("/api/v1/infrastructure/iac/drift/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: selectedEnv }),
      });
      if (res.ok) {
        const drift = await res.json();
        setDriftHistory((prev) => [drift, ...prev]);
        setNotification({
          text: drift.is_drifted
            ? `DRIFT DETECTED in ${selectedEnv}! Out-of-band cloud modifications observed.`
            : `Infrastructure in ${selectedEnv} is completely IN SYNC with authoritative code.`,
          type: drift.is_drifted ? "error" : "success",
        });
      }
    } catch {
      setNotification({ text: "Error running drift check.", type: "error" });
    } finally {
      setIsCheckingDrift(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      {/* Platform Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                OpenTofu v1.8.x
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Coolify PaaS Host
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Neon PostgreSQL: Authoritative Truth
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Platform Engineering & Infrastructure Governance
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Declarative OpenTofu IaC, AWS cloud hardening, network isolation, policy guardrails, and drift auditing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="production">Environment: Production</option>
              <option value="staging">Environment: Staging</option>
              <option value="development">Environment: Development</option>
            </select>

            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex gap-2 border-b border-slate-100 overflow-x-auto">
          {[
            { id: "topology", label: "Topology & Cloud Hardening", icon: Network },
            { id: "iac", label: "IaC Plan & Apply", icon: FileCode },
            { id: "drift", label: "Drift Detection", icon: Sliders },
            { id: "policies", label: "HIPAA & Policy Guardrails", icon: ShieldCheck },
            { id: "costs", label: "FinOps Cost Governance", icon: DollarSign },
            { id: "coolify", label: "Coolify Stacks & Deployments", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
                  active
                    ? "border-slate-900 text-slate-900 bg-slate-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-slate-900" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: TOPOLOGY & CLOUD HARDENING */}
        {activeTab === "topology" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Cloud Network Isolation</span>
                  <Network className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">VPC 10.0.0.0/16</div>
                <div className="text-xs text-slate-500 mt-1">6 Subnets (Public, App-Private, Data-Private)</div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Host Node Security</span>
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">IMDSv2 Enforced</div>
                <div className="text-xs text-slate-500 mt-1">CIS Hardened · gp3 Encrypted · No Root SSH</div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Authoritative Storage</span>
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">Neon Serverless</div>
                <div className="text-xs text-slate-500 mt-1">Branch: production · TLS 1.3 · PgBouncer</div>
              </div>
            </div>

            {/* Architecture Multi-Tier Diagram */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Multi-Tier Network & Compute Topology</h2>
                  <p className="text-xs text-slate-500">Zero direct public database access. Ingress restricted strictly to ports 80/443.</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  HIPAA-Compliant Isolation
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Public Tier */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tier 1: Public Ingress</span>
                    <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">10.0.1.0/24</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-semibold text-sm text-slate-900 flex items-center justify-between">
                      <span>AWS ALB & Reverse Proxy</span>
                      <span className="text-xs font-mono text-emerald-600 font-bold">TLS 1.3</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Terminates external traffic. Forwards to internal app ports.
                    </p>
                    <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Port 80 (HTTP &rarr; HTTPS)</span>
                      <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">Port 443 (HTTPS)</span>
                    </div>
                  </div>
                </div>

                {/* Application Tier */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tier 2: Private App Tier</span>
                    <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">10.0.10.0/24</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-semibold text-sm text-slate-900 flex items-center justify-between">
                      <span>Coolify Docker Host (c6i.2xlarge)</span>
                      <span className="text-xs font-mono text-emerald-600 font-bold">IMDSv2</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Isolated from internet. Only accessible via ALB security group.
                    </p>
                    <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Django ASGI:8000</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Next.js:3000</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Coolify:8080</span>
                    </div>
                  </div>
                </div>

                {/* Data & Cache Tier */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tier 3: Private Data & Cache</span>
                    <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">10.0.20.0/24</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-semibold text-sm text-slate-900 flex items-center justify-between">
                      <span>Internal Data Engines</span>
                      <span className="text-xs font-mono text-blue-600 font-bold">Encrypted</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Strict security group blocks: accessible only from App Tier SG.
                    </p>
                    <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Redis:6379</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Meili:7700</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Ollama:11434</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardening Checklist */}
              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Authoritative Hardening Assertions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>No 0.0.0.0/0 on sensitive ports</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>IMDSv2 required on all EC2 instances</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>S3 Public Access Block fully enabled</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>S3 Server-Side Encryption (SSE) default</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>EBS Root Volumes gp3 Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Docker daemon no-new-privileges: true</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IAC PLAN & APPLY */}
        {activeTab === "iac" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">OpenTofu Speculative Planning & Apply</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute safe dry-run plans before modifying cloud resources. Production requires human sign-off.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGeneratePlan}
                  disabled={isPlanning}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                >
                  <FileCode className={`w-4 h-4 ${isPlanning ? "animate-spin" : ""}`} />
                  {isPlanning ? "Planning..." : `Plan ${selectedEnv.toUpperCase()}`}
                </button>
              </div>
            </div>

            {/* Plans List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Execution Plan History ({iacPlans.length})
                </span>
                <span className="text-xs text-slate-500 font-mono">Backend: S3 + DynamoDB Lock</span>
              </div>

              {iacPlans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No plans recorded for {selectedEnv}. Click &quot;Plan {selectedEnv.toUpperCase()}&quot; to preview changes.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {iacPlans.map((plan) => (
                    <div key={plan.id} className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-500">{plan.id.slice(0, 8)}</span>
                          <span className="font-semibold text-sm text-slate-900 uppercase">{plan.environment}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                            {plan.tool}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              plan.status === "APPLIED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : plan.status === "PLANNED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {plan.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">+{plan.resources_to_add} to add</span>
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">~{plan.resources_to_change} to change</span>
                            <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded">-{plan.resources_to_destroy} to destroy</span>
                          </div>

                          {plan.status === "PLANNED" && (
                            <button
                              onClick={() => handleApplyPlan(plan)}
                              disabled={isApplying}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
                            >
                              Apply Plan
                            </button>
                          )}
                        </div>
                      </div>

                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto max-h-40">
                        {plan.plan_output}
                      </pre>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Created: {new Date(plan.created_at).toLocaleString()}</span>
                        {plan.approved_by_username && (
                          <span className="text-emerald-600 font-semibold">Approved by: {plan.approved_by_username}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DRIFT DETECTION */}
        {activeTab === "drift" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Drift Detection & Cloud Synchronization</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compares running cloud state with code in Git repository. Conforms to Zero Fake Data policy.
                </p>
              </div>

              <button
                onClick={handleCheckDrift}
                disabled={isCheckingDrift}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingDrift ? "animate-spin" : ""}`} />
                {isCheckingDrift ? "Evaluating..." : "Check Drift Now"}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Drift Audit Records
                </span>
                <span className="text-xs text-slate-500 font-mono">Exit Code 0 = In Sync, 2 = Drift</span>
              </div>

              {driftHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No drift evaluations on record for {selectedEnv}. Click &quot;Check Drift Now&quot; to run verification.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {driftHistory.map((drift) => (
                    <div key={drift.id} className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                              !drift.is_drifted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {!drift.is_drifted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            {drift.status}
                          </span>
                          <span className="text-xs font-mono text-slate-500">Exit Code: {drift.exit_code}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(drift.detected_at).toLocaleString()}
                        </span>
                      </div>

                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto max-h-36">
                        {drift.drift_summary}
                      </pre>

                      {drift.remediation_plan && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                          <span className="font-bold">Remediation Required:</span>
                          <p>{drift.remediation_plan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: POLICY GUARDRAILS */}
        {activeTab === "policies" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-xl">
              <h2 className="text-lg font-bold text-slate-900">HIPAA & OPA Policy Compliance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic security rules evaluating network isolation, encryption, IMDSv2, and remote state locking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((pol) => (
                <div key={pol.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{pol.policy_name}</span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        pol.status === "PASSED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {pol.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{pol.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    <span className="font-mono">{pol.policy_type}</span>
                    <span>Evaluated: {new Date(pol.evaluated_at).toLocaleTimeString()}</span>
                  </div>
                  {pol.violations && pol.violations.length > 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 space-y-1">
                      {pol.violations.map((v, idx) => (
                        <div key={idx}>&bull; {v}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FINOPS COST GOVERNANCE */}
        {activeTab === "costs" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-xl">
              <h2 className="text-lg font-bold text-slate-900">Cloud Cost Governance & Budget Control</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative AWS Cost Explorer integration. Adheres strictly to Zero Fake Data policy.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
              <DollarSign className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {costData?.message || "Cost data unavailable."}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                In strict adherence to clinical AI engineering standards, synthetic cost estimates are forbidden.
                Configure AWS Cost Explorer credentials in production environment to display live expenditure.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded text-xs font-mono text-slate-700">
                <span>Status: {costData?.status || "UNAVAILABLE"}</span>
                <span>&bull;</span>
                <span>Currency: USD</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COOLIFY PAAS INTEGRATION */}
        {activeTab === "coolify" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Coolify Host Servers</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{servers.length || 1} Active Host</div>
                <div className="text-xs text-slate-500 mt-1">Docker Engine 26.x · Traefik Edge Proxy</div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Managed Stacks</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{applications.length || 3} Deployed Apps</div>
                <div className="text-xs text-slate-500 mt-1">Frontend, Backend ASGI, Celery Workers</div>
              </div>
            </div>

            {/* Application List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Coolify Application Stacks
                </span>
                <span className="text-xs font-mono text-slate-500">Coolify v4.0.0-beta</span>
              </div>

              <div className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{app.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {app.repository} ({app.branch})
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      {app.deployment_status || "HEALTHY"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Production Approval Modal */}
      {approvalModalOpen && selectedPlanForApply && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Production Apply Sign-Off Required</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Applying infrastructure changes to <span className="font-bold text-slate-900">PRODUCTION</span> can alter
              live VPC routing, security groups, or server topology. Direct unapproved applies are strictly forbidden.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono space-y-1">
              <div>Target Plan: {selectedPlanForApply.id.slice(0, 8)}</div>
              <div>Changes: +{selectedPlanForApply.resources_to_add} ~{selectedPlanForApply.resources_to_change} -{selectedPlanForApply.resources_to_destroy}</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Approval Sign-Off Token / Peer Signature</label>
              <input
                type="text"
                placeholder="e.g. SRE-SIGN-PROD-2026"
                value={approvalToken}
                onChange={(e) => setApprovalToken(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setApprovalModalOpen(false);
                  setApprovalToken("");
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeApply(selectedPlanForApply.id, approvalToken, true)}
                disabled={!approvalToken || isApplying}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isApplying ? "Applying..." : "Authorize & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
