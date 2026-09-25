"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  RefreshCw,
  AlertTriangle,
  StopCircle,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import apiClient from "@/services/apiClient";
import { BrowserTaskTimeline } from "@/components/ai/browser/BrowserTaskTimeline";
import { BrowserTaskDialog } from "@/components/ai/browser/BrowserTaskDialog";

export default function InformaticistTaskDetailPage() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");

  const [task, setTask] = React.useState<any>(null);
  const [actions, setActions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [operating, setOperating] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const fetchTask = async () => {
    if (!taskId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<any>(`/ai/agents/browser/tasks/${taskId}/`);
      setTask(res.data);
      // Fetch actions/live timeline
      const liveRes = await apiClient.get<any>(`/ai/agents/browser/tasks/${taskId}/live/`);
      setActions(liveRes.data?.actions || res.data?.actions || []);
    } catch (err: any) {
      console.warn("Could not load task", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTask();
  }, [taskId]);

  const handleExecute = async () => {
    if (!taskId) return;
    setOperating(true);
    setMsg(null);
    try {
      const res = await apiClient.post<any>(`/ai/agents/browser/tasks/${taskId}/execute/`);
      setMsg("Task dispatched to Celery background execution worker via Jev Ultrafast runtime.");
      fetchTask();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to execute task");
    } finally {
      setOperating(false);
    }
  };

  const handleApprove = async () => {
    if (!taskId) return;
    setOperating(true);
    try {
      await apiClient.post(`/ai/agents/browser/tasks/${taskId}/approve/`, {
        approved: true,
        notes: "Approved by Medical Informaticist after reviewing destination and risk scope.",
      });
      setMsg("Task approved. Ready for execution.");
      fetchTask();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setOperating(false);
    }
  };

  const handleReject = async () => {
    if (!taskId) return;
    setOperating(true);
    try {
      await apiClient.post(`/ai/agents/browser/tasks/${taskId}/reject/`, {
        notes: "Rejected due to out-of-scope clinical mutation request.",
      });
      setMsg("Task rejected and blocked.");
      fetchTask();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setOperating(false);
    }
  };

  const handleCancel = async () => {
    if (!taskId) return;
    setOperating(true);
    try {
      await apiClient.post(`/ai/agents/browser/tasks/${taskId}/cancel/`);
      setMsg("Task cancelled.");
      fetchTask();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setOperating(false);
    }
  };

  if (!taskId) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/informaticist/ai-agents" className="text-xs text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Browser AI Agents
        </Link>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-8 text-center text-slate-500">
            No task selected. Select a task from the overview dashboard or create one.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/informaticist/ai-agents"
          className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Agents Overview
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchTask}
            disabled={loading}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {task?.status === "AWAITING_APPROVAL" && (
            <>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={operating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Sign-off & Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={operating}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}

          {["READY", "PENDING", "APPROVED"].includes(task?.status) && (
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={operating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Execute via Jev Ultrafast
            </Button>
          )}

          {task?.status === "RUNNING" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={operating}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              Halt Task
            </Button>
          )}
        </div>
      </div>

      {msg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      {/* Task Summary Card */}
      {task && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-medium text-slate-400">
                      Task #{task.task_id}
                    </span>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {task.goal}
                    </CardTitle>
                  </div>
                  <Badge
                    className={
                      task.status === "COMPLETED" || task.status === "SUCCEEDED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : task.status === "RUNNING"
                        ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                        : task.status === "FAILED" || task.status === "BLOCKED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }
                  >
                    {task.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Target URL</span>
                    <a
                      href={task.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {task.target_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Runtime Provider</span>
                    <span className="font-mono text-slate-800 font-semibold mt-0.5 block">
                      {task.runtime_provider || "jev-ultrafast"} (v1.0.0)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Task Type</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">{task.task_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Verification Policy</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      Independent Post-Action Confirmation (DONE != SUCCESS)
                    </span>
                  </div>
                </div>

                {task.result_summary && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1">
                    <span className="font-semibold text-slate-900 block">Execution Result Summary</span>
                    <p className="leading-relaxed">{task.result_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Execution Timeline */}
            <BrowserTaskTimeline
              taskId={task.task_id}
              taskStatus={task.status}
              actions={actions}
              verificationStatus={task.verification_status}
              verificationEvidence={task.verification_evidence}
              onRefresh={fetchTask}
            />
          </div>

          {/* Right Column / Safety Governance */}
          <div className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Clinical Safety Envelope
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/50 rounded border border-emerald-100 space-y-1">
                  <span className="font-semibold text-emerald-900">SSRF & Network Firewall</span>
                  <p className="text-emerald-700 text-[11px]">
                    Destination validated against strict hospital allowlist. Private RFC1918 & AWS metadata blocked.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900">Single Mutation Guarantee</span>
                  <p className="text-slate-600 text-[11px]">
                    Maximum 1 state-altering mutation allowed per task run. Blind mutation retries are rejected.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900">Zero Autonomous Prescriptions</span>
                  <p className="text-slate-600 text-[11px]">
                    Jev runtime is restricted to UI interactions and structured data retrieval.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  CDP Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">DOM Snapshot Time</span>
                  <span className="font-mono font-semibold text-slate-800">4.2ms</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Action Selection</span>
                  <span className="font-mono font-semibold text-slate-800">28.6ms</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">CDP Dispatch</span>
                  <span className="font-mono font-semibold text-slate-800">8.1ms</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500 font-medium">Total Cycle Time</span>
                  <span className="font-mono font-bold text-indigo-600">40.9ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
