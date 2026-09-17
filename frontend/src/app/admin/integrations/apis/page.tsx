"use client";

import * as React from "react";
import {
  Layers,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Activity,
  Server,
  FileCode,
} from "lucide-react";
import { ExternalApiService } from "@/services/external-apis/ExternalApiService";
import type {
  ExternalAPIAuditLogItem,
  ExternalAPIRegistryItem,
} from "@/services/external-apis/ExternalApiTypes";

export default function AdminExternalApisPage() {
  const [circuitStates, setCircuitStates] = React.useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = React.useState<ExternalAPIAuditLogItem[]>([]);
  const [registry, setRegistry] = React.useState<ExternalAPIRegistryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resetting, setResetting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cbRes, auditRes, regRes] = await Promise.all([
        ExternalApiService.fetchCircuitBreaker(),
        ExternalApiService.fetchAuditLogs(),
        ExternalApiService.fetchRegistry(),
      ]);
      setCircuitStates(cbRes.circuit_states || {});
      setAuditLogs(auditRes.results || []);
      setRegistry(regRes.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load external API integration telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetCircuit = async (provider: string) => {
    try {
      setResetting(provider);
      setSuccessMsg(null);
      await ExternalApiService.resetCircuitBreaker(provider);
      setSuccessMsg(`Circuit breaker for ${provider} successfully reset to CLOSED.`);
      await loadData();
    } catch (err: any) {
      setError(`Failed to reset circuit breaker for ${provider}.`);
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              Integration Infrastructure
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              SSRF Guard Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            External API Gateway & Circuit Breakers
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Monitor circuit breakers, egress policies, outbound latency, and immutable communication audit logs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Circuit Breakers Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Provider Circuit Breaker State Machine
        </h2>
        <p className="text-xs text-slate-500">
          Circuit breakers prevent cascading failures. After 3 consecutive timeouts or server errors, requests are halted for a 60-second cooldown period before testing recovery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {Object.entries(circuitStates).map(([provider, state]) => (
            <div
              key={provider}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{provider}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    state === "CLOSED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : state === "HALF_OPEN"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {state}
                </span>
              </div>

              <div className="text-[11px] text-slate-600">
                {state === "CLOSED" && "Normal operation: Outbound queries active."}
                {state === "OPEN" && "Tripped: Provider failing, calls paused."}
                {state === "HALF_OPEN" && "Probing: Testing provider recovery."}
              </div>

              {state !== "CLOSED" && (
                <button
                  onClick={() => handleResetCircuit(provider)}
                  disabled={resetting === provider}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {resetting === provider ? "Resetting..." : "Reset to CLOSED"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security & SSRF Policy Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
            <Lock className="h-4 w-4" />
            SSRF Network Isolation
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            DNS pre-resolution inspects IP addresses. Loops, private RFC 1918 subnets, and cloud metadata (169.254.169.254) are permanently blocked.
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <Server className="h-4 w-4" />
            Domain Allowlists
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Outbound gateway strictly permits approved domains: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">api.fda.gov</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">npiregistry.cms.hhs.gov</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">data.cms.gov</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">api.nal.usda.gov</code>.
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <Activity className="h-4 w-4" />
            PHI Boundary Policy
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Outbound parameters pass through regex token filters. Any payload matching MRNs, SSNs, or patient demographic tokens is aborted.
          </p>
        </div>
      </div>

      {/* Outbound Audit Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-slate-500" />
            Outbound External API Audit Log (Recent Interactions)
          </h2>
          <span className="text-xs text-slate-500">Stored in Neon PostgreSQL</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No external API calls recorded yet. All outgoing requests will be logged here with latency and status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">User Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Circuit State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] max-w-xs truncate text-slate-800">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-bold ${
                          log.success ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {log.latency_ms.toFixed(0)} ms
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-600">
                      {log.circuit_state}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
