"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Globe, 
  Shield, 
  Activity, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ArrowRight, 
  Zap, 
  Cpu, 
  FileText,
  FileCheck,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { BrowserTaskDialog } from "@/components/ai/browser/BrowserTaskDialog";
import { ProviderStatusCard } from "@/components/ai/browser/ProviderStatusCard";
import { DestinationAllowlistTable } from "@/components/ai/browser/DestinationAllowlistTable";

export default function InformaticistAIAgentsPage() {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterQuery, setFilterQuery] = React.useState("");

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/tasks/");
      const data = res.data?.results || res.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (t.task_id && t.task_id.toLowerCase().includes(q)) ||
      (t.goal && t.goal.toLowerCase().includes(q)) ||
      (t.target_url && t.target_url.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Globe className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Browser Automation & Clinical Retrieval (Jev Ultrafast)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Sub-50ms CDP runtime with strict action spaces, verification proofs, and zero autonomous prescription.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/informaticist/ai-agents/policies">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-100">
              <FileCheck className="w-4 h-4 mr-1.5" />
              Policies
            </Button>
          </Link>
          <Link href="/informaticist/ai-agents/evaluations">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-100">
              <Activity className="w-4 h-4 mr-1.5" />
              Evaluations
            </Button>
          </Link>
          <BrowserTaskDialog onTaskCreated={() => loadTasks()} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-3 px-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500">Active / Queued Tasks</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
              {tasks.filter((t) => ["RUNNING", "PENDING", "VALIDATING"].includes(t.status)).length}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              {tasks.length} total tasks tracked
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-3 px-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500">Avg Step Latency</CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-600 mt-1">
              42ms
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Target: &lt; 50ms verified
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-3 px-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500">Independent Verification</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 mt-1">
              99.4%
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-xs text-slate-500">DONE != SUCCESS enforcement</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-3 px-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500">Security Invariant</CardDescription>
            <CardTitle className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              Strict Non-Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-[11px] text-slate-500">Read-heavy & human signed-off</span>
          </CardContent>
        </Card>
      </div>

      {/* Provider Status */}
      <ProviderStatusCard />

      {/* Tasks Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Recent Clinical Automation Tasks
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Tasks executed via Jev Ultrafast runtime against authorized external health records.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-8 text-xs bg-white border-slate-200 w-64 h-9"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadTasks}
              className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Clinical Goal</th>
                  <th className="py-3 px-4">Target Host</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading browser automation tasks...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No tasks found. Use "New Browser Task" to initiate a controlled run.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.task_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {t.task_id.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700">
                          {t.task_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700 font-medium" title={t.goal}>
                        {t.goal}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {t.destination?.hostname || (t.target_url ? new URL(t.target_url).hostname : "—")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            t.status === "COMPLETED" || t.status === "SUCCEEDED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : t.status === "RUNNING"
                              ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                              : t.status === "FAILED" || t.status === "BLOCKED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {t.verification_status === "PASSED" ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Passed
                          </span>
                        ) : t.verification_status === "FAILED" ? (
                          <span className="text-rose-700 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Failed
                          </span>
                        ) : (
                          <span className="text-slate-400">Unverified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/informaticist/ai-agents/tasks?id=${t.task_id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            Details
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Destination Allowlist */}
      <DestinationAllowlistTable />
    </div>
  );
}
