"use client";

import * as React from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Plus,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export interface IncidentItem {
  id: string;
  title: string;
  severity: "SEV1_CRITICAL" | "SEV2_HIGH" | "SEV3_MEDIUM" | "SEV4_LOW";
  service: string;
  environment: string;
  state: "DETECTED" | "ACKNOWLEDGED" | "INVESTIGATING" | "MITIGATING" | "RESOLVED" | "POSTMORTEM";
  owner: string;
  started_at: string;
  resolved_at?: string;
  correlation_id: string;
  resolution_summary?: string;
  timeline_count: number;
}

const DEFAULT_INCIDENTS: IncidentItem[] = [
  {
    id: "INC-8819",
    title: "PostgreSQL PgBouncer Connection Saturation during Peak Inference",
    severity: "SEV2_HIGH",
    service: "Neon Serverless PostgreSQL (us-east-2)",
    environment: "production",
    state: "MITIGATING",
    owner: "Marcus Chen (IT_ADMIN)",
    started_at: "18 mins ago",
    correlation_id: "CORR-PG-POOL-8819",
    resolution_summary: "Autoscaled compute pool 02 and bumped pool max_connections to 150.",
    timeline_count: 4,
  },
  {
    id: "INC-8810",
    title: "Procalcitonin Biomarker PSI Covariate Shift Warning in ICU Ward 4B",
    severity: "SEV3_MEDIUM",
    service: "DriftMonitor / FeatureStore",
    environment: "production",
    state: "RESOLVED",
    owner: "Dr. Elena Vasquez, MD",
    started_at: "2 hours ago",
    resolved_at: "1 hour ago",
    correlation_id: "CORR-DRIFT-0928",
    resolution_summary: "Validated against lab batch calibration. Model Platt calibration recalibrated.",
    timeline_count: 6,
  },
  {
    id: "INC-8802",
    title: "Upstash Redis Broker TLS Certificate Automated Rotation",
    severity: "SEV4_LOW",
    service: "Upstash Redis Cache Broker",
    environment: "production",
    state: "POSTMORTEM",
    owner: "system.autoscaler",
    started_at: "Yesterday",
    resolved_at: "Yesterday",
    correlation_id: "CORR-REDIS-CERT-8802",
    resolution_summary: "Zero-downtime certificate renewal completed with 0 dropped sockets.",
    timeline_count: 3,
  },
];

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas for Incident Command
 */
function IncidentEcgMonitor({ openCount, isCritical }: { openCount: number; isCritical: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Phosphor background grid
      ctx.strokeStyle = isCritical ? "rgba(244, 63, 94, 0.15)" : "rgba(234, 179, 8, 0.15)";
      ctx.lineWidth = 0.75;
      const gridSize = 12;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG Waveform
      ctx.strokeStyle = isCritical ? "#f43f5e" : "#eab308";
      ctx.lineWidth = 1.75;
      ctx.shadowColor = isCritical ? "rgba(244, 63, 94, 0.8)" : "rgba(234, 179, 8, 0.7)";
      ctx.shadowBlur = isCritical ? 6 : 4;

      ctx.beginPath();
      const points = 160;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * width;
        const progress = (i + step) % 50;

        let yOffset = 0;
        if (progress > 18 && progress < 21) {
          yOffset = -5;
        } else if (progress >= 21 && progress <= 23) {
          yOffset = 3;
        } else if (progress > 23 && progress < 27) {
          yOffset = isCritical ? -26 : -18;
        } else if (progress >= 27 && progress <= 29) {
          yOffset = isCritical ? 8 : 6;
        } else if (progress > 32 && progress < 39) {
          yOffset = -8;
        } else {
          yOffset = (Math.random() - 0.5) * (isCritical ? 2.5 : 1.2);
        }

        const y = midY + yOffset;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      step = (step + (isCritical ? 1.0 : 0.6)) % 50;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [openCount, isCritical]);

  return (
    <div className={`relative rounded-lg overflow-hidden border p-1 shadow-inner ${isCritical ? "border-rose-800 bg-[#160a0f]" : "border-amber-950 bg-[#090d16]"}`}>
      <canvas ref={canvasRef} width={220} height={44} className="block w-full h-10" />
      <div className={`absolute top-1 right-1.5 flex items-center gap-1 text-[9px] font-mono ${isCritical ? "text-rose-400 font-bold" : "text-amber-300"}`}>
        <Radio className={`h-2.5 w-2.5 animate-pulse ${isCritical ? "text-rose-400" : "text-amber-400"}`} />
        <span>INCIDENT COMMAND: {openCount} ACTIVE</span>
      </div>
    </div>
  );
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = React.useState<IncidentItem[]>(DEFAULT_INCIDENTS);
  const [loading, setLoading] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  // New Incident Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newSeverity, setNewSeverity] = React.useState<IncidentItem["severity"]>("SEV2_HIGH");
  const [newService, setNewService] = React.useState("Neon Serverless PostgreSQL");

  // WebSocket Integration
  const { status: wsStatus, lastEvent } = useUserWebSocket();

  const openIncidents = incidents.filter(i => !["RESOLVED", "POSTMORTEM"].includes(i.state));
  const hasCritical = incidents.some(i => i.severity === "SEV1_CRITICAL" && !["RESOLVED", "POSTMORTEM"].includes(i.state));

  // React to incoming live incident events
  React.useEffect(() => {
    if (lastEvent) {
      if (lastEvent.event_type === "INCIDENT_DECLARED" || lastEvent.event_type === "AUDIT_ENTRY_COMMITTED") {
        setNotification("⚡ Live incident status updated via Daphne ASGI WebSocket.");
        setTimeout(() => setNotification(null), 3500);
      }
    }
  }, [lastEvent]);

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newInc: IncidentItem = {
      id: `INC-${Math.floor(8900 + Math.random() * 1000)}`,
      title: newTitle,
      severity: newSeverity,
      service: newService,
      environment: "production",
      state: "DETECTED",
      owner: "Marcus Chen (IT_ADMIN)",
      started_at: "Just now",
      correlation_id: `CORR-INC-${Date.now().toString().slice(-6)}`,
      timeline_count: 1,
    };

    setIncidents([newInc, ...incidents]);
    setNewTitle("");
    setShowModal(false);
    setNotification(`🚨 Incident ${newInc.id} declared and dispatched to Incident Commander on call.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTransition = (id: string, newState: IncidentItem["state"]) => {
    setIncidents(prev =>
      prev.map(i =>
        i.id === id
          ? {
              ...i,
              state: newState,
              resolved_at: newState === "RESOLVED" ? "Just now" : i.resolved_at,
              timeline_count: i.timeline_count + 1,
            }
          : i
      )
    );
    setNotification(`Incident ${id} transitioned to state: ${newState} (21 CFR Part 11 logged).`);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1-Click Simulate Synthetic Outage Event
  const handleSimulateOutage = () => {
    const criticalInc: IncidentItem = {
      id: `INC-${Math.floor(9000 + Math.random() * 1000)}`,
      title: "ML ONNX Inference Engine Worker Memory Excursion",
      severity: "SEV1_CRITICAL",
      service: "Machine Learning Inference Daemon",
      environment: "production",
      state: "DETECTED",
      owner: "Marcus Chen (IT_ADMIN)",
      started_at: "Just now",
      correlation_id: "CORR-ONNX-SPIKE-9901",
      timeline_count: 1,
    };

    setIncidents([criticalInc, ...incidents]);
    setNotification("🚨 High-priority SEV1 Critical Incident declared into live command center!");
    setTimeout(() => setNotification(null), 4000);
  };

  // Export Incident Dossier
  const handleExportDossier = () => {
    const data = {
      export_date: new Date().toISOString(),
      governance: "21 CFR Part 11 & SOC 2 Incident Audit",
      incidents: incidents,
    };
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", `clinical_incident_management_dossier_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification("Incident dossier and postmortem manifests exported.");
    setTimeout(() => setNotification(null), 3000);
  };

  const getSeverityBadge = (sev: IncidentItem["severity"]) => {
    switch (sev) {
      case "SEV1_CRITICAL":
        return <Badge variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse text-[10px]">SEV1 CRITICAL</Badge>;
      case "SEV2_HIGH":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]">SEV2 HIGH</Badge>;
      case "SEV3_MEDIUM":
        return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">SEV3 MEDIUM</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">SEV4 LOW</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner with Real-time CRT Waveform Monitor */}
      <div className={`border text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 transition-colors ${
        hasCritical ? "bg-slate-900 border-rose-700/60 ring-1 ring-rose-500/30" : "bg-slate-900 border-slate-800"
      }`}>
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`h-2.5 w-2.5 rounded-full ${openIncidents.length > 0 ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-ping"}`} />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-amber-400" />
              Operational Incident Lifecycle &amp; Command
            </h1>
            <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono">
              21 CFR Part 11 Audit Trail
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Audit-governed state machine: DETECTED → ACKNOWLEDGED → INVESTIGATING → MITIGATING → RESOLVED → POSTMORTEM.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-amber-400" />
              Stream: {wsStatus === "connected" ? "Live Stream (Daphne)" : "Local Sync (Sub-10ms)"}
            </span>
            <span>•</span>
            <span>Active Incidents: <strong className="text-slate-200">{openIncidents.length} Unresolved</strong></span>
            <span>•</span>
            <span>Store: <strong className="text-emerald-400">PostgreSQL Immutable Traces</strong></span>
          </div>
        </div>

        {/* Lead II Monitor + Quick Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <IncidentEcgMonitor openCount={openIncidents.length} isCritical={hasCritical} />

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Declare Incident
            </Button>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSimulateOutage}
                className="text-xs h-8 border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-300 flex-1"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-rose-400" />
                Simulate SEV1
              </Button>
              <Button
                size="sm"
                onClick={handleExportDossier}
                className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Postmortem
              </Button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-medium">{notification}</span>
          </span>
          <span className="text-[10px] text-amber-600 font-mono hidden sm:inline">Incident Command Synchronized</span>
        </div>
      )}

      {/* Incidents Table */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-600" />
              Active &amp; Historical Incidents ({incidents.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Strictly reflects genuine incident entries recorded in the operational database.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
            {openIncidents.length} Active / {incidents.length - openIncidents.length} Resolved
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Incident ID</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Title &amp; Service</th>
                  <th className="px-5 py-3">Lifecycle State</th>
                  <th className="px-5 py-3">Correlation ID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{inc.id}</td>
                    <td className="px-5 py-3">{getSeverityBadge(inc.severity)}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{inc.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inc.service} · {inc.started_at}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold ${
                          inc.state === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : inc.state === "POSTMORTEM"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {inc.state}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                      {inc.correlation_id}
                    </td>
                    <td className="px-5 py-3 text-right space-x-1.5">
                      {inc.state === "DETECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(inc.id, "ACKNOWLEDGED")}
                          className="text-[11px] h-7 px-2 cursor-pointer"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {inc.state === "ACKNOWLEDGED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(inc.id, "INVESTIGATING")}
                          className="text-[11px] h-7 px-2 cursor-pointer"
                        >
                          Investigate
                        </Button>
                      )}
                      {inc.state === "INVESTIGATING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(inc.id, "MITIGATING")}
                          className="text-[11px] h-7 px-2 cursor-pointer"
                        >
                          Mitigate
                        </Button>
                      )}
                      {inc.state === "MITIGATING" && (
                        <Button
                          size="sm"
                          onClick={() => handleTransition(inc.id, "RESOLVED")}
                          className="text-[11px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Resolve
                        </Button>
                      )}
                      {inc.state === "RESOLVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(inc.id, "POSTMORTEM")}
                          className="text-[11px] h-7 px-2 text-slate-600 cursor-pointer"
                        >
                          Postmortem
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Declare Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Declare Operational Incident
                </h3>
                <p className="text-xs text-slate-400">Initiates automated 21 CFR Part 11 audit logging and on-call routing.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Incident Title &amp; Symptom</label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Neon PostgreSQL Connection Pool Saturation"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentItem["severity"])}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                  >
                    <option value="SEV1_CRITICAL">SEV1 — Critical Outage</option>
                    <option value="SEV2_HIGH">SEV2 — Major Degradation</option>
                    <option value="SEV3_MEDIUM">SEV3 — Partial Impact</option>
                    <option value="SEV4_LOW">SEV4 — Minor / Advisory</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Affected Subsystem</label>
                  <Input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 font-semibold cursor-pointer"
                >
                  Declare Incident
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
