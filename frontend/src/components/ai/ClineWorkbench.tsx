"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Play,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

export interface ClineSession {
  id: string;
  role: string;
  agent_type: string;
  purpose: string;
  status: string;
  correlation_id: string;
  environment: string;
  token_budget: number;
  tokens_used: number;
  max_tool_calls: number;
  tool_calls_count: number;
  cost_limit_usd: string;
  total_cost_usd: string;
  created_at: string;
}

export interface ClineTask {
  id: string;
  session: string;
  task_type: string;
  prompt_summary: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_code: string;
  result_summary: string;
  tool_calls_count: number;
  total_cost_usd: string;
  created_at: string;
}

export interface ClineEvent {
  id: string;
  event_type: string;
  tool_name: string;
  summary: string;
  approval_state: string;
  timestamp: string;
}

export interface ClineApproval {
  id: string;
  task: string;
  requested_action: string;
  risk_level: string;
  details: Record<string, any>;
  status: string;
  timestamp: string;
}

interface ClineWorkbenchProps {
  currentRole?: string;
  defaultAgentType?: string;
}

const AGENT_PROFILES = [
  {
    id: "CLINICAL_KNOWLEDGE_ASSISTANT",
    name: "Clinical Knowledge Assistant",
    role: "Clinical",
    description: "Literature-grounded clinical guideline synthesis & protocol verification",
    icon: Activity,
  },
  {
    id: "ML_EXPLAINABILITY_ASSISTANT",
    name: "ML Explainability Assistant",
    role: "Informatics",
    description: "Calibrated patient risk explanation, SHAP attributions, and drift checks",
    icon: Zap,
  },
  {
    id: "DATA_QUALITY_ANALYST",
    name: "Data Quality & MLOps Analyst",
    role: "Informatics",
    description: "Population stability, feature distribution shifts, and dataset health",
    icon: FileText,
  },
  {
    id: "DOCUMENTATION_AGENT",
    name: "Documentation Agent",
    role: "Engineering",
    description: "Automated codebase architecture and guideline reference updates",
    icon: FileText,
  },
  {
    id: "CODE_REVIEWER",
    name: "Code Reviewer & Quality Auditor",
    role: "Engineering",
    description: "Static analysis, security scans, and test coverage evaluation",
    icon: Code2,
  },
  {
    id: "INFRASTRUCTURE_ASSISTANT",
    name: "Coolify Infrastructure Assistant",
    role: "Administration",
    description: "Deployment log diagnostics and staging deployment requests",
    icon: Terminal,
  },
];

export function ClineWorkbench({ currentRole = "DOCTOR", defaultAgentType = "CLINICAL_KNOWLEDGE_ASSISTANT" }: ClineWorkbenchProps) {
  const [sessions, setSessions] = React.useState<ClineSession[]>([]);
  const [activeSession, setActiveSession] = React.useState<ClineSession | null>(null);
  const [selectedAgentType, setSelectedAgentType] = React.useState(defaultAgentType);
  const [prompt, setPrompt] = React.useState("");
  const [tasks, setTasks] = React.useState<ClineTask[]>([]);
  const [events, setEvents] = React.useState<ClineEvent[]>([]);
  const [approvals, setApprovals] = React.useState<ClineApproval[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [killSwitchActive, setKillSwitchActive] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Load initial data
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [sessRes, appRes, ksRes] = await Promise.all([
        apiClient.get<{ results: ClineSession[] }>("/ai/cline/sessions/"),
        apiClient.get<{ results: ClineApproval[] }>("/ai/cline/approvals/"),
        apiClient.get<{ kill_switch_active: boolean }>("/ai/cline/kill-switch/"),
      ]);

      const sessList = sessRes.data.results || [];
      setSessions(sessList);
      setApprovals(appRes.data.results || []);
      setKillSwitchActive(ksRes.data.kill_switch_active || false);

      if (sessList.length > 0 && !activeSession) {
        setActiveSession(sessList[0]);
        loadSessionDetails(sessList[0].id);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load Cline agent state. Backend services may be starting up.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const res = await apiClient.get<{ session: ClineSession; recent_tasks: ClineTask[]; recent_events: ClineEvent[] }>(
        `/ai/cline/sessions/${sessionId}/`
      );
      setActiveSession(res.data.session);
      setTasks(res.data.recent_tasks || []);
      setEvents(res.data.recent_events || []);
    } catch (err) {
      console.error("Failed to load session details", err);
    }
  };

  const handleCreateSession = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ClineSession>("/ai/cline/sessions/", {
        agent_type: selectedAgentType,
        purpose: `Automated ${selectedAgentType.replace(/_/g, " ")} Execution`,
        environment: "DEVELOPMENT",
      });
      setSessions((prev) => [res.data, ...prev]);
      setActiveSession(res.data);
      setTasks([]);
      setEvents([]);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !activeSession) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<ClineTask>("/ai/cline/tasks/", {
        session_id: activeSession.id,
        prompt: prompt.trim(),
        task_type: "CONTROLLED_EXECUTION",
      });
      setTasks((prev) => [res.data, ...prev]);
      setPrompt("");
      // Refresh session details to show new events
      setTimeout(() => loadSessionDetails(activeSession.id), 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Task execution failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalDecision = async (approvalId: string, decision: "APPROVE" | "DENY") => {
    try {
      await apiClient.post("/ai/cline/approvals/decide/", {
        approval_id: approvalId,
        decision,
        reason: decision === "APPROVE" ? "Clinician / Administrator approved action." : "Manual human rejection.",
      });
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      if (activeSession) {
        loadSessionDetails(activeSession.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit approval decision.");
    }
  };

  const handleToggleKillSwitch = async () => {
    try {
      const nextState = !killSwitchActive;
      const res = await apiClient.post<{ kill_switch_active: boolean }>("/ai/cline/kill-switch/", {
        active: nextState,
      });
      setKillSwitchActive(res.data.kill_switch_active);
    } catch (err: any) {
      alert("Only administrators can toggle the emergency kill switch.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
      {/* Header Banner */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Cline Agent Execution Platform</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                v3.42.0 Sandboxed
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Default-Deny
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Policy-bounded AI engineering and clinical intelligence workbench. Zero autonomous clinical authority.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === "ADMIN" && (
            <Button
              size="sm"
              variant={killSwitchActive ? "destructive" : "outline"}
              onClick={handleToggleKillSwitch}
              className={`gap-1.5 text-xs font-semibold ${
                killSwitchActive
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "border-rose-200 text-rose-700 hover:bg-rose-50"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {killSwitchActive ? "Kill Switch ENGAGED" : "Emergency Stop"}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Kill Switch Alert Banner */}
      {killSwitchActive && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>GLOBAL AI KILL SWITCH IS ACTIVE: All new agent sessions and task executions are suspended.</span>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Sidebar: Session & Profile Controls */}
        <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/30 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Select Agent Profile
            </label>
            <div className="space-y-1.5">
              {AGENT_PROFILES.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedAgentType === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedAgentType(p.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 text-blue-900 shadow-xs font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-tight line-clamp-2">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleCreateSession}
            disabled={isSubmitting || killSwitchActive}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            Start New Agent Session
          </Button>

          {/* Active Sessions List */}
          <div className="flex-1 min-h-0 pt-2 border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Your Sessions ({sessions.length})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSessionDetails(s.id)}
                  className={`w-full text-left p-2 rounded-md border text-xs flex items-center justify-between ${
                    activeSession?.id === s.id
                      ? "bg-slate-100 border-slate-400 font-medium text-slate-900"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate font-semibold">{s.agent_type.replace(/_/g, " ")}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {s.correlation_id.slice(-10)} · {s.status}
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    ${parseFloat(s.total_cost_usd || "0").toFixed(3)}
                  </span>
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">No active sessions. Create one above.</div>
              )}
            </div>
          </div>

          {/* Budget Display */}
          {activeSession && (
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Tokens Used:</span>
                <span className="font-semibold text-slate-900">
                  {activeSession.tokens_used.toLocaleString()} / {activeSession.token_budget.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tool Invocations:</span>
                <span className="font-semibold text-slate-900">
                  {activeSession.tool_calls_count} / {activeSession.max_tool_calls}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Cost:</span>
                <span className="font-semibold text-slate-900">${activeSession.total_cost_usd}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Main Console: Tasks, Approvals & Live Events */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Pending Approvals Section */}
          {approvals.length > 0 && (
            <div className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Shield className="h-4 w-4 text-amber-600" />
                <span>Pending Human-in-the-Loop Tool Approvals ({approvals.length})</span>
              </div>
              <div className="space-y-2">
                {approvals.map((app) => (
                  <div
                    key={app.id}
                    className="p-2.5 rounded-lg bg-white border border-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{app.requested_action}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {app.risk_level} RISK
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {JSON.stringify(app.details)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleApprovalDecision(app.id, "APPROVE")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalDecision(app.id, "DENY")}
                        className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs h-7 px-2.5"
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline & Output Events Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Execution Event Stream</span>
              <span className="text-[11px] text-slate-400 font-normal">Real-time Safe Summaries · Zero PHI</span>
            </div>

            {events.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Bot className="h-8 w-8 text-slate-300" />
                <p>No execution events recorded yet. Submit a prompt below to trigger the Cline agent.</p>
              </div>
            )}

            <div className="space-y-2">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white text-xs flex items-start gap-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="mt-0.5">
                    {evt.event_type.includes("error") ? (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    ) : evt.event_type.includes("tool") ? (
                      <Terminal className="h-4 w-4 text-blue-500" />
                    ) : evt.event_type.includes("completed") ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 text-[11px] font-mono uppercase">
                        {evt.event_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{evt.summary}</p>
                    {evt.tool_name && (
                      <div className="mt-1 text-[11px] text-blue-600 font-mono bg-blue-50/60 inline-block px-1.5 py-0.5 rounded border border-blue-200">
                        Tool: {evt.tool_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Dispatch Bar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/60">
            {errorMsg && (
              <div className="mb-2 p-2 rounded text-xs bg-rose-50 border border-rose-200 text-rose-700">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmitTask} className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeSession
                    ? `Instruct ${activeSession.agent_type.replace(/_/g, " ")} (e.g. 'Retrieve latest sepsis guidelines')...`
                    : "Create or select an agent session first..."
                }
                disabled={!activeSession || isSubmitting || killSwitchActive}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!prompt.trim() || !activeSession || isSubmitting || killSwitchActive}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Dispatch
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
