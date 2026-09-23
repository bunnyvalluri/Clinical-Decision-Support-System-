"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  Lock,
  Play,
  Plus,
  Power,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TaskState =
  | "PENDING"
  | "VALIDATING"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "RUNNING"
  | "VERIFYING"
  | "SUCCEEDED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "REQUIRES_HUMAN_ACTION";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface BrowserTask {
  id: string;
  requested_by: number;
  requested_by_email: string;
  role: string;
  goal: string;
  destination_url: string;
  destination_domain: string;
  environment: string;
  risk_level: RiskLevel;
  phi_classification: string;
  approval_status: string;
  approved_by_email?: string;
  approved_at?: string;
  rejection_reason?: string;
  execution_status: TaskState;
  verification_status: "UNVERIFIED" | "PASSED" | "FAILED";
  failure_reason?: string;
  audit_reference: string;
  independent_verification_rules?: Record<string, any>;
  steps_log?: Array<{
    step_index: number;
    tool: string;
    action: string;
    target: string;
    value?: string;
    is_mutation: boolean;
    status: string;
    elapsed_ms: number;
    timestamp: string;
  }>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface DestinationItem {
  id: string;
  domain: string;
  purpose: string;
  environment: string;
  owner: string;
  allowed_operations: string[];
  phi_allowed: boolean;
  authentication_required: boolean;
  is_active: boolean;
}

interface ToolItem {
  tool_id: string;
  name: string;
  description: string;
  allowed_roles: string[];
  risk_level: string;
  phi_classification: string;
  rate_limit: string;
  timeout: number;
  is_enabled: boolean;
}

interface AgentHealthData {
  status: "CONNECTED" | "READY" | "BUSY" | "DEGRADED" | "UNAVAILABLE" | "DISABLED" | "UNKNOWN";
  details: string;
  runtime_type: string;
  apple_silicon_available: boolean;
  remote_service_available: boolean;
  total_tasks_count: number;
  verification_pass_rate_pct: number;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
// Badge Styling (Strict White/Light Theme)
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskState, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  VALIDATING: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  AWAITING_APPROVAL: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  APPROVED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  RUNNING: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  VERIFYING: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-300" },
  SUCCEEDED: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  FAILED: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" },
  BLOCKED: { bg: "bg-red-50", text: "text-red-800", border: "border-red-300" },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
  TIMED_OUT: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-300" },
  REQUIRES_HUMAN_ACTION: { bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-400" },
};

const RISK_BADGES: Record<RiskLevel, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-rose-50 text-rose-800 border-rose-300",
};

export default function AdminAIAgentsPage() {
  const [activeTab, setActiveTab] = React.useState<"TASKS" | "APPROVALS" | "DESTINATIONS" | "TOOLS">("TASKS");
  const [tasks, setTasks] = React.useState<BrowserTask[]>([]);
  const [destinations, setDestinations] = React.useState<DestinationItem[]>([]);
  const [tools, setTools] = React.useState<ToolItem[]>([]);
  const [health, setHealth] = React.useState<AgentHealthData | null>(null);
  const [killSwitchActive, setKillSwitchActive] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [wsConnected, setWsConnected] = React.useState<boolean>(false);

  // Filter state
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals
  const [selectedTask, setSelectedTask] = React.useState<BrowserTask | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = React.useState<boolean>(false);
  const [approvalModalTask, setApprovalModalTask] = React.useState<BrowserTask | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState<string>("");

  // New task form fields
  const [newGoal, setNewGoal] = React.useState<string>("");
  const [newUrl, setNewUrl] = React.useState<string>("");
  const [newPhi, setNewPhi] = React.useState<string>("PUBLIC");
  const [formSubmitting, setFormSubmitting] = React.useState<boolean>(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // ── Fetch Health & Kill Switch ────────────────────────────────
  const fetchHealthAndKillSwitch = React.useCallback(async () => {
    try {
      const [healthRes, killRes] = await Promise.allSettled([
        apiClient.get<AgentHealthData>("/ai-agents/browser/health/"),
        apiClient.get<{ is_active: boolean }>("/ai-agents/browser/kill-switch/"),
      ]);
      if (healthRes.status === "fulfilled" && healthRes.value.data) {
        setHealth(healthRes.value.data);
      }
      if (killRes.status === "fulfilled" && killRes.value.data) {
        setKillSwitchActive(killRes.value.data.is_active);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // ── Fetch Tasks ───────────────────────────────────────────────
  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await apiClient.get<{ count: number; results: BrowserTask[] }>(`/ai-agents/browser/tasks/${query}`);
      setTasks(res.data?.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load browser agent tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // ── Fetch Destinations & Tools ────────────────────────────────
  const fetchDestinationsAndTools = React.useCallback(async () => {
    try {
      const [destRes, toolsRes] = await Promise.allSettled([
        apiClient.get<DestinationItem[]>("/ai-agents/browser/destinations/"),
        apiClient.get<{ count: number; tools: ToolItem[] }>("/ai-agents/browser/tools/"),
      ]);
      if (destRes.status === "fulfilled" && destRes.value.data) {
        setDestinations(destRes.value.data);
      }
      if (toolsRes.status === "fulfilled" && toolsRes.value.data?.tools) {
        setTools(toolsRes.value.data.tools);
      }
    } catch {
      // Keep empty
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchHealthAndKillSwitch();
    fetchTasks();
    fetchDestinationsAndTools();
  }, [fetchHealthAndKillSwitch, fetchTasks, fetchDestinationsAndTools]);

  // ── WebSocket Realtime Streaming ──────────────────────────────
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/ai-agents/tasks/`;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setWsConnected(true);
      socket.onclose = () => setWsConnected(false);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.task_id) {
            // Re-fetch tasks silently when a lifecycle event arrives
            fetchTasks();
            fetchHealthAndKillSwitch();
          }
        } catch {
          // ignore non-json
        }
      };
    } catch {
      setWsConnected(false);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [fetchTasks, fetchHealthAndKillSwitch]);

  // ── Submit New Task ───────────────────────────────────────────
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !newUrl.trim()) {
      setFormError("Goal and Destination URL are mandatory.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post("/ai-agents/browser/tasks/", {
        goal: newGoal.trim(),
        destination_url: newUrl.trim(),
        phi_classification: newPhi,
      });
      setShowNewTaskDialog(false);
      setNewGoal("");
      setNewUrl("");
      fetchTasks();
      fetchHealthAndKillSwitch();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.response?.data?.failure_reason || "Task creation rejected by Safety Gateway.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Approve Task ──────────────────────────────────────────────
  const handleApprove = async (taskId: string) => {
    try {
      await apiClient.post(`/ai-agents/browser/tasks/${taskId}/approve/`);
      setApprovalModalTask(null);
      fetchTasks();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Approval failed.");
    }
  };

  // ── Reject Task ───────────────────────────────────────────────
  const handleReject = async (taskId: string) => {
    if (!rejectionReason.trim()) {
      alert("Documented rejection rationale is mandatory.");
      return;
    }
    try {
      await apiClient.post(`/ai-agents/browser/tasks/${taskId}/reject/`, {
        reason: rejectionReason.trim(),
      });
      setApprovalModalTask(null);
      setRejectionReason("");
      fetchTasks();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Rejection failed.");
    }
  };

  // ── Toggle Kill Switch ────────────────────────────────────────
  const handleToggleKillSwitch = async () => {
    const actionName = killSwitchActive ? "DEACTIVATE" : "ACTIVATE";
    const confirmed = confirm(
      `Are you sure you want to ${actionName} the Browser Agent Emergency Kill Switch? When active, all agent executions are instantly blocked.`
    );
    if (!confirmed) return;

    try {
      const res = await apiClient.post<{ is_active: boolean }>("/ai-agents/browser/kill-switch/", {
        is_active: !killSwitchActive,
        reason: killSwitchActive ? "Administrative resume" : "Manual emergency override",
      });
      setKillSwitchActive(res.data.is_active);
      fetchHealthAndKillSwitch();
      fetchTasks();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to toggle kill switch.");
    }
  };

  // Filtered tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination_domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, searchQuery]);

  const pendingApprovalsCount = React.useMemo(() => {
    return tasks.filter((t) => t.execution_status === "AWAITING_APPROVAL").length;
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Controlled Browser Agent Console</h1>
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 text-xs">
                  Laya Ultrafast v0.1.0
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Non-clinical browser automation governed by HealthNova Agent Safety Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime WebSocket indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                wsConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {wsConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{wsConnected ? "Realtime Live" : "Polling"}</span>
            </div>

            {/* Emergency Kill Switch Button */}
            <Button
              variant={killSwitchActive ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleKillSwitch}
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                killSwitchActive
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "border-rose-300 text-rose-700 hover:bg-rose-50"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{killSwitchActive ? "KILL SWITCH ACTIVE" : "EMERGENCY KILL SWITCH"}</span>
            </Button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchTasks();
                fetchHealthAndKillSwitch();
              }}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>

            {/* New Task Button */}
            <Button
              size="sm"
              onClick={() => setShowNewTaskDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Browser Task
            </Button>
          </div>
        </div>
      </header>

      {/* ── Kill Switch Banner ───────────────────────────────────── */}
      {killSwitchActive && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>AGENT EXECUTION DISABLED:</strong> The emergency kill switch is currently active. All outbound
              browser tasks are blocked immediately at the Safety Gateway.
            </span>
          </div>
        </div>
      )}

      {/* ── Main Content Container ───────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Diagnostic Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Runtime Status */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 flex items-center justify-between">
                <span>Agent Runtime Status</span>
                <Shield className="w-4 h-4 text-slate-400" />
              </CardDescription>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    health?.status === "READY" || health?.status === "CONNECTED"
                      ? "bg-emerald-500 animate-pulse"
                      : health?.status === "DISABLED"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                />
                {health?.status || "INITIALIZING"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 truncate" title={health?.details}>
                {health?.details || "Checking runtime..."}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Controlled Tasks */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 flex items-center justify-between">
                <span>Total Executions</span>
                <Terminal className="w-4 h-4 text-slate-400" />
              </CardDescription>
              <CardTitle className="text-lg font-bold text-slate-900">
                {health?.total_tasks_count ?? tasks.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Recorded in Neon PostgreSQL</p>
            </CardContent>
          </Card>

          {/* Card 3: Verification Pass Rate */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 flex items-center justify-between">
                <span>Verification Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-lg font-bold text-slate-900">
                {health?.verification_pass_rate_pct ?? 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Independent post-condition audit</p>
            </CardContent>
          </Card>

          {/* Card 4: Human Approvals Queue */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 flex items-center justify-between">
                <span>Pending Approvals</span>
                <UserCheck className="w-4 h-4 text-amber-600" />
              </CardDescription>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{pendingApprovalsCount}</span>
                {pendingApprovalsCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">Action Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Human clinician / admin review gate</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Navigation Tabs ──────────────────────────────────────── */}
        <div className="border-b border-slate-200 flex items-center justify-between">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("TASKS")}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                activeTab === "TASKS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Task Queue ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("APPROVALS")}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                activeTab === "APPROVALS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Approval Queue
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("DESTINATIONS")}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                activeTab === "DESTINATIONS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-4 h-4" />
              Approved Destinations ({destinations.length})
            </button>
            <button
              onClick={() => setActiveTab("TOOLS")}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                activeTab === "TOOLS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Controlled Tool Registry ({tools.length})
            </button>
          </nav>
        </div>

        {/* ── TAB 1: Task Queue ────────────────────────────────────── */}
        {activeTab === "TASKS" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by goal, domain, or task ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 w-64"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="RUNNING">Running</option>
                  <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                  <option value="SUCCEEDED">Succeeded</option>
                  <option value="FAILED">Failed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            {/* Task Table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading browser agent tasks from Neon PostgreSQL...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <Terminal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No browser agent tasks match current criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Task ID / Date</th>
                        <th className="px-4 py-3">Destination</th>
                        <th className="px-4 py-3">Goal</th>
                        <th className="px-4 py-3">Risk Tier</th>
                        <th className="px-4 py-3">Execution State</th>
                        <th className="px-4 py-3">Independent Verification</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTasks.map((task) => {
                        const stateCfg = STATUS_CONFIG[task.execution_status] || STATUS_CONFIG.PENDING;
                        return (
                          <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                              <div>{task.id.slice(0, 8)}...</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(task.created_at).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900 flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {task.destination_domain}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                                {task.destination_url}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[260px]">
                              <p className="line-clamp-2 text-slate-800 font-medium">{task.goal}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  RISK_BADGES[task.risk_level] || RISK_BADGES.LOW
                                }`}
                              >
                                {task.risk_level}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateCfg.bg} ${stateCfg.text} ${stateCfg.border}`}
                              >
                                {task.execution_status}
                              </span>
                              {task.failure_reason && (
                                <span
                                  className="text-[10px] text-rose-600 block mt-0.5 truncate max-w-[160px]"
                                  title={task.failure_reason}
                                >
                                  {task.failure_reason}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {task.verification_status === "PASSED" ? (
                                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  PASSED
                                </Badge>
                              ) : task.verification_status === "FAILED" ? (
                                <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  FAILED
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Unverified</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {task.execution_status === "AWAITING_APPROVAL" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setApprovalModalTask(task)}
                                    className="text-xs h-7 border-amber-300 text-amber-800 hover:bg-amber-50"
                                  >
                                    Review
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedTask(task)}
                                  className="text-xs h-7 text-slate-600 hover:text-slate-900"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Trace
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Approvals Queue ───────────────────────────────── */}
        {activeTab === "APPROVALS" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Human-in-the-Loop Gate:</strong> High-risk operations (such as mutations or authenticated
                external portal interactions) are halted here until verified and authorized by a physician or system administrator.
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              {tasks.filter((t) => t.execution_status === "AWAITING_APPROVAL").length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No pending browser tasks require human review at this time.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tasks
                    .filter((t) => t.execution_status === "AWAITING_APPROVAL")
                    .map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.destination_domain}</span>
                            <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">
                              {item.risk_level}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">ID: {item.id.slice(0, 8)}</span>
                          </div>
                          <p className="text-xs text-slate-800">{item.goal}</p>
                          <p className="text-[11px] text-slate-500">
                            Requested by: <strong>{item.requested_by_email}</strong> ({item.role})
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setApprovalModalTask(item)}
                            className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs h-8"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: Approved Destinations ─────────────────────────── */}
        {activeTab === "DESTINATIONS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Destination Allowlist</h3>
                <p className="text-xs text-slate-500">
                  Strict domain boundary. Unlisted or private network destinations are blocked by default.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Allowed Operations</th>
                    <th className="px-4 py-3">PHI Allowed</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {destinations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        {d.domain}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[300px]">{d.purpose}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {d.allowed_operations?.join(", ") || "NAVIGATE, READ"}
                      </td>
                      <td className="px-4 py-3">
                        {d.phi_allowed ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                            PERMITTED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">
                            DENIED
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: Controlled Tool Registry ──────────────────────── */}
        {activeTab === "TOOLS" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Controlled Browser Tool Registry</h3>
              <p className="text-xs text-slate-500">
                Only these explicitly declared and audited tools can be invoked during browser execution. Arbitrary code
                execution is strictly prohibited.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((tool) => (
                <Card key={tool.tool_id} className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        {tool.tool_id}
                      </CardTitle>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${RISK_BADGES[tool.risk_level as RiskLevel] || RISK_BADGES.LOW}`}>
                        {tool.risk_level}
                      </span>
                    </div>
                    <CardDescription className="text-xs text-slate-700 font-medium">
                      {tool.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="text-slate-600">{tool.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>Timeout: <strong>{tool.timeout}s</strong></span>
                      <span>Rate Limit: <strong>{tool.rate_limit}</strong></span>
                      <span>Roles: <strong>{tool.allowed_roles?.join(", ")}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Modal: Task Detail & Step Trace ──────────────────────── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  Task Execution Trace: {selectedTask.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">{selectedTask.destination_domain}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-900">Goal:</span>
                <p className="text-slate-700">{selectedTask.goal}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2">
                  <span>Audit Ref: <strong>{selectedTask.audit_reference}</strong></span>
                  <span>Verification: <strong>{selectedTask.verification_status}</strong></span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Step Execution Log</h4>
                {!selectedTask.steps_log || selectedTask.steps_log.length === 0 ? (
                  <p className="text-slate-400 italic">No execution steps recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTask.steps_log.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded border border-slate-200 bg-white font-mono text-[11px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold">#{step.step_index}</span>
                          <span className="font-semibold text-blue-700">{step.tool}</span>
                          <span className="text-slate-600">[{step.action}]</span>
                          <span className="text-slate-500 truncate max-w-[200px]">{step.target}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{step.elapsed_ms}ms</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedTask(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: New Task Submission ───────────────────────────── */}
      {showNewTaskDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit Controlled Browser Task</h3>
                <p className="text-xs text-slate-500">Evaluated immediately by Agent Safety Gateway</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowNewTaskDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-4 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Destination URL (Allowlisted Domain)</label>
                <input
                  type="url"
                  placeholder="https://who.int/emergencies/disease-outbreak-news"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be one of the approved domains: who.int, cdc.gov, nih.gov.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Natural Language Goal</label>
                <textarea
                  rows={3}
                  placeholder="Verify latest clinical advisory regarding respiratory syncytial virus."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Data Classification</label>
                <select
                  value={newPhi}
                  onChange={(e) => setNewPhi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PUBLIC">PUBLIC (Non-sensitive)</option>
                  <option value="LOW_SENSITIVITY">LOW_SENSITIVITY</option>
                  <option value="PHI">PHI (Requires explicit authorization)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewTaskDialog(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={formSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  {formSubmitting ? "Validating..." : "Submit Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Rejection Reason ──────────────────────────────── */}
      {approvalModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-4 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Reject Browser Task</h3>
            <p className="text-slate-600">
              Please enter the clinical or security rationale for rejecting task {approvalModalTask.id.slice(0, 8)}.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Action unnecessary or target unverified."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setApprovalModalTask(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleReject(approvalModalTask.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
