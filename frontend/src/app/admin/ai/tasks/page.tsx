"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

interface TaskItem {
  id: string;
  workflow_id: string;
  agent_type: string;
  task_type: string;
  priority: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  timeout_seconds: number;
  approval_required: boolean;
  approval_status: string;
  error_code?: string;
  created_by_name: string;
}

export default function AdminAITasksPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = statusFilter === "ALL" ? "/ai/tasks/" : `/ai/tasks/?status=${statusFilter}`;
      const res = await apiClient.get<{ count: number; results: TaskItem[] }>(url);
      setTasks(res.data?.results || []);
    } catch {
      // Keep empty array
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">Running</Badge>;
      case "WAITING_FOR_APPROVAL":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Approval Required</Badge>;
      case "FAILED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Failed</Badge>;
      case "REJECTED":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Link href="/admin/ai" className="hover:text-purple-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          AI Overview
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Task Execution Queue</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-purple-600" />
            Ruflo Agent Task Queue
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative PostgreSQL task states, priority scheduling, and human approval tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isLoading}
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "RUNNING", "WAITING_FOR_APPROVAL", "COMPLETED", "FAILED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === st
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading task queue from PostgreSQL…</div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No agent tasks found matching status filter "{statusFilter}".
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Task ID / Workflow</th>
                  <th className="py-3 px-4">Agent Persona</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900">
                      <div>{task.id.slice(0, 8)}…</div>
                      <div className="text-[10px] text-slate-400 font-mono">wf:{task.workflow_id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-purple-700">{task.agent_type}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{task.task_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-700"
                            : task.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(task.status)}</td>
                    <td className="py-3 px-4">
                      {task.approval_required ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="h-3 w-3" />
                          {task.approval_status}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{task.created_by_name}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(task.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
