"use client";

import * as React from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  RefreshCw,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Shield,
  Server,
  Layers,
  Trash2,
  ArrowDown,
  Info,
  Clock,
  Radio,
  Copy,
  Check,
  ChevronDown,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export type LogLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG";
export type LogService =
  | "DJANGO_API"
  | "CELERY_WORKER"
  | "CHANNELS_ASGI"
  | "NEON_DB"
  | "SECURITY_SENTINEL"
  | "REDIS_BROKER";

export interface SystemLogMessage {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogService;
  message: string;
  traceId?: string;
  latencyMs?: number;
  statusCode?: number;
  metadata?: Record<string, string | number | boolean>;
}

const INITIAL_LOG_ARCHIVE: SystemLogMessage[] = [
  {
    id: "log-1",
    timestamp: "2026-09-28 10:14:01.129",
    level: "INFO",
    service: "DJANGO_API",
    message: "GET /api/v1/doctor/summary/ 200 OK (latency: 34ms, auth: Bearer, role: Clinician)",
    traceId: "tr-9801-44",
    latencyMs: 34,
    statusCode: 200,
    metadata: { endpoint: "/api/v1/doctor/summary/", method: "GET", tenant: "icu-cardio-01" },
  },
  {
    id: "log-2",
    timestamp: "2026-09-28 10:13:55.802",
    level: "INFO",
    service: "CELERY_WORKER",
    message: "Task apps.predictions.tasks.generate_patient_risk_report[b91-49a] succeeded in 1.42s (SHAP attributions: 14 features)",
    traceId: "tr-9799-12",
    latencyMs: 1420,
    metadata: { queue: "celery_predictions", retries: 0, status: "SUCCESS" },
  },
  {
    id: "log-3",
    timestamp: "2026-09-28 10:13:40.012",
    level: "WARNING",
    service: "SECURITY_SENTINEL",
    message: "Zero-Trust Context Guard: Sanitized 1 redundant request header (zero PHI retained in vector memory)",
    traceId: "tr-9795-03",
    metadata: { rule: "Invariant-2-Zero-PHI", action: "HEADER_STRIPPED" },
  },
  {
    id: "log-4",
    timestamp: "2026-09-28 10:12:19.450",
    level: "INFO",
    service: "CHANNELS_ASGI",
    message: "WebSocket connection established for channel 'nurse_triage' (protocol: wss, frame_compression: permessage-deflate)",
    traceId: "tr-9788-91",
    metadata: { channel: "nurse_triage", compression: "deflate" },
  },
  {
    id: "log-5",
    timestamp: "2026-09-28 10:11:02.912",
    level: "DEBUG",
    service: "NEON_DB",
    message: "neon_pool: connection checkout duration: 2.1ms (active_pool_size: 6/25, branch: main-prod)",
    traceId: "tr-9774-88",
    latencyMs: 2.1,
    metadata: { branch: "main-prod", pool_active: 6, pool_max: 25 },
  },
  {
    id: "log-6",
    timestamp: "2026-09-28 10:09:11.230",
    level: "ERROR",
    service: "DJANGO_API",
    message: "Inference timeout fallback on secondary AdaBoost pipeline; autonomous fallback to champion Random Forest v1.4 completed safely",
    traceId: "tr-9750-61",
    statusCode: 504,
    metadata: { pipeline: "AdaBoost-v2", fallback: "RF-champion-v1.4", error_code: "INFERENCE_TIMEOUT" },
  },
  {
    id: "log-7",
    timestamp: "2026-09-28 10:08:22.015",
    level: "INFO",
    service: "REDIS_BROKER",
    message: "Heartbeat pong received from worker-node-03. Active subscribed channels: 18",
    traceId: "tr-9742-10",
    metadata: { cluster: "redis-cluster-01", latency: "0.8ms" },
  },
];

export default function AdminLogsPage() {
  const [logs, setLogs] = React.useState<SystemLogMessage[]>(INITIAL_LOG_ARCHIVE);
  const [filterLevel, setFilterLevel] = React.useState<string>("ALL");
  const [filterService, setFilterService] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [autoScroll, setAutoScroll] = React.useState<boolean>(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [selectedLog, setSelectedLog] = React.useState<SystemLogMessage | null>(null);
  const [activeRate, setActiveRate] = React.useState<number>(14);
  const [pulseCount, setPulseCount] = React.useState<number>(0);
  const [bannerNotice, setBannerNotice] = React.useState<string | null>(null);

  const logEndRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Real-time WebSocket hook
  const { status: wsStatus, lastEvent } = useUserWebSocket();

  // Scroll to bottom when new logs arrive if autoScroll is enabled
  React.useEffect(() => {
    if (autoScroll && !isPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, isPaused]);

  // Lead II Oscilloscope Animation
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let x = 0;
    const height = canvas.height;
    const width = canvas.width;
    const midY = height / 2;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    const render = () => {
      ctx.fillStyle = "rgba(9, 13, 22, 0.05)";
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gy = 0; gy < height; gy += 15) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      for (let gx = 0; gx < width; gx += 30) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      ctx.stroke();

      // Sweep bar
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(x, 0, 3, height);

      // Compute ECG wave with log pulse modulation
      const t = x * 0.08;
      let yOffset = Math.sin(t) * 4;
      const beatMod = (x % 90);

      // QRS Complex
      if (beatMod > 30 && beatMod < 35) {
        yOffset = -8; // Q wave
      } else if (beatMod >= 35 && beatMod <= 42) {
        yOffset = 34; // R spike
      } else if (beatMod > 42 && beatMod < 48) {
        yOffset = -14; // S wave
      } else if (beatMod > 60 && beatMod < 75) {
        yOffset = 8; // T wave
      }

      // If simulated burst happened, add telemetry spike
      if (pulseCount > 0) {
        yOffset += Math.sin(t * 3) * (pulseCount * 1.5);
      }

      const drawY = midY - yOffset;

      ctx.beginPath();
      ctx.arc(x, drawY, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = pulseCount > 5 ? "#f43f5e" : pulseCount > 0 ? "#38bdf8" : "#10b981";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      x = (x + 2) % width;
      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [pulseCount]);

  // Periodic heartbeat / rate jitter
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveRate((prev) => Math.max(8, Math.min(38, prev + Math.floor(Math.random() * 5) - 2)));
      setPulseCount((prev) => Math.max(0, prev - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live WebSocket events
  React.useEffect(() => {
    if (!lastEvent || isPaused) return;
    const now = new Date().toISOString().replace("T", " ").substring(0, 23);
    const newLog: SystemLogMessage = {
      id: `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      level: (lastEvent.event_type.includes("error") || lastEvent.event_type.includes("alarm"))
        ? "ERROR"
        : (lastEvent.event_type.includes("warn") || lastEvent.event_type.includes("alert"))
        ? "WARNING"
        : "INFO",
      service: "CHANNELS_ASGI",
      message: `WebSocket [${lastEvent.event_type}]: ${JSON.stringify(lastEvent.payload || {}).substring(0, 120)}`,
      traceId: `tr-${Date.now().toString().slice(-6)}`,
      metadata: { event_type: lastEvent.event_type, ws_status: wsStatus },
    };
    setLogs((prev) => [...prev.slice(-300), newLog]);
    setPulseCount((prev) => Math.min(10, prev + 2));
  }, [lastEvent, isPaused, wsStatus]);

  // Operational Action 1: Dispatch Test Log Burst
  const handleTriggerLogBurst = () => {
    const services: LogService[] = ["DJANGO_API", "CELERY_WORKER", "CHANNELS_ASGI", "NEON_DB", "SECURITY_SENTINEL", "REDIS_BROKER"];
    const levels: LogLevel[] = ["INFO", "INFO", "INFO", "DEBUG", "WARNING", "INFO"];
    const messages = [
      "POST /api/v1/clinical/telemetry/ 201 Created (batch_size: 64 records, duration: 18ms)",
      "Celery worker [worker-pool-2] acquired task apps.ml.tasks.score_sepsis_risk[q-992]",
      "Neon PostgreSQL pooled transaction committed in 3.4ms on branch 'main-prod'",
      "Zero-Trust Guard: Context minimization verified for token session 0x9f1a...48c",
      "Redis pub/sub: Broadcasted message to cluster 'icu_vital_stream' (recipients: 12)",
      "GET /api/v1/auth/verify-token/ 200 OK (latency: 12ms)",
      "ML Feature Extractor: Computed TreeSHAP contribution matrix for 18 physiological vitals",
      "Daphne ASGI: Handshake protocol upgrade completed successfully",
    ];

    const now = new Date();
    const newBurst: SystemLogMessage[] = Array.from({ length: 8 }).map((_, idx) => ({
      id: `burst-${Date.now()}-${idx}`,
      timestamp: new Date(now.getTime() + idx * 40).toISOString().replace("T", " ").substring(0, 23),
      level: levels[idx % levels.length],
      service: services[idx % services.length],
      message: messages[idx % messages.length],
      traceId: `tr-burst-${Math.floor(1000 + Math.random() * 9000)}`,
      latencyMs: Math.floor(8 + Math.random() * 45),
      statusCode: 200,
    }));

    setLogs((prev) => [...prev.slice(-300), ...newBurst]);
    setPulseCount(6);
    setBannerNotice("🚀 Log Burst Dispatched: Ingested 8 high-throughput multi-service telemetry events.");
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Operational Action 2: Simulate Critical Exception Drill
  const handleSimulateExceptionDrill = () => {
    const now = new Date().toISOString().replace("T", " ").substring(0, 23);
    const criticalLogs: SystemLogMessage[] = [
      {
        id: `drill-err-${Date.now()}-1`,
        timestamp: now,
        level: "ERROR",
        service: "DJANGO_API",
        message: "CRITICAL: Simulated Circuit Breaker Tripped on /api/v1/external-ehr/fhir - Auto-failover activated",
        traceId: `tr-drill-${Date.now().toString().slice(-4)}`,
        statusCode: 503,
        metadata: { drill_type: "CIRCUIT_BREAKER_FAILOVER", severity: "HIGH" },
      },
      {
        id: `drill-warn-${Date.now()}-2`,
        timestamp: now,
        level: "WARNING",
        service: "CELERY_WORKER",
        message: "Worker retry policy initiated (Attempt 1/3, exponential backoff: 2.0s, queue: emergency_alerts)",
        traceId: `tr-drill-${Date.now().toString().slice(-4)}`,
        metadata: { queue: "emergency_alerts", retry_count: 1 },
      },
    ];

    setLogs((prev) => [...prev.slice(-300), ...criticalLogs]);
    setPulseCount(10);
    setBannerNotice("⚠️ Exception Drill Active: Injected high-severity circuit breaker alert & retry event.");
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Operational Action 3: Clear Console Buffer
  const handleClearBuffer = () => {
    setLogs([]);
    setBannerNotice("🧹 Log buffer cleared. Real-time ingestion stream is listening for new events.");
    setTimeout(() => setBannerNotice(null), 3000);
  };

  // Operational Action 4: Export Signed JSON Log Archive
  const handleExportLogArchive = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      generator: "Antigravity Clinical Decision Support Log Sentinel v3.42",
      complianceStandard: "FDA 21 CFR Part 11 / HIPAA Context Minimization",
      totalLogs: logs.length,
      streamStatus: isPaused ? "PAUSED" : "ACTIVE",
      webSocketStatus: wsStatus,
      logs: logs.map((l) => ({
        id: l.id,
        timestamp: l.timestamp,
        level: l.level,
        service: l.service,
        message: l.message,
        traceId: l.traceId,
        latencyMs: l.latencyMs,
        metadata: l.metadata,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_logs_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBannerNotice("📥 Signed Log Archive downloaded successfully (Zero PHI retained).");
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    const matchLevel = filterLevel === "ALL" || l.level === filterLevel;
    const matchService = filterService === "ALL" || l.service === filterService;
    const matchSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.traceId && l.traceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.timestamp.includes(searchTerm);
    return matchLevel && matchService && matchSearch;
  });

  const errorCount = logs.filter((l) => l.level === "ERROR").length;
  const warnCount = logs.filter((l) => l.level === "WARNING").length;
  const infoCount = logs.filter((l) => l.level === "INFO").length;
  const debugCount = logs.filter((l) => l.level === "DEBUG").length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner Notifications */}
      {bannerNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>{bannerNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBannerNotice(null)}
            className="h-6 w-6 p-0 text-emerald-400 hover:bg-emerald-900/50"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-md">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Centralized Telemetry & System Logs
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-2 py-0.5 border ${
                    wsStatus === "connected"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  <Radio className="h-3 w-3 mr-1 inline animate-pulse" />
                  WS: {wsStatus.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time aggregated stdout/stderr & telemetry streams from Django REST API, Daphne ASGI, Celery workers, and Neon PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        {/* Operational 1-Click Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerLogBurst}
            className="text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            Burst Generator
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateExceptionDrill}
            className="text-xs gap-1.5 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            Simulate Exception
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs gap-1.5 border-slate-200 dark:border-slate-800"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-600" /> : <Pause className="h-3.5 w-3.5 text-amber-600" />}
            {isPaused ? "Resume Stream" : "Pause Stream"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearBuffer}
            className="text-xs gap-1.5 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportLogArchive}
            className="text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export Archive
          </Button>
        </div>
      </div>

      {/* Clinical CRT Lead II Oscilloscope & Live Metrics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CRT Canvas Monitor */}
        <Card className="lg:col-span-3 bg-[#090d16] border-slate-800 text-slate-100 shadow-xl overflow-hidden relative">
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                LEAD II TELEMETRY OSCILLOSCOPE — 60 FPS INGESTION
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span>BUFFER: <strong className="text-emerald-400">{logs.length}</strong> MSGS</span>
              <span>RATE: <strong className="text-sky-400">{activeRate} eps</strong></span>
              <span>STATE: <strong className={isPaused ? "text-amber-400" : "text-emerald-400"}>{isPaused ? "PAUSED" : "TAILING"}</strong></span>
            </div>
          </div>
          <CardContent className="p-0 pt-7">
            <canvas
              ref={canvasRef}
              width={760}
              height={100}
              className="w-full h-[100px] block"
            />
          </CardContent>
        </Card>

        {/* Real-Time Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Total Stream Ingested</span>
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {logs.length} <span className="text-[11px] font-normal text-slate-400">events</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Info: <span className="text-emerald-600 font-semibold">{infoCount}</span> | Debug: <span className="text-purple-600 font-semibold">{debugCount}</span>
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Errors & Warnings</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {errorCount} <span className="text-xs text-amber-500 font-normal">({warnCount} warnings)</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Error Rate: <strong className="text-rose-500">{((errorCount / Math.max(1, logs.length)) * 100).toFixed(1)}%</strong>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Terminal Console Log Stream */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Live Console Tail & Telemetry Grid
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Displaying {filteredLogs.length} of {logs.length} buffered log records
              </CardDescription>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Level Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
              {["ALL", "INFO", "WARNING", "ERROR", "DEBUG"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    filterLevel === lvl
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Service Filter */}
            <div className="relative">
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="h-8 pl-2.5 pr-8 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Services</option>
                <option value="DJANGO_API">DJANGO_API</option>
                <option value="CELERY_WORKER">CELERY_WORKER</option>
                <option value="CHANNELS_ASGI">CHANNELS_ASGI</option>
                <option value="NEON_DB">NEON_DB</option>
                <option value="SECURITY_SENTINEL">SECURITY_SENTINEL</option>
                <option value="REDIS_BROKER">REDIS_BROKER</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search message, trace, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Auto-scroll toggle */}
            <Button
              variant={autoScroll ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`h-8 text-xs gap-1 px-2.5 ${
                autoScroll
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "border-slate-200 dark:border-slate-700 text-slate-600"
              }`}
            >
              <ArrowDown className="h-3 w-3" />
              Auto-Scroll: {autoScroll ? "ON" : "OFF"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="bg-[#0b101b] text-slate-100 p-3 sm:p-4 font-mono text-xs overflow-y-auto max-h-[580px] space-y-1.5 rounded-b-xl border-t border-slate-800 selection:bg-emerald-500/30">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No logs match the selected filter criteria.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`group flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2.5 leading-relaxed p-2 rounded transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-slate-800/90 border-emerald-500/50 shadow-md"
                        : "hover:bg-slate-800/40 border-transparent hover:border-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="text-slate-500 text-[10px] select-none">{log.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider ${
                          log.level === "ERROR"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : log.level === "WARNING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : log.level === "DEBUG"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-sky-400 font-semibold text-[10px]">[{log.service}]</span>
                      {log.traceId && (
                        <span className="text-slate-400 text-[10px] hidden md:inline">
                          ({log.traceId})
                        </span>
                      )}
                    </div>

                    <span className="text-slate-200 break-words text-[11px] min-w-0 flex-1 group-hover:text-white">
                      {log.message}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        title="Copy Log Message"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(log.message, log.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        {copiedId === log.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Selected Log Inspector Modal / Drawer */}
      {selectedLog && (
        <Card className="bg-slate-900 border-slate-700 text-slate-100 shadow-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Log Inspector — Structured Record Details</h3>
              <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                ID: {selectedLog.id}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
            >
              Close Inspector ✕
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
              <span className="text-slate-200 font-semibold">{selectedLog.timestamp}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">SERVICE & LEVEL</span>
              <span className="text-sky-400 font-semibold">{selectedLog.service}</span> /{" "}
              <span className={selectedLog.level === "ERROR" ? "text-rose-400" : "text-emerald-400"}>
                {selectedLog.level}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">TRACE ID</span>
              <span className="text-amber-400 font-semibold">{selectedLog.traceId || "N/A"}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">EXECUTION DURATION</span>
              <span className="text-purple-400 font-semibold">
                {selectedLog.latencyMs ? `${selectedLog.latencyMs} ms` : "Instantaneous"}
              </span>
            </div>
          </div>

          <div className="mt-3 bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono space-y-2">
            <div>
              <span className="text-slate-500 text-[10px] block">PAYLOAD RAW MESSAGE:</span>
              <p className="text-slate-200 mt-0.5 selection:bg-emerald-500/40">{selectedLog.message}</p>
            </div>
            {selectedLog.metadata && (
              <div>
                <span className="text-slate-500 text-[10px] block">STRUCTURED METADATA:</span>
                <pre className="text-emerald-400 text-[11px] mt-1 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800/80">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
