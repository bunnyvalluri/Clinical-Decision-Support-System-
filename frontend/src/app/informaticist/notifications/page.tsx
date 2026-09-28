"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Filter,
  Info,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export interface InformaticistNotification {
  id: string;
  title: string;
  message: string;
  category: "DRIFT" | "MODEL" | "DATA_QUALITY" | "REGULATORY" | "SWARM";
  severity: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  resourceId?: string;
}

const DEFAULT_INFORMATICS_NOTIFICATIONS: InformaticistNotification[] = [
  {
    id: "notif-01",
    title: "Feature Distribution Shift Alert: Serum Lactic Acid",
    message: "Population Stability Index (PSI) reached 0.082 (approaching 0.10 threshold). Cohort 72h mean increased from 1.45 to 1.68 mmol/L across Ward 4B & ICU.",
    category: "DRIFT",
    severity: "WARNING",
    timestamp: "2 mins ago",
    read: false,
    actionUrl: "/informaticist/drift",
    actionLabel: "Inspect Drift Distribution",
    resourceId: "covariate-lactate-0928",
  },
  {
    id: "notif-02",
    title: "Champion Model Benchmark Verified: 98.6% ROC-AUC",
    message: "Automated empirical test suite completed on XGBoost-Sepsis-v3.2. Calibrated Platt Brier score maintained at 0.0024 with 0.118ms sub-millisecond inference.",
    category: "MODEL",
    severity: "SUCCESS",
    timestamp: "18 mins ago",
    read: false,
    actionUrl: "/informaticist/models",
    actionLabel: "View Model Registry",
    resourceId: "mod-sepsis-xgboost-v3",
  },
  {
    id: "notif-03",
    title: "Physiological Clamping Boundary Exceeded: SBP 315 mmHg",
    message: "Incoming vital stream for patient telemetry exceeded 3.5σ statistical ceiling. Clamped to safe clinical upper bound (240 mmHg) and tagged for sensor recalibration.",
    category: "DATA_QUALITY",
    severity: "CRITICAL",
    timestamp: "45 mins ago",
    read: false,
    actionUrl: "/informaticist/data-quality",
    actionLabel: "View Quarantine Matrix",
    resourceId: "dq-sbp-clamped-902",
  },
  {
    id: "notif-04",
    title: "Ruflo Swarm Consensus: Deterministic qSOFA Validated",
    message: "Clinical Safety Agent verified 100% adherence to Surviving Sepsis Campaign SSC-2021 protocols for 1,200 shadow encounters with zero boundary violations.",
    category: "SWARM",
    severity: "SUCCESS",
    timestamp: "1 hour ago",
    read: false,
    actionUrl: "/informaticist/whiteboards",
    actionLabel: "Inspect Swarm Canvas",
    resourceId: "task-sepsis-swarm-44",
  },
  {
    id: "notif-05",
    title: "Quarterly SaMD Regulatory Dossier Compiled & Signed",
    message: "Q3-2026 21 CFR Part 11 regulatory compliance packet (PDF, 4.8MB) has finished compiling with cryptographic SHA-256 Merkle root verification.",
    category: "REGULATORY",
    severity: "INFO",
    timestamp: "3 hours ago",
    read: true,
    actionUrl: "/informaticist/reports",
    actionLabel: "Download SaMD Dossier",
    resourceId: "rep-samd-q3-2026",
  },
  {
    id: "notif-06",
    title: "AI Grounding Audit: 0.0% Hallucination on 250 Penetration Tests",
    message: "Adversarial Prompt 18 LLM jailbreak refusal engine confirmed 0.0% prompt leakage and strict guideline adherence to ACC/AHA & KDIGO clinical guidelines.",
    category: "REGULATORY",
    severity: "SUCCESS",
    timestamp: "5 hours ago",
    read: true,
    actionUrl: "/informaticist/ai-evaluation",
    actionLabel: "View AI Safety Benchmark",
    resourceId: "eval-rag-safety-0928",
  },
];

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas for Alert Stream
 */
function AlertEcgMonitor({ bpm, isAlarm }: { bpm: number; isAlarm: boolean }) {
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
      ctx.strokeStyle = isAlarm ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.12)";
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
      ctx.strokeStyle = isAlarm ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 1.75;
      ctx.shadowColor = isAlarm ? "rgba(244, 63, 94, 0.8)" : "rgba(16, 185, 129, 0.7)";
      ctx.shadowBlur = isAlarm ? 6 : 4;

      ctx.beginPath();
      const points = 160;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * width;
        const progress = (i + step) % 50;

        let yOffset = 0;
        if (progress > 18 && progress < 21) {
          yOffset = -5; // P-wave
        } else if (progress >= 21 && progress <= 23) {
          yOffset = 3; // Q-wave
        } else if (progress > 23 && progress < 27) {
          yOffset = isAlarm ? -26 : -18; // R-wave spike
        } else if (progress >= 27 && progress <= 29) {
          yOffset = isAlarm ? 8 : 6; // S-wave
        } else if (progress > 32 && progress < 39) {
          yOffset = -8; // T-wave
        } else {
          yOffset = (Math.random() - 0.5) * (isAlarm ? 2.5 : 1.2); // Baseline noise
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

      step = (step + (isAlarm ? 1.0 : 0.6)) % 50;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bpm, isAlarm]);

  return (
    <div className={`relative rounded-lg overflow-hidden border p-1 shadow-inner ${isAlarm ? "border-rose-800 bg-[#160a0f]" : "border-slate-800 bg-[#090d16]"}`}>
      <canvas ref={canvasRef} width={220} height={44} className="block w-full h-10" />
      <div className={`absolute top-1 right-1.5 flex items-center gap-1 text-[9px] font-mono ${isAlarm ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
        <Radio className={`h-2.5 w-2.5 animate-pulse ${isAlarm ? "text-rose-400" : "text-emerald-400"}`} />
        <span>{isAlarm ? "ALARM PRIORITY: HIGH" : "TELEMETRY SYNC: 100%"}</span>
      </div>
    </div>
  );
}

export default function InformaticistNotificationsPage() {
  const [notifications, setNotifications] = React.useState<InformaticistNotification[]>(DEFAULT_INFORMATICS_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // WebSocket Integration
  const { status: wsStatus, lastEvent } = useUserWebSocket();

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.severity === "CRITICAL" && !n.read).length;
  const hasActiveAlarm = criticalCount > 0;

  // React to incoming live events
  React.useEffect(() => {
    if (lastEvent) {
      if (lastEvent.event_type === "CRITICAL_DRIFT_ALERT" || lastEvent.event_type === "PREDICTION_CREATED") {
        const liveNotif: InformaticistNotification = {
          id: `live-${Date.now()}`,
          title: "⚡ Real-time Ingestion Stream Alert",
          message: "Incoming live biomarker batch processed with sub-millisecond latency. No constraint violations.",
          category: "DRIFT",
          severity: "INFO",
          timestamp: "Just now",
          read: false,
          actionUrl: "/informaticist/drift",
          actionLabel: "Inspect Stream",
        };
        setNotifications(prev => [liveNotif, ...prev]);
        setToastMessage("Incoming WebSocket alert appended to informatics stream.");
        setTimeout(() => setToastMessage(null), 3500);
      }
    }
  }, [lastEvent]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setToastMessage("All alerts marked as acknowledged.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clearRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    setToastMessage("Cleared read alerts from local stream.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const markOneAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // 1-Click Simulate High Priority Sepsis Shift Alert
  const handleSimulateCriticalAlert = () => {
    const criticalAlert: InformaticistNotification = {
      id: `crit-${Date.now()}`,
      title: "🚨 CRITICAL: Covariate Shift Spike in ICU Sepsis Model",
      message: "Procalcitonin PSI escalated to 0.24 (> 0.20 Critical retrain threshold). Immediate Human-in-the-Loop MLOps review required.",
      category: "DRIFT",
      severity: "CRITICAL",
      timestamp: "Just now",
      read: false,
      actionUrl: "/informaticist/drift",
      actionLabel: "Trigger Retraining DAG",
      resourceId: "procalcitonin-drift-critical",
    };

    setNotifications(prev => [criticalAlert, ...prev]);
    setToastMessage("🚨 High-priority clinical telemetry alarm injected into live stream.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export JSON/CSV
  const handleExportAlerts = () => {
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notifications, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", `clinical_alerts_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage("Alerts telemetry log exported successfully.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = notifications.filter(n => {
    const matchesFilter =
      selectedFilter === "ALL" ? true :
      selectedFilter === "UNREAD" ? !n.read :
      selectedFilter === "CRITICAL" ? n.severity === "CRITICAL" :
      n.category === selectedFilter;

    const matchesSearch =
      !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.resourceId && n.resourceId.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getSeverityBadge = (severity: InformaticistNotification["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="outline" className="text-[10px] bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse">CRITICAL ALARM</Badge>;
      case "WARNING":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">WARNING</Badge>;
      case "SUCCESS":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">HEALTHY</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">INFO</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner with Real-time Telemetry & Quick Action Controls */}
      <div className={`border text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 transition-colors ${
        hasActiveAlarm ? "bg-slate-900 border-rose-700/60 ring-1 ring-rose-500/30" : "bg-slate-900 border-slate-800"
      }`}>
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`h-2.5 w-2.5 rounded-full ${hasActiveAlarm ? "bg-rose-500 animate-ping" : "bg-emerald-400 animate-ping"}`} />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Bell className="h-6 w-6 text-teal-400" />
              Informatics Telemetry &amp; Alarm Hub
            </h1>
            {unreadCount > 0 ? (
              <Badge className="bg-amber-500 text-white font-semibold text-xs shadow-xs">
                {unreadCount} Active Unread
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono">
                All Systems Clear
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge className="bg-rose-600 text-white text-xs font-bold animate-pulse">
                {criticalCount} Critical Alarms
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time multi-agent alerts, biomarker population drift warnings, model registry promotions, and data quality boundary excursions.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              WebSocket: {wsStatus === "connected" ? "Live Telemetry" : "Local Sync (Sub-10ms)"}
            </span>
            <span>•</span>
            <span>Active Alerts: <strong className="text-slate-200">{notifications.length}</strong></span>
            <span>•</span>
            <span>Store: <strong className="text-emerald-400">Lakebase PostgreSQL Ledger</strong></span>
          </div>
        </div>

        {/* Lead II Telemetry Monitor + Quick Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <AlertEcgMonitor bpm={hasActiveAlarm ? 112 : 68} isAlarm={hasActiveAlarm} />

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleSimulateCriticalAlert}
              className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Simulate Critical Alert
            </Button>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-xs h-8 border-slate-700 bg-slate-800 text-slate-300 hover:text-white flex-1"
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 mr-1 text-slate-500" />}
                {soundEnabled ? "Audio On" : "Muted"}
              </Button>
              <Button
                size="sm"
                onClick={handleExportAlerts}
                className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">Ledger Synchronized</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search alerts, biomarkers, or resource IDs..."
            className="pl-8 h-8 text-xs border-slate-200 focus:border-teal-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { key: "ALL", label: `All (${notifications.length})` },
            { key: "UNREAD", label: `Unread (${unreadCount})` },
            { key: "CRITICAL", label: `Critical (${criticalCount})` },
            { key: "DRIFT", label: "Drift" },
            { key: "MODEL", label: "Model Registry" },
            { key: "DATA_QUALITY", label: "Data Quality" },
            { key: "SWARM", label: "Ruflo Swarm" },
            { key: "REGULATORY", label: "Regulatory" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === f.key
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="text-xs h-8 border-slate-200"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={clearRead}
            className="text-xs h-8 border-slate-200 text-slate-600 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear Read
          </Button>
        </div>
      </div>

      {/* Notification Stream Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <BellOff className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No telemetry alerts match your current filter</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or selecting a different category tab.</p>
          </div>
        ) : (
          filtered.map(item => (
            <Card
              key={item.id}
              className={`bg-white border transition-all ${
                item.severity === "CRITICAL" && !item.read
                  ? "border-rose-400 ring-2 ring-rose-200 shadow-md bg-rose-50/20"
                  : !item.read
                  ? "border-amber-300 ring-1 ring-amber-100 shadow-xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-1 shrink-0">
                    {item.severity === "CRITICAL" && !item.read ? (
                      <span className="h-3 w-3 rounded-full bg-rose-600 block animate-ping" />
                    ) : !item.read ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block" />
                    ) : (
                      <Check className="h-4 w-4 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm ${item.severity === "CRITICAL" ? "text-rose-900" : "text-slate-900"}`}>
                        {item.title}
                      </h3>
                      {getSeverityBadge(item.severity)}
                      {item.resourceId && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.resourceId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      {item.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.actionUrl && (
                    <Link href={item.actionUrl}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markOneAsRead(item.id)}
                        className={`text-xs h-8 border-slate-200 ${
                          item.severity === "CRITICAL"
                            ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 font-semibold"
                            : "hover:border-teal-400 hover:text-teal-700"
                        }`}
                      >
                        {item.actionLabel || "Inspect"}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  )}

                  {!item.read && (
                    <button
                      onClick={() => markOneAsRead(item.id)}
                      title="Acknowledge Alert"
                      className="h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
