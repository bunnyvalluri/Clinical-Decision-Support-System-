"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Activity, ShieldCheck, AlertTriangle, Clock, RefreshCw, FileText, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

export default function AdminBrowserAgentsAuditPage() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/audit/");
      const data = res.data?.results || res.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Browser Agent Audit Ledger (PostgreSQL Immutable Store)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically referenced audit logs tracking all CDP dispatches, approvals, blocks, and verification proofs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/services/agents/browser">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Service Admin
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAuditLogs}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="py-4 px-6 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Immutable Security & Operational Events
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Captures every interaction across Jev Ultrafast runtime and BrowserAgentGateway.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Event ID / Hash</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading audit events from PostgreSQL...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No audit events recorded yet. All agent actions will automatically log here.
                    </td>
                  </tr>
                ) : (
                  events.map((evt, idx) => (
                    <tr key={evt.id || idx} className="hover:bg-slate-50/60 font-mono text-[11px]">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {evt.id ? evt.id.substring(0, 10) : `evt-${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <Badge variant="outline" className="text-[10px] bg-white border-slate-200 font-sans">
                          {evt.event_type || "TASK_EXECUTION"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">
                        {evt.actor || "system-celery"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {evt.destination || "sandbox.healthnova.local"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            evt.outcome === "SUCCESS" || evt.outcome === "ALLOWED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-sans"
                              : evt.outcome === "BLOCKED" || evt.outcome === "DENIED"
                              ? "bg-rose-50 text-rose-700 border-rose-200 font-sans"
                              : "bg-slate-100 text-slate-700 border-slate-200 font-sans"
                          }
                        >
                          {evt.outcome || "RECORDED"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : "Just now"}
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
