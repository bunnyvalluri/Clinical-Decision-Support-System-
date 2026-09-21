"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileCode,
  FileText,
  GitBranch,
  Layers,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { InteroperabilityService } from "@/services/interoperability/InteroperabilityService";
import type {
  FHIRResourceBoundaryItem,
  IntegrationHealthStatus,
  InteroperabilityDashboardMetrics,
} from "@/services/interoperability/InteroperabilityTypes";

export default function InformaticistInteroperabilityDashboard() {
  const [metrics, setMetrics] = React.useState<InteroperabilityDashboardMetrics | null>(null);
  const [boundaryMatrix, setBoundaryMatrix] = React.useState<FHIRResourceBoundaryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mRes, bRes] = await Promise.all([
        InteroperabilityService.fetchDashboardMetrics(),
        InteroperabilityService.fetchBoundaryMatrix(),
      ]);
      setMetrics(mRes);
      setBoundaryMatrix(bRes.resources || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load interoperability telemetry from backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const getHealthBadge = (health: IntegrationHealthStatus) => {
    switch (health) {
      case "CONNECTED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "CONNECTED (VERIFIED)",
        };
      case "DEGRADED":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: AlertTriangle,
          label: "DEGRADED (PARTIAL)",
        };
      case "OFFLINE":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertOctagon,
          label: "OFFLINE",
        };
      case "AUTHENTICATION_FAILED":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: AlertOctagon,
          label: "AUTHENTICATION FAILED",
        };
      case "NOT_CONFIGURED":
        return {
          bg: "bg-slate-50 text-slate-600 border-slate-200",
          icon: Clock,
          label: "NOT CONFIGURED",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-600 border-slate-200",
          icon: Clock,
          label: health,
        };
    }
  };

  const getResourceStatusBadge = (status: string) => {
    switch (status) {
      case "SUPPORTED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PARTIALLY_SUPPORTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PLANNED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
              Clinical Informatics Hub
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Network className="h-3 w-3" />
              HL7 FHIR R4 (v4.0.1)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Neon Authoritative Store
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Healthcare Interoperability & Data Quality
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Monitor incoming EHR feeds, LOINC mapping fidelity, patient reconciliation, and cryptographic provenance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { label: "Dashboard", href: "/informaticist/interoperability", active: true },
          { label: "Connections", href: "/informaticist/interoperability/connections" },
          { label: "Imports", href: "/informaticist/interoperability/imports" },
          { label: "Exports", href: "/informaticist/interoperability/exports" },
          { label: "Mappings", href: "/informaticist/interoperability/mappings" },
          { label: "Reconciliation Queue", href: "/informaticist/interoperability/reconciliation" },
          { label: "Provenance", href: "/informaticist/interoperability/provenance" },
          { label: "Audit Ledger", href: "/informaticist/interoperability/audit" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              tab.active
                ? "border-amber-600 text-amber-900 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-900">Interoperability Telemetry Error</h3>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State Banner if no data */}
      {metrics && !metrics.has_data && (
        <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-500">
            <Layers className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            {metrics.empty_message || "No interoperability data available yet."}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Connect an external EHR system or trigger a sample FHIR import to begin monitoring clinical data exchange.
          </p>
          <div className="pt-2">
            <Link
              href="/informaticist/interoperability/connections"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Configure Integration Connection
            </Link>
          </div>
        </div>
      )}

      {/* Real Metric Cards (Section 21) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resources Imported */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resources Imported</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "..." : metrics?.resources_imported ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Successfully stored in Neon PostgreSQL</p>
        </div>

        {/* Resources Rejected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resources Rejected</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "..." : metrics?.resources_rejected ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Failed schema or physiological checks</p>
        </div>

        {/* Validation & Mapping Failures */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Validation Failures</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <FileCode className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "..." : metrics?.validation_failures ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mapping failures: {loading ? "..." : metrics?.mapping_failures ?? 0}
          </p>
        </div>

        {/* Pending Reviews / Reconciliation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Reviews</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "..." : metrics?.pending_reviews ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Duplicate/ambiguous matches in queue
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Duplicates & Ambiguous Matches */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Patient Identity Reconciliations</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {loading ? "..." : metrics?.duplicate_resources ?? 0}
            </span>
            <span className="text-xs text-slate-500">duplicates detected</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ambiguous matches (&lt;100% confidence): {loading ? "..." : metrics?.ambiguous_patient_matches ?? 0}
          </p>
        </div>

        {/* Export Telemetry */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">FHIR Export Outbound Status</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">
              {loading ? "..." : metrics?.successful_exports ?? 0}
            </span>
            <span className="text-xs text-slate-500">successful</span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xl font-bold text-rose-700">
              {loading ? "..." : metrics?.failed_exports ?? 0}
            </span>
            <span className="text-xs text-slate-500">failed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Outbound SMART-on-FHIR exports</p>
        </div>

        {/* Verified Integration Health (Section 22) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Integration Health (Backend Verified)</span>
          <div className="mt-2 flex items-center gap-2">
            {metrics ? (
              (() => {
                const badge = getHealthBadge(metrics.overall_integration_health);
                const Icon = badge.icon;
                return (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </span>
                );
              })()
            ) : (
              <span className="text-xs text-slate-400">Loading health...</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics?.total_connections ?? 0} configured external connection(s)
          </p>
        </div>
      </div>

      {/* Supported FHIR Resource Boundary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Supported FHIR Resource Boundary</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Governed resource matrix for HealthNova AI clinical workflows (HL7 FHIR R4).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md self-start sm:self-auto">
            Release 4.0.1
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">FHIR Resource</th>
                <th className="py-3 px-4 font-semibold">Support Level</th>
                <th className="py-3 px-4 font-semibold">Internal Domain Model</th>
                <th className="py-3 px-4 font-semibold">Exchange Direction</th>
                <th className="py-3 px-4 font-semibold">Clinical Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boundaryMatrix.map((item) => (
                <tr key={item.resource} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                    {item.resource}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getResourceStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                    {item.internal_model}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {item.direction}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
