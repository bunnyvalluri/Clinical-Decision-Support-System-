"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Play, Zap, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

export default function InformaticistRunsPage() {
  const [runs, setRuns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/tasks/");
      const data = res.data?.results || res.data || [];
      // Flatten or map runs
      setRuns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load runs", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRuns();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex items-center justify-between">
        <Link
          href="/informaticist/ai-agents"
          className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Agents Overview
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRuns}
          className="text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          Refresh Runs
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-4 px-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Browser Automation Run History & Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Immutable ledger of CDP runs, step execution counts, and independent verification verdicts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Goal</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading run history...
                    </td>
                  </tr>
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.task_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {r.task_id.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-700">{r.goal}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {r.runtime_provider || "jev-ultrafast"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            r.status === "COMPLETED" || r.status === "SUCCEEDED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : r.status === "RUNNING"
                              ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {r.verification_status === "PASSED" ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Passed
                          </span>
                        ) : (
                          <span className="text-slate-400">{r.verification_status || "Unverified"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/informaticist/ai-agents/tasks?id=${r.task_id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-200">
                            Replay
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
    </div>
  );
}
