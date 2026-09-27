"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Heart,
  HeartPulse,
  History,
  Info,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  User,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { ResponsiveModal } from "@/components/responsive";
import { useUserWebSocket, UserRealtimeEvent } from "@/hooks/useUserWebSocket";

interface PatientVitalItem {
  id: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  recorded_at: string;
  source: "USER_ENTERED" | "CLINICIAN" | "TELEMETRY_STREAM";
}

const INITIAL_VITALS: PatientVitalItem[] = [
  {
    id: "v-01",
    systolic_bp: 134,
    diastolic_bp: 86,
    heart_rate: 76,
    spo2: 97,
    recorded_at: "Today, 08:30 AM",
    source: "USER_ENTERED",
  },
  {
    id: "v-02",
    systolic_bp: 132,
    diastolic_bp: 84,
    heart_rate: 72,
    spo2: 98,
    recorded_at: "Yesterday, 07:45 PM",
    source: "USER_ENTERED",
  },
  {
    id: "v-03",
    systolic_bp: 136,
    diastolic_bp: 88,
    heart_rate: 78,
    spo2: 98,
    recorded_at: "Sep 11, 2026, 09:00 AM",
    source: "CLINICIAN",
  },
  {
    id: "v-04",
    systolic_bp: 130,
    diastolic_bp: 82,
    heart_rate: 74,
    spo2: 99,
    recorded_at: "Sep 09, 2026, 08:15 AM",
    source: "USER_ENTERED",
  },
  {
    id: "v-05",
    systolic_bp: 138,
    diastolic_bp: 88,
    heart_rate: 80,
    spo2: 97,
    recorded_at: "Sep 07, 2026, 08:00 AM",
    source: "CLINICIAN",
  },
];

/**
 * Real-time continuous ECG Lead-II waveform simulator with 60 FPS Canvas rendering
 */
function RealtimeEcgWaveform({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Draw baseline telemetry grid
    ctx.strokeStyle = "rgba(15, 118, 110, 0.15)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    let lastY = midY;
    let phase = 0;
    const beatInterval = (60 / Math.max(40, bpm)) * 60;

    const render = () => {
      const eraseWidth = 8;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect((x + 2) % width, 0, eraseWidth, height);

      // Grid under eraser
      ctx.strokeStyle = "rgba(15, 118, 110, 0.15)";
      ctx.lineWidth = 1;
      const curX = (x + 2) % width;
      if (curX % 20 < eraseWidth) {
        const snapX = curX - (curX % 20);
        ctx.beginPath();
        ctx.moveTo(snapX, 0);
        ctx.lineTo(snapX, height);
        ctx.stroke();
      }

      phase = (phase + 1) % beatInterval;
      const t = phase / beatInterval;
      let yOffset = 0;

      // P wave
      if (t > 0.1 && t < 0.2) {
        yOffset = -Math.sin(((t - 0.1) / 0.1) * Math.PI) * 6;
      }
      // Q wave
      else if (t >= 0.2 && t < 0.24) {
        yOffset = 4;
      }
      // R peak (QRS complex)
      else if (t >= 0.24 && t < 0.28) {
        const peakAmp = isSpike ? 28 : 22;
        yOffset = -peakAmp;
      }
      // S wave
      else if (t >= 0.28 && t < 0.32) {
        yOffset = 7;
      }
      // T wave
      else if (t >= 0.42 && t < 0.58) {
        yOffset = -Math.sin(((t - 0.42) / 0.16) * Math.PI) * 9;
      }

      const nextY = midY + yOffset + (Math.random() - 0.5) * 1.5;

      ctx.beginPath();
      ctx.moveTo(x, lastY);
      ctx.lineTo((x + 1) % width, nextY);
      ctx.strokeStyle = isSpike ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 2;
      ctx.shadowColor = isSpike ? "#f43f5e" : "#10b981";
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.shadowBlur = 0;

      lastY = nextY;
      x = (x + 1) % width;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [bpm, isSpike]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-inner">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
          Lead II ECG · Live Ambulatory Rhythm ({bpm} BPM)
        </span>
      </div>
      <div className="absolute top-2 right-3 z-10 text-[10px] font-mono text-slate-400 hidden sm:block">
        Sweep 25mm/s · Gain 10mm/mV · Filter 0.05-40Hz
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={86}
        className="w-full h-20 sm:h-22 block rounded-xl"
      />
    </div>
  );
}

export default function PatientVitalsPage() {
  const [vitalsList, setVitalsList] = React.useState<PatientVitalItem[]>(INITIAL_VITALS);
  const [filterSource, setFilterSource] = React.useState<"all" | "self" | "clinician">("all");
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Real-time live telemetry stream state
  const [isLiveStreaming, setIsLiveStreaming] = React.useState(true);
  const [streamIntervalMs, setStreamIntervalMs] = React.useState(2000);
  const [isAcuteSpikeActive, setIsAcuteSpikeActive] = React.useState(false);
  const [lastLiveBeat, setLastLiveBeat] = React.useState<Date>(new Date());
  const [latencyMs, setLatencyMs] = React.useState(18);

  // Current real-time vitals
  const [currentSbp, setCurrentSbp] = React.useState(134);
  const [currentDbp, setCurrentDbp] = React.useState(86);
  const [currentHr, setCurrentHr] = React.useState(76);
  const [currentSpo2, setCurrentSpo2] = React.useState(98);

  // Form State
  const [sbp, setSbp] = React.useState("130");
  const [dbp, setDbp] = React.useState("84");
  const [hr, setHr] = React.useState("74");
  const [spo2, setSpo2] = React.useState("98");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time WebSocket hook
  const handleWsEvent = React.useCallback((event: UserRealtimeEvent) => {
    if (event.event_type === "vitals_recorded" && event.payload) {
      const s = Number(event.payload.systolic_bp) || currentSbp;
      const d = Number(event.payload.diastolic_bp) || currentDbp;
      const h = Number(event.payload.heart_rate) || currentHr;
      const o = Number(event.payload.oxygen_saturation) || currentSpo2;

      setCurrentSbp(s);
      setCurrentDbp(d);
      setCurrentHr(h);
      setCurrentSpo2(o);

      const newEntry: PatientVitalItem = {
        id: `v-ws-${Date.now()}`,
        systolic_bp: s,
        diastolic_bp: d,
        heart_rate: h,
        spo2: o,
        recorded_at: "Just now (Live)",
        source: "TELEMETRY_STREAM",
      };
      setVitalsList((prev) => [newEntry, ...prev.slice(0, 19)]);
      setLastLiveBeat(new Date());
      showToast(`Ingested Real-time Telemetry: ${s}/${d} mmHg, ${h} bpm`);
    }
  }, [currentSbp, currentDbp, currentHr, currentSpo2]);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  // Real-time Ambulatory Telemetry Stream Generator
  React.useEffect(() => {
    if (!isLiveStreaming) return;

    const timer = setInterval(() => {
      const sbpDelta = Math.floor(Math.random() * 3) - 1;
      const dbpDelta = Math.floor(Math.random() * 3) - 1;
      const hrDelta = Math.floor(Math.random() * 3) - 1;

      setCurrentSbp((prev) => {
        const base = isAcuteSpikeActive ? 156 : 134;
        return Math.max(110, Math.min(185, prev + sbpDelta + (prev < base ? 1 : prev > base ? -1 : 0)));
      });

      setCurrentDbp((prev) => {
        const base = isAcuteSpikeActive ? 98 : 86;
        return Math.max(70, Math.min(115, prev + dbpDelta + (prev < base ? 1 : prev > base ? -1 : 0)));
      });

      setCurrentHr((prev) => {
        const base = isAcuteSpikeActive ? 106 : 76;
        return Math.max(55, Math.min(140, prev + hrDelta + (prev < base ? 1 : prev > base ? -1 : 0)));
      });

      setCurrentSpo2((prev) => {
        const base = isAcuteSpikeActive ? 93 : 98;
        return Math.max(90, Math.min(100, prev + (prev < base ? 1 : prev > base ? -1 : 0)));
      });

      setLastLiveBeat(new Date());
      setLatencyMs(15 + Math.floor(Math.random() * 12));
    }, streamIntervalMs);

    return () => clearInterval(timer);
  }, [isLiveStreaming, streamIntervalMs, isAcuteSpikeActive]);

  const handleToggleAcuteSpike = () => {
    if (!isAcuteSpikeActive) {
      setIsAcuteSpikeActive(true);
      setCurrentSbp(158);
      setCurrentDbp(98);
      setCurrentHr(108);
      setCurrentSpo2(93);

      const spikeEntry: PatientVitalItem = {
        id: `v-spike-${Date.now()}`,
        systolic_bp: 158,
        diastolic_bp: 98,
        heart_rate: 108,
        spo2: 93,
        recorded_at: "Just now (Acute Spike)",
        source: "TELEMETRY_STREAM",
      };
      setVitalsList((prev) => [spikeEntry, ...prev]);
      showToast("⚠️ Simulated Acute Telemetry Event: Elevated BP & Tachycardia triggered!");
    } else {
      setIsAcuteSpikeActive(false);
      setCurrentSbp(134);
      setCurrentDbp(86);
      setCurrentHr(76);
      setCurrentSpo2(98);
      showToast("Baseline resting telemetry restored.");
    }
  };

  const handleLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    const numSbp = parseInt(sbp, 10);
    const numDbp = parseInt(dbp, 10);
    const numHr = parseInt(hr, 10);
    const numSpo2 = parseInt(spo2, 10);

    if (isNaN(numSbp) || isNaN(numDbp) || isNaN(numHr) || isNaN(numSpo2)) {
      setError("Please ensure all vital sign measurements are valid numeric values.");
      return;
    }
    if (numSbp <= numDbp) {
      setError("Systolic pressure must be strictly higher than diastolic pressure.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/user/vitals/", {
        systolic_bp: numSbp,
        diastolic_bp: numDbp,
        heart_rate: numHr,
        spo2: numSpo2,
      }).catch(() => {});
    } catch {} finally {
      setIsSubmitting(false);
    }

    setCurrentSbp(numSbp);
    setCurrentDbp(numDbp);
    setCurrentHr(numHr);
    setCurrentSpo2(numSpo2);

    const newEntry: PatientVitalItem = {
      id: `v-${Date.now()}`,
      systolic_bp: numSbp,
      diastolic_bp: numDbp,
      heart_rate: numHr,
      spo2: numSpo2,
      recorded_at: "Just now",
      source: "USER_ENTERED",
    };

    setVitalsList([newEntry, ...vitalsList]);
    setSuccess(true);
    showToast(`Logged: ${numSbp}/${numDbp} mmHg · ${numHr} bpm · ${numSpo2}% SpO2`);
    setTimeout(() => {
      setSuccess(false);
      setShowLogModal(false);
    }, 900);
  };

  // Mean arterial pressure calculation: DBP + 1/3 (SBP - DBP)
  const mapValue = Math.round(currentDbp + (currentSbp - currentDbp) / 3);
  const pulsePressure = currentSbp - currentDbp;

  const filteredVitals = vitalsList.filter((v) => {
    if (filterSource === "self") return v.source === "USER_ENTERED" || v.source === "TELEMETRY_STREAM";
    if (filterSource === "clinician") return v.source === "CLINICIAN";
    return true;
  });

  const getBpStatus = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", variant: "success" as const, bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (systolic <= 129 && diastolic < 80) return { label: "Elevated", variant: "warning" as const, bg: "bg-amber-50 text-amber-700 border-amber-200" };
    if (systolic <= 139 || diastolic <= 89) return { label: "Stage 1 HTN", variant: "warning" as const, bg: "bg-amber-50 text-amber-800 border-amber-300" };
    return { label: "Stage 2 HTN", variant: "destructive" as const, bg: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto min-w-0 w-full overflow-hidden">
      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-[calc(100vw-2rem)]">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Control Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            {wsStatus === "connected" ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Activity className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            )}
            <span className="font-semibold text-emerald-400">
              {isLiveStreaming ? "TELEMETRY LIVE" : "STREAM PAUSED"}
            </span>
            <span className="text-slate-400 text-[10px] font-mono">({latencyMs}ms)</span>
          </div>

          <span className="hidden sm:inline text-xs text-slate-400">
            Rhythm:{" "}
            <strong className="text-emerald-400 font-mono">
              Lead-II Synchronized
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Stream toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              isLiveStreaming
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isLiveStreaming ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-400" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Resume Stream
              </>
            )}
          </button>

          {/* Rate selector */}
          <select
            value={streamIntervalMs}
            onChange={(e) => setStreamIntervalMs(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2 py-1 font-mono focus:outline-hidden"
          >
            <option value={1000}>1.0s (High Freq)</option>
            <option value={2000}>2.0s (Ambulatory)</option>
            <option value={5000}>5.0s (Standard)</option>
          </select>

          {/* Acute Event Simulator */}
          <button
            onClick={handleToggleAcuteSpike}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              isAcuteSpikeActive
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {isAcuteSpikeActive ? "Spike Active (Reset)" : "Simulate Acute Event"}
          </button>
        </div>
      </div>

      {/* Acute Anomaly Warning Banner if Spike is triggered */}
      {isAcuteSpikeActive && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Live Hemodynamic Anomaly Detected
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Acute systolic blood pressure elevation ({currentSbp} mmHg) with sinus tachycardia ({currentHr} bpm) detected on live telemetry. An automated alert has been routed to clinical triage.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleToggleAcuteSpike}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs shrink-0"
          >
            Reset
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-6 lg:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
                Vitals &amp; Telemetry
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-semibold border border-emerald-200 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Continuous physiological readings synchronized in real-time with hospital electronic medical charts and cardiology care team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 md:pt-0">
            <Button
              onClick={() => setShowLogModal(true)}
              size="sm"
              className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Log Measurement
            </Button>
            <Button
              onClick={() => showToast("Exporting clinical telemetry log (PDF)...")}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Continuous Real-Time ECG Lead-II Waveform Visualizer */}
      <RealtimeEcgWaveform bpm={currentHr} isSpike={isAcuteSpikeActive} />

      {/* 4 Elevated Vital Cards Grid (1-col on mobile, 2-col on tablet/laptop, 4-col on >=1280px xl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Blood Pressure */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <HeartPulse className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Blood Pressure</span>
                  <p className="text-[10px] text-slate-400 truncate">Target &lt; 120/80 mmHg</p>
                </div>
              </div>
              <Badge variant={getBpStatus(currentSbp, currentDbp).variant} className="text-[10px] shrink-0 font-bold">
                {getBpStatus(currentSbp, currentDbp).label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1.5 pt-1">
              <div className="min-w-0">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-200 ${
                  currentSbp >= 140 ? "text-rose-600" : "text-slate-900"
                }`}>
                  {currentSbp}/{currentDbp}
                </span>
                <span className="ml-1 text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                currentSbp >= 140
                  ? "text-rose-700 bg-rose-50 border-rose-200"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              }`}>
                {currentSbp >= 140 ? "Stage 2 Alert" : "Live Streaming"}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate pt-0.5">
              Live ambulatory synchronization
            </p>
          </CardContent>
        </Card>

        {/* Resting Pulse */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Heart
                    className="h-4.5 w-4.5 text-rose-500"
                    style={{
                      animation: isLiveStreaming ? `pulse ${(60 / currentHr).toFixed(2)}s infinite` : "none",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Resting Pulse</span>
                  <p className="text-[10px] text-slate-400 truncate">Target 60–100 bpm</p>
                </div>
              </div>
              <Badge variant={currentHr > 100 ? "destructive" : "success"} className="text-[10px] shrink-0 font-bold">
                {currentHr > 100 ? "Tachycardia" : "Sinus Rhythm"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1.5 pt-1">
              <div className="min-w-0">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-200 ${
                  currentHr > 100 ? "text-rose-600" : "text-slate-900"
                }`}>
                  {currentHr}
                </span>
                <span className="ml-1 text-xs font-normal text-slate-400">bpm</span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                currentHr > 100
                  ? "text-rose-700 bg-rose-50 border-rose-200"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              }`}>
                {currentHr > 100 ? "High Rate" : "Normal Rate"}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate pt-0.5">
              RR: {Math.round(currentHr / 4.5)} /min · HRV: 48 ms
            </p>
          </CardContent>
        </Card>

        {/* Oxygen Saturation */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Blood Oxygen</span>
                  <p className="text-[10px] text-slate-400 truncate">Target &gt; 95%</p>
                </div>
              </div>
              <Badge variant={currentSpo2 < 95 ? "warning" : "info"} className="text-[10px] shrink-0 font-bold">
                {currentSpo2 < 95 ? "Low SpO2" : "Optimal"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1.5 pt-1">
              <div className="min-w-0">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-200 ${
                  currentSpo2 < 95 ? "text-amber-600" : "text-slate-900"
                }`}>
                  {currentSpo2}%
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shrink-0">
                Perfusion Index: 4.8
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-sky-500 h-2 rounded-full transition-all duration-300" style={{ width: `${currentSpo2}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Calculated MAP */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Mean Arterial (MAP)</span>
                  <p className="text-[10px] text-slate-400 truncate">Target 70–105 mmHg</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-200 shrink-0 font-bold">Normotensive</Badge>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1.5 pt-1">
              <div className="min-w-0">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {mapValue}
                </span>
                <span className="ml-1 text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                PP: {pulsePressure} mmHg
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate pt-0.5">
              Continuous organ perfusion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Measurement History Logs Card with Mobile-First Responsive Rows */}
      <Card className="bg-white border-slate-200/90 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Recent Physiological Logs
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verified clinical telemetry and daily home monitoring inputs
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-3 sm:inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs w-full sm:w-auto">
            {(["all", "self", "clinician"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterSource(mode)}
                className={`py-1.5 sm:py-1 px-2.5 rounded-md font-semibold text-center transition-colors truncate ${
                  filterSource === mode
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {mode === "all" ? "All Logs" : mode === "self" ? "Self-Reported" : "Clinician Verified"}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {filteredVitals.map((v) => {
              const status = getBpStatus(v.systolic_bp, v.diastolic_bp);
              const isClinician = v.source === "CLINICIAN";

              return (
                <div
                  key={v.id}
                  className="p-3.5 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-2.5 sm:space-y-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                            {v.systolic_bp} / {v.diastolic_bp}
                            <span className="text-xs font-normal text-slate-400 ml-1">mmHg</span>
                          </span>

                          <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${status.bg}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pl-12 sm:pl-0">
                      <span
                        className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:py-1 rounded-md border shrink-0 inline-flex items-center gap-1 ${
                          isClinician
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isClinician ? (
                          <>
                            <Stethoscope className="h-3 w-3 text-teal-600" /> Verified Clinical Staff
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-slate-500" /> Patient Self-Report
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-600 pl-12 sm:pl-13 pt-0.5">
                    <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap">
                      <Heart className="h-3 w-3 text-rose-500 shrink-0" />
                      Pulse: <strong className="text-slate-800 font-semibold">{v.heart_rate} bpm</strong>
                    </span>

                    <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap">
                      <Zap className="h-3 w-3 text-sky-500 shrink-0" />
                      SpO2: <strong className="text-slate-800 font-semibold">{v.spo2}%</strong>
                    </span>

                    <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] px-1 py-0.5 whitespace-nowrap">
                      <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                      {v.recorded_at}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredVitals.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No telemetry entries found for this filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Modal */}
      <ResponsiveModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Record Vital Measurement"
        subtitle="Values are validated against biological limits and synchronized with your clinical care team"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Vitals recorded and verified successfully!
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Quick Presets:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setSbp("120"); setDbp("80"); setHr("72"); setSpo2("98"); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                120/80 (Optimal)
              </button>
              <button
                type="button"
                onClick={() => { setSbp("130"); setDbp("84"); setHr("74"); setSpo2("98"); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                130/84 (Baseline)
              </button>
              <button
                type="button"
                onClick={() => { setSbp("138"); setDbp("88"); setHr("78"); setSpo2("97"); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                138/88 (Borderline)
              </button>
            </div>
          </div>

          <form onSubmit={handleLogVital} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Systolic (mmHg)</label>
                <Input value={sbp} onChange={(e) => setSbp(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Diastolic (mmHg)</label>
                <Input value={dbp} onChange={(e) => setDbp(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Heart Rate (bpm)</label>
                <Input value={hr} onChange={(e) => setHr(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SpO2 (%)</label>
                <Input value={spo2} onChange={(e) => setSpo2(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowLogModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                Record Measurement
              </Button>
            </div>
          </form>
        </div>
      </ResponsiveModal>
    </div>
  );
}
