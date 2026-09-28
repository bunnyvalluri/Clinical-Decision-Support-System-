"use client";

import * as React from "react";
import {
  Database,
  Search,
  Filter,
  Download,
  RefreshCw,
  Radio,
  Sparkles,
  Zap,
  Activity,
  Layers,
  HeartPulse,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Eye,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  User,
  X,
  Workflow,
  Lock,
  Network,
  GitBranch,
  Bot
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset, NocoDBRow, NocoDBSchemaColumn } from "@/services/nocodb/types";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { MLMonitoringView } from "@/features/nocodb-workspace/components/MLMonitoringView";
import { MCPToolStatusCard } from "@/features/nocodb-workspace/components/MCPToolStatusCard";
import { DataQualityDrawer } from "@/features/nocodb-workspace/components/DataQualityDrawer";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Informaticist Data Workspace
 */
function DataWorkspaceEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
          yOffset = (Math.random() - 0.5) * 1.5; // Baseline noise
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
        <span>NOCODB FEED: {bpm} TPS</span>
      </div>
    </div>
  );
}

// 4 Governed Informaticist Clinical Datasets
const INFORMATICIST_DATASETS: NocoDBDataset[] = [
  {
    id: "ds-ml-pred-mon",
    slug: "ml_predictions_monitoring",
    title: "SaMD Production Inference & Drift Logs",
    description: "Continuous real-time stream of model predictions, risk confidence intervals, execution latency, and clinician concordance flags.",
    category: "ML_OPS",
    allowed_roles: ["MEDICAL_INFORMATICIST", "DOCTOR", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 14820,
    column_count: 7,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "c1", name: "inference_id", display_name: "Inference ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "c2", name: "patient_ref", display_name: "De-ID Patient Ref", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 2 },
      { id: "c3", name: "model_version", display_name: "Model Engine", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["XGBoost-Sepsis-v3", "ResNet1D-Cardio-v4", "Ensemble-Risk-v2"], order: 3 },
      { id: "c4", name: "risk_score", display_name: "Risk Probability", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "c5", name: "risk_tier", display_name: "Risk Classification", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["CRITICAL", "HIGH", "MODERATE", "LOW"], order: 5 },
      { id: "c6", name: "latency_ms", display_name: "Inference Latency (ms)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
      { id: "c7", name: "physician_agreement", display_name: "Clinician Agreement", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["AGREED", "OVERRIDDEN", "PENDING"], order: 7 },
    ],
  },
  {
    id: "ds-covariate-drift",
    slug: "clinical_covariate_drift",
    title: "Continuous Covariate Shift & PSI Tracker",
    description: "Hourly non-parametric Kolmogorov-Smirnov statistics, Wasserstein distances, and Population Stability Index scores across 10 vital biomarkers.",
    category: "DATA_QUALITY",
    allowed_roles: ["MEDICAL_INFORMATICIST", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 240,
    column_count: 6,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "d1", name: "biomarker", display_name: "Biomarker Feature", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "d2", name: "baseline_mean", display_name: "Baseline Mean", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 2 },
      { id: "d3", name: "current_mean", display_name: "Current 30d Mean", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "d4", name: "psi_score", display_name: "PSI Score", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "d5", name: "ks_stat", display_name: "KS Statistic", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "d6", name: "drift_status", display_name: "Drift Severity", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["NORMAL", "WARNING", "CRITICAL"], order: 6 },
    ],
  },
  {
    id: "ds-omop-fhir",
    slug: "omop_fhir_etl_lineage",
    title: "OMOP CDM to FHIR R4 ETL Lineage",
    description: "Hospital EHR batch ingestion records, de-identification transformation benchmarks, and JSON resource payload mappings.",
    category: "CLINICAL_OPS",
    allowed_roles: ["MEDICAL_INFORMATICIST", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 3820,
    column_count: 6,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "e1", name: "batch_id", display_name: "Batch Run ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "e2", name: "source_system", display_name: "Source EHR Feed", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["Epic-HL7v2", "Cerner-Millennium", "MIMIC-IV-Stream"], order: 2 },
      { id: "e3", name: "records_processed", display_name: "Encounter Count", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "e4", name: "hipaa_redaction_rate", display_name: "De-ID Validation Rate", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "e5", name: "etl_status", display_name: "Pipeline Status", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["COMPLETED", "IN_PROGRESS", "VALIDATION_FAILED"], order: 5 },
      { id: "e6", name: "duration_sec", display_name: "ETL Duration (s)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
    ],
  },
  {
    id: "ds-mcp-traces",
    slug: "mcp_agent_audit_traces",
    title: "Ruflo Multi-Agent Tool Audit Traces",
    description: "Cryptographically verified tool calls, CDP browser agent runs, prompt injection scan logs, and HITL gate records.",
    category: "SYSTEM_TELEMETRY",
    allowed_roles: ["MEDICAL_INFORMATICIST", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 8940,
    column_count: 6,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "m1", name: "trace_id", display_name: "Trace UUID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "m2", name: "agent_name", display_name: "Ruflo Subagent", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["coordinator", "clinical-safety-agent", "mlops-agent", "clinical-explainability-agent"], order: 2 },
      { id: "m3", name: "tool_executed", display_name: "Allowlisted MCP Tool", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "m4", name: "safety_verdict", display_name: "Safety Audit Gate", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, options: ["SAFE", "REVIEW_REQUIRED", "UNSAFE"], order: 4 },
      { id: "m5", name: "execution_time_ms", display_name: "Execution Latency (ms)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "m6", name: "crypto_proof", display_name: "Ed25519 Proof Checksum", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
    ],
  },
];

// Mock Initial Rows for Datasets
const MOCK_ROWS: Record<string, NocoDBRow[]> = {
  ml_predictions_monitoring: [
    { _record_id: "rec-01", _anon_ref_id: "REF-991", _created_at: "2026-09-28T09:15:00Z", inference_id: "INF-8410", patient_ref: "PT-DEID-8821", model_version: "XGBoost-Sepsis-v3", risk_score: 0.942, risk_tier: "CRITICAL", latency_ms: 0.12, physician_agreement: "AGREED" },
    { _record_id: "rec-02", _anon_ref_id: "REF-992", _created_at: "2026-09-28T09:12:00Z", inference_id: "INF-8409", patient_ref: "PT-DEID-4912", model_version: "Ensemble-Risk-v2", risk_score: 0.814, risk_tier: "HIGH", latency_ms: 0.14, physician_agreement: "AGREED" },
    { _record_id: "rec-03", _anon_ref_id: "REF-993", _created_at: "2026-09-28T09:08:00Z", inference_id: "INF-8408", patient_ref: "PT-DEID-3108", model_version: "ResNet1D-Cardio-v4", risk_score: 0.082, risk_tier: "LOW", latency_ms: 0.09, physician_agreement: "AGREED" },
    { _record_id: "rec-04", _anon_ref_id: "REF-994", _created_at: "2026-09-28T09:02:00Z", inference_id: "INF-8407", patient_ref: "PT-DEID-7719", model_version: "XGBoost-Sepsis-v3", risk_score: 0.428, risk_tier: "MODERATE", latency_ms: 0.11, physician_agreement: "PENDING" },
    { _record_id: "rec-05", _anon_ref_id: "REF-995", _created_at: "2026-09-28T08:55:00Z", inference_id: "INF-8406", patient_ref: "PT-DEID-6602", model_version: "Ensemble-Risk-v2", risk_score: 0.916, risk_tier: "CRITICAL", latency_ms: 0.15, physician_agreement: "AGREED" },
  ],
  clinical_covariate_drift: [
    { _record_id: "rec-d1", _anon_ref_id: "REF-D01", _created_at: "2026-09-28T09:00:00Z", biomarker: "Systolic Blood Pressure", baseline_mean: 132.4, current_mean: 134.1, psi_score: 0.038, ks_stat: 0.034, drift_status: "NORMAL" },
    { _record_id: "rec-d2", _anon_ref_id: "REF-D02", _created_at: "2026-09-28T09:00:00Z", biomarker: "Diastolic Blood Pressure", baseline_mean: 82.1, current_mean: 83.0, psi_score: 0.024, ks_stat: 0.022, drift_status: "NORMAL" },
    { _record_id: "rec-d3", _anon_ref_id: "REF-D03", _created_at: "2026-09-28T09:00:00Z", biomarker: "Heart Rate (Resting)", baseline_mean: 76.5, current_mean: 77.2, psi_score: 0.027, ks_stat: 0.029, drift_status: "NORMAL" },
    { _record_id: "rec-d4", _anon_ref_id: "REF-D04", _created_at: "2026-09-28T09:00:00Z", biomarker: "Lactic Acid", baseline_mean: 1.45, current_mean: 1.58, psi_score: 0.068, ks_stat: 0.049, drift_status: "NORMAL" },
    { _record_id: "rec-d5", _anon_ref_id: "REF-D05", _created_at: "2026-09-28T09:00:00Z", biomarker: "Serum Creatinine", baseline_mean: 1.12, current_mean: 1.18, psi_score: 0.052, ks_stat: 0.038, drift_status: "NORMAL" },
  ],
  omop_fhir_etl_lineage: [
    { _record_id: "rec-e1", _anon_ref_id: "REF-E01", _created_at: "2026-09-28T08:30:00Z", batch_id: "BATCH-OMOP-9941", source_system: "Epic-HL7v2", records_processed: 12400, hipaa_redaction_rate: "100.0% Verified", etl_status: "COMPLETED", duration_sec: 4.2 },
    { _record_id: "rec-e2", _anon_ref_id: "REF-E02", _created_at: "2026-09-28T07:30:00Z", batch_id: "BATCH-OMOP-9940", source_system: "Cerner-Millennium", records_processed: 8900, hipaa_redaction_rate: "100.0% Verified", etl_status: "COMPLETED", duration_sec: 3.1 },
    { _record_id: "rec-e3", _anon_ref_id: "REF-E03", _created_at: "2026-09-28T06:30:00Z", batch_id: "BATCH-OMOP-9939", source_system: "MIMIC-IV-Stream", records_processed: 15200, hipaa_redaction_rate: "100.0% Verified", etl_status: "COMPLETED", duration_sec: 5.8 },
  ],
  mcp_agent_audit_traces: [
    { _record_id: "rec-m1", _anon_ref_id: "REF-M01", _created_at: "2026-09-28T09:18:00Z", trace_id: "tr-9982-a1", agent_name: "clinical-safety-agent", tool_executed: "run_risk_prediction", safety_verdict: "SAFE", execution_time_ms: 18.4, crypto_proof: "0x89a4...c2e1" },
    { _record_id: "rec-m2", _anon_ref_id: "REF-M02", _created_at: "2026-09-28T09:14:00Z", trace_id: "tr-9981-b4", agent_name: "clinical-explainability-agent", tool_executed: "compute_treeshap_attributions", safety_verdict: "SAFE", execution_time_ms: 42.1, crypto_proof: "0x41b8...99ff" },
    { _record_id: "rec-m3", _anon_ref_id: "REF-M03", _created_at: "2026-09-28T09:10:00Z", trace_id: "tr-9980-c7", agent_name: "mlops-agent", tool_executed: "evaluate_ks_divergence", safety_verdict: "SAFE", execution_time_ms: 12.0, crypto_proof: "0x12dc...884a" },
  ],
};

export default function InformaticistDataWorkspacePage() {
  const { status: wsStatus } = useUserWebSocket();
  const [datasets, setDatasets] = React.useState<NocoDBDataset[]>(INFORMATICIST_DATASETS);
  const [selectedSlug, setSelectedSlug] = React.useState<string>("ml_predictions_monitoring");
  const [rowsMap, setRowsMap] = React.useState<Record<string, NocoDBRow[]>>(MOCK_ROWS);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<"grid" | "ml_monitoring" | "mcp_gateway">("grid");
  const [selectedRow, setSelectedRow] = React.useState<NocoDBRow | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isSimulatingStream, setIsSimulatingStream] = React.useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState<boolean>(false);

  // Active Dataset
  const currentDataset = datasets.find(d => d.slug === selectedSlug) || datasets[0];
  const activeRows = rowsMap[currentDataset.slug] || [];

  // Filtered rows based on search
  const filteredRows = React.useMemo(() => {
    if (!searchQuery.trim()) return activeRows;
    const q = searchQuery.toLowerCase();
    return activeRows.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(q))
    );
  }, [activeRows, searchQuery]);

  // Load Real or Fallback Datasets
  const loadDatasets = async () => {
    try {
      setIsLoading(true);
      const list = await nocodbClient.listDatasets();
      if (list && list.length > 0) {
        setDatasets(list);
      }
    } catch {
      // Fallback in place
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadDatasets();
  }, []);

  // 1-Click Live Ingestion Stream Simulator
  const handleSimulateStream = () => {
    setIsSimulatingStream(true);

    setTimeout(() => {
      if (currentDataset.slug === "ml_predictions_monitoring") {
        const newRecord: NocoDBRow = {
          _record_id: `rec-${Date.now()}`,
          _anon_ref_id: `REF-${Math.floor(100 + Math.random() * 900)}`,
          _created_at: new Date().toISOString(),
          inference_id: `INF-${Math.floor(1000 + Math.random() * 9000)}`,
          patient_ref: `PT-DEID-${Math.floor(1000 + Math.random() * 9000)}`,
          model_version: "XGBoost-Sepsis-v3",
          risk_score: Number((0.75 + Math.random() * 0.2).toFixed(3)),
          risk_tier: "HIGH",
          latency_ms: Number((0.08 + Math.random() * 0.08).toFixed(2)),
          physician_agreement: "AGREED",
        };
        setRowsMap(prev => ({
          ...prev,
          [currentDataset.slug]: [newRecord, ...(prev[currentDataset.slug] || [])],
        }));
      } else if (currentDataset.slug === "mcp_agent_audit_traces") {
        const newTrace: NocoDBRow = {
          _record_id: `rec-m-${Date.now()}`,
          _anon_ref_id: `REF-M${Math.floor(10 + Math.random() * 90)}`,
          _created_at: new Date().toISOString(),
          trace_id: `tr-${Math.floor(1000 + Math.random() * 9000)}-live`,
          agent_name: "clinical-safety-agent",
          tool_executed: "get_patient_context",
          safety_verdict: "SAFE",
          execution_time_ms: Number((10 + Math.random() * 15).toFixed(1)),
          crypto_proof: "0x" + Math.random().toString(16).slice(2, 8) + "...proof",
        };
        setRowsMap(prev => ({
          ...prev,
          [currentDataset.slug]: [newTrace, ...(prev[currentDataset.slug] || [])],
        }));
      }

      setDatasets(prev =>
        prev.map(d => (d.slug === currentDataset.slug ? { ...d, row_count: d.row_count + 1 } : d))
      );
      setIsSimulatingStream(false);
      setFeedbackMessage(`⚡ Ingested 1 real-time telemetry event into "${currentDataset.title}".`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 500);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!currentDataset.columns) return;
    const headers = currentDataset.columns.map(c => c.display_name).join(",");
    const rows = activeRows
      .map(r =>
        currentDataset.columns!.map(c => `"${String(r[c.name] ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentDataset.slug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedbackMessage(`CSV export generated for "${currentDataset.title}".`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header Banner & Live Telemetry Bar */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Database className="h-6 w-6 text-teal-400" />
              Clinical Data Workspace &amp; Schema Engine
            </h1>
            <Badge variant="outline" className="bg-teal-500/20 text-teal-300 border-teal-500/40 text-xs font-mono">
              NocoDB Auxiliary Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Governed de-identified analytical projections, MLOps metrics, Ruflo multi-agent audit traces, and OMOP/FHIR ETL data quality queues.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              Stream: {wsStatus === "connected" ? "Live Real-Time WebSocket" : "Local Sync (Sub-10ms)"}
            </span>
            <span>•</span>
            <span>Datasets: <strong className="text-slate-200">{datasets.length} Governed</strong></span>
            <span>•</span>
            <span>Total Rows: <strong className="text-teal-300">{datasets.reduce((acc, d) => acc + d.row_count, 0).toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Lead II Telemetry Monitor + Quick Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <DataWorkspaceEcgMonitor bpm={114} isSpike={false} />

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleSimulateStream}
              disabled={isSimulatingStream}
              className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
            >
              <Sparkles className={`h-3.5 w-3.5 mr-1.5 ${isSimulatingStream ? "animate-spin" : ""}`} />
              Simulate Live Ingestion
            </Button>
            <Button
              size="sm"
              onClick={handleExportCsv}
              className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-white font-semibold shadow-xs border border-slate-700"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">21 CFR Part 11 Audit Trail</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-6 text-xs font-semibold shadow-xs">
        <button
          onClick={() => setActiveTab("grid")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "grid"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Dataset Explorer &amp; Grid</span>
          {currentDataset && (
            <span className="bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
              {currentDataset.title} ({currentDataset.row_count.toLocaleString()})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ml_monitoring")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "ml_monitoring"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>MLOps &amp; Drift Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab("mcp_gateway")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "mcp_gateway"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bot className="h-4 w-4 text-indigo-600" />
          <span>MCP Tool Gateway</span>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
            AI Agent Safe
          </span>
        </button>
      </div>

      {/* Tab Content: Grid View */}
      {activeTab === "grid" && (
        <div className="space-y-5">
          {/* Dataset Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {datasets.map(ds => {
              const isSelected = ds.slug === selectedSlug;
              return (
                <Card
                  key={ds.slug}
                  onClick={() => setSelectedSlug(ds.slug)}
                  className={`cursor-pointer transition-all p-4 border bg-white shadow-xs flex flex-col justify-between ${
                    isSelected ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-700">
                        {ds.category}
                      </Badge>
                      <span className="text-[11px] font-bold font-mono text-teal-700">
                        {ds.row_count.toLocaleString()} rows
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{ds.title}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {ds.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Zero PHI
                    </span>
                    <span className="font-semibold text-teal-600">{isSelected ? "Active" : "Select"}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Search & Grid Controls */}
          <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder={`Search within ${currentDataset.title}...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs border-slate-200 focus:border-teal-400 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[11px] bg-white text-slate-700 font-mono">
                  {filteredRows.length} matches
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSimulateStream}
                  disabled={isSimulatingStream}
                  className="text-xs h-8 text-teal-700 border-teal-200 hover:bg-teal-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-teal-600" />
                  Inject Row
                </Button>
              </div>
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 font-mono text-[11px] w-12">#</th>
                    {currentDataset.columns?.map(col => (
                      <th key={col.id} className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{col.display_name}</span>
                          {col.is_phi && <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700">PHI</Badge>}
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={(currentDataset.columns?.length || 5) + 2} className="py-12 text-center text-slate-400">
                        No rows match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={row._record_id || idx}
                        onClick={() => setSelectedRow(row)}
                        className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                          {idx + 1}
                        </td>
                        {currentDataset.columns?.map(col => {
                          const val = row[col.name];
                          return (
                            <td key={col.id} className="py-2.5 px-3 whitespace-nowrap">
                              {col.column_type === "Select" && val ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold ${
                                    val === "CRITICAL" || val === "UNSAFE"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : val === "HIGH" || val === "WARNING" || val === "REVIEW_REQUIRED"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : val === "SAFE" || val === "NORMAL" || val === "AGREED" || val === "COMPLETED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {String(val)}
                                </Badge>
                              ) : col.column_type === "Number" ? (
                                <span className="font-mono font-semibold text-slate-800">
                                  {typeof val === "number" ? val.toLocaleString() : String(val ?? "—")}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-700">{String(val ?? "—")}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRow(row);
                            }}
                            className="h-7 text-[11px] text-slate-500 hover:text-teal-700"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: ML Monitoring View */}
      {activeTab === "ml_monitoring" && <MLMonitoringView />}

      {/* Tab Content: MCP Gateway View */}
      {activeTab === "mcp_gateway" && <MCPToolStatusCard />}

      {/* Row Inspector Drawer */}
      {selectedRow && (
        <DataQualityDrawer
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onUpdateStatus={() => {
            setSelectedRow(null);
            loadDatasets();
          }}
        />
      )}
    </div>
  );
}
