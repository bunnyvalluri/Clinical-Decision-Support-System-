"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileCode,
  Layers,
  Play,
  RefreshCw,
  Share2,
  Upload,
} from "lucide-react";
import { InteroperabilityService } from "@/services/interoperability/InteroperabilityService";
import type {
  FHIRExportJobItem,
  IntegrationConnectionItem,
} from "@/services/interoperability/InteroperabilityTypes";

export default function InformaticistExportsPage() {
  const [jobs, setJobs] = React.useState<FHIRExportJobItem[]>([]);
  const [connections, setConnections] = React.useState<IntegrationConnectionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [triggering, setTriggering] = React.useState(false);
  const [selectedConnection, setSelectedConnection] = React.useState<string>("");
  const [resourceType, setResourceType] = React.useState<string>("Patient");
  const [patientId, setPatientId] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [jRes, cRes] = await Promise.all([
        InteroperabilityService.fetchExportJobs(),
        InteroperabilityService.fetchConnections(),
      ]);
      setJobs(jRes.results || []);
      setConnections(cRes.results || []);
      if (cRes.results?.length > 0 && !selectedConnection) {
        setSelectedConnection(cRes.results[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load export jobs.");
    } finally {
      setLoading(false);
    }
  }, [selectedConnection]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTriggerExport = async () => {
    if (!selectedConnection) return;
    try {
      setTriggering(true);
      setSuccessMsg(null);
      setError(null);
      const res = await InteroperabilityService.triggerExport(
        selectedConnection,
        resourceType,
        patientId || undefined
      );
      setSuccessMsg(`Outbound export job ${res.id} completed successfully (${res.exported_records} record(s)).`);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to execute export job.");
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/informaticist/interoperability" className="text-xs font-semibold text-amber-800 hover:underline">
              ← Interoperability Hub
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600">Outbound Exports</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Outbound FHIR Exports & Data Sharing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Export standards-compliant FHIR R4 Patient charts, Observation panels, and CDSS RiskAssessments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {connections.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="Patient">Patient Resource</option>
                <option value="Bundle">Patient $everything Bundle</option>
              </select>

              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Patient UUID..."
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 w-36 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />

              <button
                onClick={handleTriggerExport}
                disabled={triggering || !selectedConnection}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className={`h-3.5 w-3.5 ${triggering ? "animate-spin" : ""}`} />
                {triggering ? "Exporting..." : "Export"}
              </button>
            </div>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-emerald-800">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="p-12 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <Share2 className="h-10 w-10 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No outbound exports executed yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Outbound export history tracks all data exchanged with authorized external hospital systems.
          </p>
        </div>
      )}

      {/* Jobs Table */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Job ID</th>
                  <th className="py-3 px-4 font-semibold">Destination</th>
                  <th className="py-3 px-4 font-semibold">Resource Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Exported Records</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Exported At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 font-bold">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {job.connection_name || "Direct API Client"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      {job.resource_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-emerald-700">{job.exported_records}</strong> record(s)
                      {job.failed_records > 0 && (
                        <span className="text-rose-600 font-semibold ml-1">({job.failed_records} failed)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {job.duration_ms} ms
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {job.completed_at ? new Date(job.completed_at).toLocaleString() : "Processing"}
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
