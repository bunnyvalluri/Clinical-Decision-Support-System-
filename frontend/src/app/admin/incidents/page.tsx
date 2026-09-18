"use client";

import * as React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface IncidentItem {
  id: string;
  title: string;
  severity: string;
  service: string;
  environment: string;
  state: string;
  owner: string;
  started_at: string;
  resolved_at?: string;
  correlation_id: string;
  resolution_summary?: string;
  timeline_count: number;
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState("");
  const [newSeverity, setNewSeverity] = React.useState("SEV3_MEDIUM");
  const [newService, setNewService] = React.useState("core-asgi");
  const [showModal, setShowModal] = React.useState(false);

  const fetchIncidents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/observability/incidents/", { headers });
      if (res.ok) {
        const json = await res.json();
        setIncidents(json.data || []);
      } else {
        setIncidents([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load incident history.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch("/api/v1/observability/incidents/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: newTitle,
          severity: newSeverity,
          service: newService,
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setShowModal(false);
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransition = async (id: string, newState: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      await fetch(`/api/v1/observability/incidents/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          state: newState,
          note: `Operator updated state to ${newState}.`,
        }),
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              Reliability Engineering
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-rose-600">Incident Command</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operational Incident Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit-governed state machine: DETECTED → ACKNOWLEDGED → INVESTIGATING → MITIGATING → RESOLVED → POSTMORTEM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Declare Incident
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchIncidents()}
            disabled={loading}
            className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {showModal && (
        <Card className="border border-slate-200 bg-white shadow-md p-5 max-w-lg">
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Declare New Incident</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Incident Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Neon PostgreSQL Connection Saturation"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value="SEV1_CRITICAL">SEV1 — Critical Outage</option>
                  <option value="SEV2_HIGH">SEV2 — Major Degradation</option>
                  <option value="SEV3_MEDIUM">SEV3 — Partial Impact</option>
                  <option value="SEV4_LOW">SEV4 — Minor / Advisory</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Affected Service</label>
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-rose-600 text-white hover:bg-rose-700 text-xs">
                Submit Declaration
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Incidents Table */}
      <Card className="border border-slate-200 bg-white shadow-2xs">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Active & Historical Incidents ({incidents.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Strictly reflects genuine incident entries recorded in the operational database.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Incident ID</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Title & Service</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Correlation ID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length > 0 ? (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{inc.id}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={
                            inc.severity === "SEV1_CRITICAL"
                              ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                              : inc.severity === "SEV2_HIGH"
                              ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{inc.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inc.service}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200">
                          {inc.state}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                        {inc.correlation_id ? inc.correlation_id.substring(0, 8) + "..." : "N/A"}
                      </td>
                      <td className="px-5 py-3 text-right space-x-1.5">
                        {inc.state === "DETECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransition(inc.id, "ACKNOWLEDGED")}
                            className="text-[11px] h-7 px-2"
                          >
                            Acknowledge
                          </Button>
                        )}
                        {inc.state === "ACKNOWLEDGED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransition(inc.id, "INVESTIGATING")}
                            className="text-[11px] h-7 px-2"
                          >
                            Investigate
                          </Button>
                        )}
                        {inc.state === "INVESTIGATING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransition(inc.id, "MITIGATING")}
                            className="text-[11px] h-7 px-2"
                          >
                            Mitigate
                          </Button>
                        )}
                        {inc.state === "MITIGATING" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleTransition(inc.id, "RESOLVED")}
                            className="text-[11px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Zero operational incidents logged. System is performing within healthy limits.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
