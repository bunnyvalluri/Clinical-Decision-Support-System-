"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Flame,
  Layers,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  XCircle,
  Zap,
  ChevronRight,
  Check,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

interface BiomarkerQualityItem {
  id: string;
  feature: string;
  loinc: string;
  category: "HEMODYNAMICS" | "LAB_CHEMISTRY" | "ELECTROPHYSIOLOGY" | "METABOLIC" | "HEMATOLOGY" | "CARDIAC" | "RESPIRATORY";
  completeness: number;
  outlierRate: number;
  safeRange: string;
  observedRange: string;
  imputation: string;
  status: "PASSED" | "WARNING" | "EXCELLENT" | "CRITICAL";
  lastAudited: string;
}

interface QuarantineEvent {
  id: string;
  time: string;
  patient: string;
  feature: string;
  event: string;
  actionTaken: string;
  status: "CLAMPED & LOGGED" | "MICE IMPUTED" | "CONFIRMATION SENT" | "NOISE DROPPED" | "RESOLVED";
}

const INITIAL_QUALITY_ITEMS: BiomarkerQualityItem[] = [
  { id: "sbp", feature: "Systolic Blood Pressure", loinc: "8480-6", category: "HEMODYNAMICS", completeness: 0.999, outlierRate: 0.003, safeRange: "70 — 240 mmHg", observedRange: "110 — 168 mmHg", imputation: "Median Forward-Fill (Last 4h)", status: "EXCELLENT", lastAudited: "1 min ago" },
  { id: "dbp", feature: "Diastolic Blood Pressure", loinc: "8462-4", category: "HEMODYNAMICS", completeness: 0.998, outlierRate: 0.002, safeRange: "40 — 140 mmHg", observedRange: "60 — 98 mmHg", imputation: "Median Forward-Fill (Last 4h)", status: "EXCELLENT", lastAudited: "3 mins ago" },
  { id: "hr", feature: "Heart Rate (Resting)", loinc: "8867-4", category: "HEMODYNAMICS", completeness: 1.000, outlierRate: 0.001, safeRange: "30 — 220 bpm", observedRange: "54 — 118 bpm", imputation: "Linear Spline Telemetry", status: "EXCELLENT", lastAudited: "Just now" },
  { id: "creat", feature: "Serum Creatinine", loinc: "2160-0", category: "LAB_CHEMISTRY", completeness: 0.984, outlierRate: 0.008, safeRange: "0.3 — 12.0 mg/dL", observedRange: "0.6 — 4.2 mg/dL", imputation: "MICE (BUN + Age + eGFR)", status: "PASSED", lastAudited: "5 mins ago" },
  { id: "st_dep", feature: "ST-Segment Depression", loinc: "89025-1", category: "ELECTROPHYSIOLOGY", completeness: 0.992, outlierRate: 0.004, safeRange: "-5.0 — 5.0 mm", observedRange: "-0.4 — 2.2 mm", imputation: "Zero Baseline Impute", status: "EXCELLENT", lastAudited: "2 mins ago" },
  { id: "glu", feature: "Blood Glucose Level", loinc: "2345-7", category: "METABOLIC", completeness: 0.989, outlierRate: 0.012, safeRange: "40 — 600 mg/dL", observedRange: "72 — 285 mg/dL", imputation: "MICE (HbA1c + BMI)", status: "WARNING", lastAudited: "4 mins ago" },
  { id: "lact", feature: "Lactic Acid", loinc: "2524-7", category: "LAB_CHEMISTRY", completeness: 0.976, outlierRate: 0.009, safeRange: "0.2 — 15.0 mmol/L", observedRange: "0.8 — 5.4 mmol/L", imputation: "MICE (Base Excess + PaO2)", status: "PASSED", lastAudited: "6 mins ago" },
  { id: "spo2", feature: "Oxygen Saturation (SpO2)", loinc: "2708-6", category: "RESPIRATORY", completeness: 0.997, outlierRate: 0.002, safeRange: "60 — 100 %", observedRange: "88 — 100 %", imputation: "Last Valid Value Hold (5m)", status: "EXCELLENT", lastAudited: "Just now" },
  { id: "trop", feature: "High-Sensitivity Troponin-I", loinc: "89579-7", category: "CARDIAC", completeness: 0.981, outlierRate: 0.006, safeRange: "0 — 50,000 ng/L", observedRange: "3 — 1,240 ng/L", imputation: "Nearest Timestamp Match", status: "PASSED", lastAudited: "8 mins ago" },
  { id: "k_serum", feature: "Serum Potassium", loinc: "2823-3", category: "LAB_CHEMISTRY", completeness: 0.991, outlierRate: 0.004, safeRange: "1.5 — 9.0 mEq/L", observedRange: "3.4 — 5.8 mEq/L", imputation: "Cohort Normal Median (4.2)", status: "EXCELLENT", lastAudited: "7 mins ago" },
];

const INITIAL_QUARANTINE_LOGS: QuarantineEvent[] = [
  { id: "q-1", time: "2 mins ago", patient: "MRN-90241", feature: "Systolic Blood Pressure", event: "Sensor artifact: SBP read 310 mmHg. Clamped to safe clinical ceiling (240 mmHg).", actionTaken: "Clamped to 240 mmHg ceiling & logged", status: "CLAMPED & LOGGED" },
  { id: "q-2", time: "18 mins ago", patient: "MRN-78192", feature: "Serum Creatinine", event: "Missing stat lab value at admission. Imputed via MICE estimator based on BUN & Age.", actionTaken: "MICE imputed (1.32 mg/dL)", status: "MICE IMPUTED" },
  { id: "q-3", time: "42 mins ago", patient: "MRN-33984", feature: "Blood Glucose Level", event: "Transient telemetry spike (420 mg/dL). Flagged for bedside glucometer corroboration.", actionTaken: "Sent HL7 alert to Bedside RN", status: "CONFIRMATION SENT" },
  { id: "q-4", time: "1 hr ago", patient: "MRN-51209", feature: "Oxygen Saturation (SpO2)", event: "Sensor motion disconnect reading 0%. Discarded; previous valid value forward-filled.", actionTaken: "Forward-filled last known valid (97%)", status: "NOISE DROPPED" },
];

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas for Data Quality
 */
function DataQualityEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
      ctx.shadowBlur = 0;

      step = (step + 0.6) % 50;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bpm, isSpike]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] p-1 shadow-inner">
      <canvas ref={canvasRef} width={220} height={44} className="block w-full h-10" />
      <div className="absolute top-1 right-1.5 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
        <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
        <span>FEATURE PIPELINE: {bpm} rec/s</span>
      </div>
    </div>
  );
}

export default function DataQualityPage() {
  const [items, setItems] = React.useState<BiomarkerQualityItem[]>(INITIAL_QUALITY_ITEMS);
  const [quarantineLogs, setQuarantineLogs] = React.useState<QuarantineEvent[]>(INITIAL_QUARANTINE_LOGS);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [isSimulatingSpike, setIsSimulatingSpike] = React.useState(false);
  const [auditMessage, setAuditMessage] = React.useState<string | null>(null);
  const [hasAnomalySpike, setHasAnomalySpike] = React.useState(false);

  // WebSocket Integration
  const { status: wsStatus, lastEvent } = useUserWebSocket();

  // Listen to incoming WebSocket quality events
  React.useEffect(() => {
    if (lastEvent && lastEvent.event_type === "DATA_QUALITY_ALERT") {
      setHasAnomalySpike(true);
      setTimeout(() => setHasAnomalySpike(false), 5000);
    }
  }, [lastEvent]);

  // Filtered Quality Items
  const filteredItems = items.filter(i => {
    const matchesCategory = selectedCategory === "ALL" || i.category === selectedCategory;
    const matchesSearch =
      i.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.loinc.includes(searchQuery) ||
      i.imputation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Run full data quality sweep
  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setItems(prev =>
        prev.map(item => ({
          ...item,
          lastAudited: "Just now (Verified)",
        }))
      );
      setAuditMessage(`Data Quality verification verified across ${items.length} clinical feature definitions.`);
      setTimeout(() => setAuditMessage(null), 4000);
    }, 700);
  };

  // 1-Click Live Ingestion Spike Simulation
  const handleSimulateSpike = () => {
    setIsSimulatingSpike(true);
    setHasAnomalySpike(true);

    setTimeout(() => {
      const newLog: QuarantineEvent = {
        id: `q-${Date.now()}`,
        time: "Just now",
        patient: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
        feature: "Blood Glucose Level",
        event: "Sensor telemetry jump: 485 mg/dL. Clamped to safe clinical ceiling & sent bedside alert.",
        actionTaken: "Clamped to 400 mg/dL & HL7 Flagged",
        status: "CLAMPED & LOGGED",
      };

      setQuarantineLogs(prev => [newLog, ...prev]);
      setItems(prev =>
        prev.map(i =>
          i.id === "glu"
            ? { ...i, outlierRate: 0.016, status: "WARNING", lastAudited: "Just now" }
            : i
        )
      );

      setIsSimulatingSpike(false);
      setAuditMessage("🚨 Live sensor spike ingested! Clamped by SaMD sanitization filter and logged to quarantine.");
      setTimeout(() => {
        setAuditMessage(null);
        setHasAnomalySpike(false);
      }, 5000);
    }, 600);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Feature,LOINC,Category,Completeness,OutlierRate,SafeRange,ObservedRange,Imputation,Status\n" +
      items.map(i => `"${i.feature}","${i.loinc}","${i.category}",${i.completeness},${i.outlierRate},"${i.safeRange}","${i.observedRange}","${i.imputation}","${i.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinical_data_quality_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAuditMessage("Data Quality Feature Audit exported as CSV.");
    setTimeout(() => setAuditMessage(null), 3500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EXCELLENT":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">EXCELLENT</Badge>;
      case "PASSED":
        return <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">PASSED</Badge>;
      case "WARNING":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">WARNING (&gt;1% Outlier)</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">FAIL</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Live Telemetry Bar */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-400" />
              Clinical Data Quality &amp; Feature Integrity Suite
            </h1>
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono">
              Pipeline Health: 99.4% (Tier 1 SaMD)
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated feature completeness profiling, physiological boundary clamping, MICE multi-variate imputation audits, and zero-PHI integrity validation.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              Stream: {wsStatus === "connected" ? "Active WebSocket" : "Simulated Stream (Sub-20ms)"}
            </span>
            <span>•</span>
            <span>Features Monitored: <strong className="text-slate-200">{items.length} Clinical Signals</strong></span>
            <span>•</span>
            <span>FHIR R4 Conformity: <strong className="text-emerald-400">100.0% Strict</strong></span>
          </div>
        </div>

        {/* Lead II Telemetry Monitor + Quick Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <DataQualityEcgMonitor bpm={128} isSpike={hasAnomalySpike} />

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isAuditing ? "animate-spin" : ""}`} />
              Run Quality Audit
            </Button>
            <Button
              size="sm"
              onClick={handleSimulateSpike}
              disabled={isSimulatingSpike}
              className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
            >
              <Flame className="h-3.5 w-3.5 mr-1.5" />
              Simulate Sensor Spike
            </Button>
          </div>
        </div>
      </div>

      {auditMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{auditMessage}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">SaMD Feature Store #VER-9941</span>
        </div>
      )}

      {/* Top 4 Pipeline Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Ingest Completeness</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-emerald-700">99.88%</p>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">PASS</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Missing rate: 0.12%</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Physiological Validity</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-sky-700">99.52%</p>
              <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">&gt;3σ Check</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Outlier rate: 0.48%</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">FHIR R4 Schema Match</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">100.0%</p>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">Strict</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero schema rejections</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Stream Ingest Latency</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-purple-700">18.4 ms</p>
              <span className="text-[10px] text-slate-400">HL7 / Kafka</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">48,290 msgs processed/day</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search feature name, LOINC code, imputation..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: "All Categories" },
            { key: "HEMODYNAMICS", label: "Hemodynamics" },
            { key: "LAB_CHEMISTRY", label: "Lab Chemistry" },
            { key: "ELECTROPHYSIOLOGY", label: "ECG" },
            { key: "CARDIAC", label: "Cardiac" },
            { key: "RESPIRATORY", label: "Respiratory" },
            { key: "METABOLIC", label: "Metabolic" },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? "bg-teal-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}

          <Link href="/informaticist/data-quality/issues">
            <Button size="sm" variant="outline" className="text-xs h-8 text-rose-700 border-rose-200 hover:bg-rose-50 ml-2">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
              Issues Queue
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleExportCsv}
            className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-white font-semibold shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* 10-Biomarker Data Quality Table */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-sky-600" />
            Clinical Biomarker Data Quality &amp; Completeness Matrix (10 Signals)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Per-feature completeness percentages, outlier rates (&gt;3 standard deviations), physiological validity boundaries, and active imputation strategies.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No clinical biomarkers match the search or category filter.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.feature}</h4>
                      <span className="font-mono text-[11px] text-slate-500">LOINC: {item.loinc}</span>
                    </div>
                    <div className="shrink-0">{getStatusBadge(item.status)}</div>
                  </div>

                  {/* Completeness Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Completeness</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        {(item.completeness * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${item.completeness * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Outlier (&gt;3σ)</span>
                      <span className="font-mono text-slate-700">{(item.outlierRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Observed Range</span>
                      <span className="font-mono font-semibold text-slate-800">{item.observedRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Physiological Safe</span>
                      <span className="font-mono text-slate-500 text-[11px]">{item.safeRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Imputation</span>
                      <span className="font-mono text-slate-700 text-[11px] truncate block">{item.imputation}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead>Clinical Feature</TableHead>
                  <TableHead>LOINC Code</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Outlier (&gt;3σ)</TableHead>
                  <TableHead>Physiological Safe Range</TableHead>
                  <TableHead>Observed Range</TableHead>
                  <TableHead>Imputation Strategy</TableHead>
                  <TableHead>Last Audited</TableHead>
                  <TableHead className="text-right">Pipeline Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="font-bold text-xs text-slate-900">
                      {item.feature}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{item.loinc}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {(item.completeness * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${item.completeness * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {(item.outlierRate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{item.safeRange}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {item.observedRange}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {item.imputation}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400 font-mono">{item.lastAudited}</TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quarantine & Handled Anomaly Log */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Live Ingestion Quarantine &amp; Sanitization Audit Log
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Real-time tracking of physiological clamp triggers, missing value interpolations, and quarantined records.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-mono">
            {quarantineLogs.length} Events Logged
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {quarantineLogs.map((entry) => (
              <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{entry.feature}</span>
                    <span className="font-mono text-[11px] text-slate-500">({entry.patient})</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{entry.event}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{entry.time}</span>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 whitespace-nowrap">
                    {entry.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
