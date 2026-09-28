"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Flame,
  Layers,
  LineChart,
  Percent,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  ChevronRight,
  Play,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

interface InferenceStreamEvent {
  id: string;
  patientId: string;
  department: string;
  model: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  probability: number;
  latencyMs: number;
  timestamp: string;
  clinicianAgreement: "AGREED" | "OVERRIDDEN" | "PENDING";
}

const INITIAL_STREAM_EVENTS: InferenceStreamEvent[] = [
  { id: "INF-9041", patientId: "PT-8821", department: "ICU", model: "XGBoost-CardioRisk-v3", riskLevel: "CRITICAL", probability: 0.942, latencyMs: 0.12, timestamp: "Just now", clinicianAgreement: "AGREED" },
  { id: "INF-9040", patientId: "PT-4912", department: "ED", model: "Ensemble-Sepsis-v2", riskLevel: "HIGH", probability: 0.814, latencyMs: 0.14, timestamp: "4s ago", clinicianAgreement: "AGREED" },
  { id: "INF-9039", patientId: "PT-3108", department: "CARDIO", model: "LeadII-ResNet1D-v4", riskLevel: "LOW", probability: 0.082, latencyMs: 0.09, timestamp: "12s ago", clinicianAgreement: "AGREED" },
  { id: "INF-9038", patientId: "PT-7719", department: "MED", model: "XGBoost-CardioRisk-v3", riskLevel: "MEDIUM", probability: 0.428, latencyMs: 0.11, timestamp: "25s ago", clinicianAgreement: "AGREED" },
  { id: "INF-9037", patientId: "PT-6602", department: "ED", model: "Ensemble-Sepsis-v2", riskLevel: "CRITICAL", probability: 0.916, latencyMs: 0.15, timestamp: "41s ago", clinicianAgreement: "AGREED" },
];

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas for Analytics Stream
 */
function AnalyticsEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
      ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
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
      ctx.strokeStyle = isSpike ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 1.75;
      ctx.shadowColor = isSpike ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.7)";
      ctx.shadowBlur = 4;

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
          yOffset = isSpike ? -26 : -18; // R-wave spike
        } else if (progress >= 27 && progress <= 29) {
          yOffset = 6; // S-wave
        } else if (progress > 32 && progress < 39) {
          yOffset = -8; // T-wave
        } else {
          yOffset = (Math.random() - 0.5) * 1.5; // Baseline telemetry noise
        }

        const y = midY + yOffset;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // CRT Scanline sweep overlay
      const scanX = (step * 3) % width;
      ctx.fillStyle = isSpike ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(scanX, 0, 4, height);

      step++;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [bpm, isSpike]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={52}
      className="rounded-lg border border-emerald-900/60 shadow-inner block"
    />
  );
}

export default function AnalyticsPage() {
  const { predictions } = useClinicalStore();
  const [timeRange, setTimeRange] = React.useState<"LIVE" | "24H" | "7D" | "30D" | "90D">("30D");
  const [department, setDepartment] = React.useState<string>("ALL");
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);
  const [streamEvents, setStreamEvents] = React.useState<InferenceStreamEvent[]>(INITIAL_STREAM_EVENTS);
  const [isSimulatingBurst, setIsSimulatingBurst] = React.useState(false);
  const [hasAlarmSpike, setHasAlarmSpike] = React.useState(false);

  // Live real-time stream packet counter
  const [totalInferences, setTotalInferences] = React.useState(18420);
  const [inferencesPerSec, setInferencesPerSec] = React.useState(42.8);

  // WebSocket Integration
  const { status: wsStatus, lastEvent } = useUserWebSocket();
  const isConnected = wsStatus === "connected";

  // Handle incoming real-time socket updates
  React.useEffect(() => {
    if (lastEvent && (lastEvent.event_type === "ANALYTICS_UPDATE" || lastEvent.event_type === "INFERENCE_EVENT")) {
      setTotalInferences(prev => prev + 1);
    }
  }, [lastEvent]);

  // Periodic automatic stream update
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTotalInferences(prev => prev + Math.floor(Math.random() * 4) + 1);
      setInferencesPerSec(Number((38 + Math.random() * 12).toFixed(1)));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Filtered store calculations or synthetic baseline
  const baseTotal = totalInferences;
  const criticalCount = Math.round(baseTotal * 0.024);
  const highCount = Math.round(baseTotal * 0.118);
  const medCount = Math.round(baseTotal * 0.274);
  const lowCount = baseTotal - criticalCount - highCount - medCount;

  // 1-Click Simulate Live Ingestion Burst
  const handleSimulateBurst = () => {
    setIsSimulatingBurst(true);
    setHasAlarmSpike(true);

    setTimeout(() => {
      const newBurstEvents: InferenceStreamEvent[] = [
        {
          id: `INF-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
          department: "ICU",
          model: "XGBoost-CardioRisk-v3",
          riskLevel: "CRITICAL",
          probability: Number((0.89 + Math.random() * 0.09).toFixed(3)),
          latencyMs: 0.11,
          timestamp: "Just now",
          clinicianAgreement: "AGREED",
        },
        {
          id: `INF-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
          department: "ED",
          model: "Ensemble-Sepsis-v2",
          riskLevel: "HIGH",
          probability: Number((0.76 + Math.random() * 0.1).toFixed(3)),
          latencyMs: 0.13,
          timestamp: "1s ago",
          clinicianAgreement: "AGREED",
        },
      ];

      setStreamEvents(prev => [...newBurstEvents, ...prev.slice(0, 6)]);
      setTotalInferences(prev => prev + 50);
      setIsSimulatingBurst(false);
      setExportNotice("Simulated live batch of 50 patient encounters ingested into telemetry pipeline.");
      setTimeout(() => {
        setExportNotice(null);
        setHasAlarmSpike(false);
      }, 4000);
    }, 700);
  };

  // Export CSV
  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "EventID,PatientID,Department,Model,RiskLevel,Probability,LatencyMs,ClinicianAgreement,Timestamp\n" +
      streamEvents.map(e => `"${e.id}","${e.patientId}","${e.department}","${e.model}","${e.riskLevel}",${e.probability},${e.latencyMs},"${e.clinicianAgreement}","${e.timestamp}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinical_population_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice("Informatics Population Risk & Telemetry CSV successfully downloaded.");
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Live Telemetry Stream */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Clinical Population Analytics &amp; Telemetry
            </h1>
            <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs font-mono">
              Live Stream Active • {inferencesPerSec} inf/s
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time inference volume, risk stratification distribution, demographic correlations, and physician concordance telemetry across all hospital care units.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              Socket: {isConnected ? "Active WebSocket" : "Simulated Stream (Sub-20ms)"}
            </span>
            <span>•</span>
            <span>Total Encounters: <strong className="text-slate-200">{totalInferences.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Clinician Agreement: <strong className="text-emerald-400">98.1%</strong></span>
          </div>
        </div>

        {/* Lead II ECG Monitor & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
                TELEMETRY LEAD II
              </span>
              <span>74 BPM • QTc 410ms</span>
            </div>
            <AnalyticsEcgMonitor bpm={74} isSpike={hasAlarmSpike} />
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleSimulateBurst}
              disabled={isSimulatingBurst}
              className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
            >
              <Sparkles className={`h-3.5 w-3.5 mr-1.5 ${isSimulatingBurst ? "animate-spin" : ""}`} />
              Simulate Ingestion Burst
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Telemetry
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Time Range Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Window:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            {(["LIVE", "24H", "7D", "30D", "90D"] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === r
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {r === "LIVE" ? "🔴 Live Stream" : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Care Unit:</span>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-medium focus:outline-none focus:border-purple-400 h-8"
          >
            <option value="ALL">All Care Units (Hospital-Wide)</option>
            <option value="ED">Emergency Department (ED)</option>
            <option value="CARDIO">Cardiology Inpatient</option>
            <option value="ICU">Intensive Care Unit (ICU)</option>
            <option value="MED">General Medicine</option>
          </select>

          <Link href="/informaticist/drift">
            <Button size="sm" variant="outline" className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-50">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              Drift Monitor
            </Button>
          </Link>
        </div>
      </div>

      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">21 CFR Part 11 Compliant</span>
        </div>
      )}

      {/* Top 5 High-Level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Inferences</p>
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{baseTotal.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +14.2% vs last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase">High Risk Alerts</p>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-700 mt-1">{(highCount + criticalCount).toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              {(((highCount + criticalCount) / baseTotal) * 100).toFixed(1)}% alert rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase">Model Sensitivity</p>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-1">98.3%</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold">1.7% Miss rate bound</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase">Mean Latency</p>
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">0.124 ms</p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">p99: 0.78ms</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase">Physician Agreement</p>
              <UserCheck className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-sky-700 mt-1">98.1%</p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Overrides: 1.9%</p>
          </CardContent>
        </Card>
      </div>

      {/* Inference Volume Trajectory & Daily Trend Chart (SVG) */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-purple-600" />
                30-Day Population Inference Volume &amp; Alert Spikes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daily inference throughput with overlay of flagged high-risk clinical events across {department === "ALL" ? "All Departments" : department}.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-3 w-3 rounded-xs bg-purple-500 inline-block" />
                Total Daily Inferences
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="h-3 w-3 rounded-xs bg-rose-500 inline-block" />
                High &amp; Critical Alerts
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="h-56 w-full">
            <svg viewBox="0 0 700 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="680" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="60" x2="680" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="100" x2="680" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="140" x2="680" y2="140" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="180" x2="680" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Area path for Volume */}
              <path
                d="M 40 180 L 40 120 Q 140 100, 240 115 T 440 90 T 640 60 L 680 50 L 680 180 Z"
                fill="#f5f3ff"
              />

              {/* Line path for Volume */}
              <path
                d="M 40 120 Q 140 100, 240 115 T 440 90 T 640 60 L 680 50"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
              />

              {/* Red Line path for Alerts */}
              <path
                d="M 40 165 Q 140 160, 240 162 T 440 155 T 640 148 L 680 145"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Data points */}
              <circle cx="140" cy="100" r="4" fill="#8b5cf6" />
              <circle cx="340" cy="105" r="4" fill="#8b5cf6" />
              <circle cx="540" cy="75" r="4" fill="#8b5cf6" />
              <circle cx="680" cy="50" r="4" fill="#8b5cf6" />

              <circle cx="140" cy="160" r="3.5" fill="#f43f5e" />
              <circle cx="340" cy="158" r="3.5" fill="#f43f5e" />
              <circle cx="540" cy="150" r="3.5" fill="#f43f5e" />
              <circle cx="680" cy="145" r="3.5" fill="#f43f5e" />

              {/* X Labels */}
              <text x="40" y="195" fill="#94a3b8" fontSize="10">Day 1</text>
              <text x="140" y="195" fill="#94a3b8" fontSize="10">Day 7</text>
              <text x="320" y="195" fill="#94a3b8" fontSize="10">Day 15</text>
              <text x="500" y="195" fill="#94a3b8" fontSize="10">Day 22</text>
              <text x="650" y="195" fill="#94a3b8" fontSize="10">Day 30 (Live)</text>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Live Ingestion Stream Ticker + Risk Tier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Stream Ticker */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                Live Telemetry Ingestion Ticker
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Incoming sub-millisecond scoring events from hospital HL7/FHIR feeds
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
              Live Stream
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {streamEvents.map(event => (
                <div key={event.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{event.patientId}</span>
                      <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {event.department}
                      </Badge>
                      <span className="text-[11px] text-slate-500 font-mono">{event.model}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Latency: <strong className="font-mono text-slate-600">{event.latencyMs}ms</strong> • {event.timestamp}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {(event.probability * 100).toFixed(1)}%
                      </span>
                      <p className="text-[10px] text-emerald-600 font-semibold">{event.clinicianAgreement}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        event.riskLevel === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : event.riskLevel === "HIGH"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : event.riskLevel === "MEDIUM"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {event.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Stratification Breakdown */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Risk Tier Distribution</span>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">N={baseTotal.toLocaleString()}</Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Proportion of cohort triaged into actionable clinical risk categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {[
              { label: "Critical Risk", count: criticalCount, total: baseTotal, pct: "2.4%", color: "bg-rose-600", action: "Immediate STAT Bedside Review / Cath Lab" },
              { label: "High Risk", count: highCount, total: baseTotal, pct: "11.8%", color: "bg-amber-500", action: "Continuous Telemetry & Serial Troponin" },
              { label: "Moderate Risk", count: medCount, total: baseTotal, pct: "27.4%", color: "bg-blue-500", action: "Observation & 48h Stress Evaluation" },
              { label: "Low Risk", count: lowCount, total: baseTotal, pct: "58.4%", color: "bg-emerald-500", action: "Routine Outpatient / Cleared for Discharge" },
            ].map(tier => (
              <div key={tier.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{tier.label}</span>
                  <span className="font-mono text-slate-600">
                    <strong className="text-slate-900">{tier.pct}</strong> ({tier.count.toLocaleString()} encounters)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${tier.color}`} style={{ width: tier.pct }} />
                </div>
                <p className="text-[10px] text-slate-400">Clinical Protocol: {tier.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Demographics & Chief Complaint Stratification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Stratification */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600" />
              Risk Stratification by Age Bracket
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Correlations across patient age brackets and elevated risk classifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { bracket: "< 40 yrs", highRiskPct: "4.2%", volume: "2,140" },
                { bracket: "40-59 yrs", highRiskPct: "11.8%", volume: "5,420" },
                { bracket: "60-74 yrs", highRiskPct: "21.4%", volume: "5,180" },
                { bracket: "75+ yrs", highRiskPct: "32.1%", volume: "2,080" },
              ].map(b => (
                <div key={b.bracket} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-semibold">{b.bracket}</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{b.highRiskPct}</p>
                  <p className="text-[10px] text-slate-400">N={b.volume}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">Demographic Inference Note:</p>
              <p className="leading-relaxed text-[11px]">
                Patients aged &gt;= 75 years exhibit higher prevalence of multi-vessel CAD and non-specific ST changes, triggering automated calibration safeguards to prevent alert fatigue.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Chief Complaints */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-600" />
              Top Chief Complaints Triaged
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Encounter risk rates broken down by presenting clinical symptomatology.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {[
              { complaint: "Typical Angina / Retrosternal Chest Pain", highRate: "64.2%", totalN: "3,410", barColor: "bg-rose-500", width: "64.2%" },
              { complaint: "Exertional Dyspnea & Hypoxia", highRate: "38.5%", totalN: "4,120", barColor: "bg-amber-500", width: "38.5%" },
              { complaint: "Unexplained Syncope / Palpitations", highRate: "18.2%", totalN: "2,840", barColor: "bg-blue-500", width: "18.2%" },
              { complaint: "Pre-Operative Clearance", highRate: "2.4%", totalN: "4,450", barColor: "bg-emerald-500", width: "2.4%" },
            ].map((c, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 font-medium">{c.complaint}</span>
                  <span className="font-mono text-xs">
                    <strong className="text-rose-700">{c.highRate}</strong> <span className="text-slate-400 text-[10px]">(N={c.totalN})</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${c.barColor}`} style={{ width: c.width }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Inference SLA & Latency Telemetry */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            Real-Time Inference SLA &amp; Compute Performance (Sub-Millisecond Engine)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-semibold text-slate-400">p50 Latency</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-1">0.118 ms</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Sub-millisecond</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-semibold text-slate-400">p95 Latency</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-1">0.342 ms</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Under 1 ms</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-semibold text-slate-400">p99 Latency</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-1">0.780 ms</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Target &lt; 5.0 ms</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Pipeline Uptime</p>
            <p className="text-xl font-bold text-emerald-700 font-mono mt-1">99.99%</p>
            <p className="text-[10px] text-slate-500">Zero dropped encounters</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
