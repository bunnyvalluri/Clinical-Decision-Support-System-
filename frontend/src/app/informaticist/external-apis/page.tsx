"use client";

import * as React from "react";
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { ExternalApiService } from "@/services/external-apis/ExternalApiService";
import type {
  ExternalAPIRegistryItem,
  ExternalAPIHealthCheck,
} from "@/services/external-apis/ExternalApiTypes";

export default function InformaticistExternalApisPage() {
  const [apis, setApis] = React.useState<ExternalAPIRegistryItem[]>([]);
  const [healthChecks, setHealthChecks] = React.useState<ExternalAPIHealthCheck[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [probing, setProbing] = React.useState(false);
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [registryRes, healthRes] = await Promise.all([
        ExternalApiService.fetchRegistry(),
        ExternalApiService.fetchHealthChecks(),
      ]);
      setApis(registryRes.results || []);
      setHealthChecks(healthRes.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load external API registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTriggerProbe = async () => {
    try {
      setProbing(true);
      await ExternalApiService.triggerHealthProbe();
      await loadData();
    } catch (err: any) {
      setError("Health probe execution failed.");
    } finally {
      setProbing(false);
    }
  };

  const handleApprove = async (apiId: string) => {
    try {
      await ExternalApiService.submitApproval({
        api_id: apiId,
        stage: "CLINICAL_REVIEW",
        decision: "APPROVED",
        notes: "Approved by Medical Informaticist after schema validation.",
      });
      await loadData();
    } catch (err: any) {
      setError("Approval submission failed.");
    }
  };

  const filteredApis = React.useMemo(() => {
    if (filterCategory === "ALL") return apis;
    return apis.filter((a) => a.category.toLowerCase() === filterCategory.toLowerCase());
  }, [apis, filterCategory]);

  const activeCount = apis.filter((a) => a.status === "ACTIVE").length;
  const healthyCount = apis.filter((a) => a.health_status === "HEALTHY").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
              Informatics & Schema Governance
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Contract Validated
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            External Healthcare API Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Audit public API data quality, schema versions, uptime reliability, and clinical relevance.
          </p>
        </div>

        <button
          onClick={handleTriggerProbe}
          disabled={probing}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${probing ? "animate-spin" : ""}`} />
          {probing ? "Probing Endpoints..." : "Run Health Probes"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Integrations
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900">{activeCount}</span>
            <span className="text-xs text-slate-500">of {apis.length} registered</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Healthy Endpoints
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-600">{healthyCount}</span>
            <span className="text-xs text-slate-500">passing probes</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Gateway Policy
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-bold text-indigo-700">HTTPS / SSRF-Guarded</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Authoritative Store
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-bold text-slate-900">Neon PostgreSQL</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "Health", "Government", "Food & Drink"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filterCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Registry Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            Registered Healthcare APIs ({filteredApis.length})
          </h2>
          <span className="text-xs text-slate-500">Source: public-apis Catalog</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading catalog registry...</div>
        ) : filteredApis.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No approved external APIs are currently configured for this category.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredApis.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.provider}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">{item.description}</p>
                    <div className="text-[11px] text-slate-500 mt-1.5 flex flex-wrap gap-4">
                      <span>Base URL: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{item.base_url}</code></span>
                      <span>Auth: <b>{item.authentication_type}</b></span>
                      <span>Rate Limit: <b>{item.rate_limit}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-center">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        {item.health_status === "HEALTHY" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            HEALTHY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="h-3 w-3" />
                            {item.health_status}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Validated: {item.last_validated_at ? new Date(item.last_validated_at).toLocaleTimeString() : "Pending"}
                      </span>
                    </div>

                    {item.status !== "ACTIVE" && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Approve Stage
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Probes Stream */}
      {healthChecks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            Recent Provider Health Check Probes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {healthChecks.slice(0, 4).map((chk) => (
              <div key={chk.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">{chk.api_name || "Provider Probe"}</div>
                <div className="flex items-center justify-between text-slate-600 mt-1">
                  <span>Latency: {chk.latency_ms.toFixed(0)} ms</span>
                  <span className={chk.is_available ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                    {chk.is_available ? "200 OK" : "ERR"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
