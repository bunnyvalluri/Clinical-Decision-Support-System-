"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { InteroperabilityService } from "@/services/interoperability/InteroperabilityService";
import type {
  IntegrationConnectionItem,
  IntegrationHealthStatus,
} from "@/services/interoperability/InteroperabilityTypes";

export default function InformaticistConnectionsPage() {
  const [connections, setConnections] = React.useState<IntegrationConnectionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await InteroperabilityService.fetchConnections();
      setConnections(res.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load integration connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTestConnection = async (id: string) => {
    try {
      setTestingId(id);
      setSuccessMsg(null);
      setError(null);
      const res = await InteroperabilityService.testConnection(id);
      setSuccessMsg(`Connection verified: ${res.status} (${res.latency_ms} ms, FHIR v${res.fhir_version || "4.0.1"})`);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Connection test probe failed.");
      await loadData();
    } finally {
      setTestingId(null);
    }
  };

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
          label: "DEGRADED",
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
          label: "AUTH FAILED",
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/informaticist/interoperability"
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              ← Interoperability Hub
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600">Connections</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Integration Connections & Endpoints
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Verified external healthcare EHR systems, SMART-on-FHIR gateways, and connection telemetry.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
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
      {!loading && connections.length === 0 && (
        <div className="p-12 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <Server className="h-10 w-10 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No integration connections configured yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No external EHR or FHIR server connections have been registered. Add connection details to initiate data exchange.
          </p>
        </div>
      )}

      {/* Connections Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {connections.map((conn) => {
          const badge = getHealthBadge(conn.health_status);
          const Icon = badge.icon;
          const isTesting = testingId === conn.id;

          return (
            <div
              key={conn.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{conn.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                    <Icon className="h-3 w-3" />
                    {badge.label}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                    FHIR v{conn.fhir_version}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {conn.auth_type}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 break-all">{conn.base_url}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1 flex-wrap">
                  <span>Direction: <strong className="text-slate-700">{conn.allowed_direction}</strong></span>
                  <span>Latency: <strong className="text-slate-700">{conn.latency_ms} ms</strong></span>
                  <span>Rate Limit: <strong className="text-slate-700">{conn.rate_limit_per_minute}/min</strong></span>
                  <span>
                    Last Verified:{" "}
                    <strong className="text-slate-700">
                      {conn.last_verified_at ? new Date(conn.last_verified_at).toLocaleTimeString() : "Never"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  onClick={() => handleTestConnection(conn.id)}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3 w-3 ${isTesting ? "animate-spin" : ""}`} />
                  {isTesting ? "Probing..." : "Test Connection"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
