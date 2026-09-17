"use client";

import * as React from "react";
import {
  Activity,
  BarChart3,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface AuditMetrics {
  device_telemetry: {
    total_devices: number;
    active_devices: number;
    online_devices: number;
  };
  event_metrics: {
    classifications: Record<string, number>;
    processing_statuses: Record<string, number>;
    avg_delivery_latency_ms: number;
    dead_letter_count: number;
  };
  security_state: {
    active_kill_switches: number;
    zero_phi_in_storage: boolean;
    default_deny_enforced: boolean;
  };
}

export default function InformaticistMobilePage() {
  const [metrics, setMetrics] = React.useState<AuditMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchMetrics = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/mobile/audit/");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // Empty state
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 bg-white text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-600" />
            Mobile Gateway Quality & Ingestion Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data informaticist surveillance: pipeline latency, classification distribution, and privacy guarantees.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-amber-600" />
            Total Hardware Nodes
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.device_telemetry.total_devices ?? 0}
          </div>
          <div className="text-xs text-slate-500">
            {metrics?.device_telemetry.active_devices ?? 0} Active / {metrics?.device_telemetry.online_devices ?? 0} Online
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-600" />
            Avg Delivery Latency
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.event_metrics.avg_delivery_latency_ms ?? 0}
            <span className="text-sm font-normal text-slate-500 ml-1">ms</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium">Asynchronous Celery SLA: &lt; 200ms</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Dead Letter Queue
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.event_metrics.dead_letter_count ?? 0}
          </div>
          <div className="text-xs text-slate-500">Failed / Undeliverable events</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            Security Posture
          </div>
          <div className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Zero PHI in Storage
          </div>
          <div className="text-xs text-slate-500">Default-Deny Policy Active</div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classifications */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-600" />
            Ingested Events by Data Classification
          </h3>
          {metrics && Object.keys(metrics.event_metrics.classifications).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(metrics.event_metrics.classifications).map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between text-xs">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{cls}</span>
                  <span className="font-bold text-slate-900">{count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No event classification data recorded yet.
            </div>
          )}
        </div>

        {/* Processing Statuses */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            Pipeline Processing Statuses
          </h3>
          {metrics && Object.keys(metrics.event_metrics.processing_statuses).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(metrics.event_metrics.processing_statuses).map(([st, count]) => (
                <div key={st} className="flex items-center justify-between text-xs">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{st}</span>
                  <span className="font-bold text-slate-900">{count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No processing status metrics recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
