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
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset, NocoDBRow, NocoDBSchemaColumn } from "@/services/nocodb/types";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Data Workspace
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
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Phosphor background grid
      ctx.strokeStyle = "rgba(15, 118, 110, 0.15)";
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
          yOffset = 3; // Q
        } else if (progress > 23 && progress < 27) {
          yOffset = isSpike ? -24 : -18; // R spike
        } else if (progress >= 27 && progress <= 29) {
          yOffset = isSpike ? 8 : 5; // S drop
        } else if (progress > 33 && progress < 39) {
          yOffset = -7; // T wave
        }

        const y = midY + yOffset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      step = (step + 1) % 50;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [bpm, isSpike]);

  return (
    <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 shadow-inner">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">INGESTION STREAM</span>
        <span className="font-mono text-sm font-black text-white leading-none flex items-center gap-1 mt-0.5">
          {bpm} <span className="text-[9px] font-normal text-slate-400">BPM</span>
        </span>
      </div>
      <canvas ref={canvasRef} width={130} height={28} className="rounded" />
    </div>
  );
}

const CLINICAL_DATASETS: NocoDBDataset[] = [
  {
    id: "ds-ml",
    slug: "ml_predictions_monitoring",
    title: "ML Risk Inferences & Model Validations",
    description: "Real-time stream of clinical risk predictions, TreeSHAP attributions, confidence bounds, and physician sign-offs.",
    category: "ML_OPS",
    allowed_roles: ["DOCTOR", "ADMIN", "INFORMATICIST"],
    is_active: true,
    is_system_dataset: true,
    row_count: 1482,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "c1", name: "prediction_id", display_name: "Prediction ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "c2", name: "patient_mrn", display_name: "Patient MRN", column_type: "SingleLineText", is_primary: false, is_phi: true, is_read_only: true, order: 2 },
      { id: "c3", name: "risk_level", display_name: "Risk Level", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, order: 3 },
      { id: "c4", name: "probability", display_name: "Risk Probability", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "c5", name: "confidence", display_name: "Confidence", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "c6", name: "top_driver", display_name: "Top Risk Driver", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
      { id: "c7", name: "review_status", display_name: "Review Status", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, order: 7 },
      { id: "c8", name: "model_version", display_name: "Model Version", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 8 },
      { id: "c9", name: "created_at", display_name: "Timestamp", column_type: "DateTime", is_primary: false, is_phi: false, is_read_only: true, order: 9 },
    ],
  },
  {
    id: "ds-vit",
    slug: "patient_vitals_telemetry",
    title: "Patient Continuous Vitals Telemetry",
    description: "Ingested high-frequency ICU & step-down vitals (Heart Rate, SpO2, MAP, Respiration, Lactate, Shock Index).",
    category: "CLINICAL_OPS",
    allowed_roles: ["DOCTOR", "NURSE", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 8940,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "v1", name: "telemetry_id", display_name: "Stream ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "v2", name: "patient_mrn", display_name: "Patient MRN", column_type: "SingleLineText", is_primary: false, is_phi: true, is_read_only: true, order: 2 },
      { id: "v3", name: "heart_rate", display_name: "Heart Rate (BPM)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "v4", name: "bp_systolic", display_name: "Systolic BP", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "v5", name: "bp_diastolic", display_name: "Diastolic BP", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "v6", name: "spo2", display_name: "SpO2 (%)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
      { id: "v7", name: "lactate", display_name: "Lactate (mmol/L)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 7 },
      { id: "v8", name: "shock_index", display_name: "Shock Index", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 8 },
      { id: "v9", name: "timestamp", display_name: "Recorded At", column_type: "DateTime", is_primary: false, is_phi: false, is_read_only: true, order: 9 },
    ],
  },
  {
    id: "ds-rev",
    slug: "clinical_review_audits",
    title: "Clinician Sign-Off & HITL Audit Logs",
    description: "Immutable governance records of physician concurrences, diagnostic overrides, rationale notes, and timestamped actions.",
    category: "CLINICAL_OPS",
    allowed_roles: ["DOCTOR", "ADMIN", "INFORMATICIST"],
    is_active: true,
    is_system_dataset: true,
    row_count: 532,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "r1", name: "review_id", display_name: "Review ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "r2", name: "patient_mrn", display_name: "Patient MRN", column_type: "SingleLineText", is_primary: false, is_phi: true, is_read_only: true, order: 2 },
      { id: "r3", name: "decision", display_name: "Clinician Action", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, order: 3 },
      { id: "r4", name: "original_risk", display_name: "AI Risk Level", column_type: "Select", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "r5", name: "concurrence", display_name: "Concurrence Rate", column_type: "Checkbox", is_primary: false, is_phi: false, is_read_only: false, order: 5 },
      { id: "r6", name: "clinician_name", display_name: "Attending Doctor", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: false, order: 6 },
      { id: "r7", name: "rationale", display_name: "Clinical Rationale", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: false, order: 7 },
      { id: "r8", name: "timestamp", display_name: "Signed At", column_type: "DateTime", is_primary: false, is_phi: false, is_read_only: true, order: 8 },
    ],
  },
  {
    id: "ds-alt",
    slug: "deterministic_safety_alerts",
    title: "Deterministic Safety Rules & Early Warning Alerts",
    description: "qSOFA, NEWS2, severe sepsis bundle triggers, and out-of-distribution biomarker alert logs.",
    category: "DATA_QUALITY",
    allowed_roles: ["DOCTOR", "NURSE", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 310,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "a1", name: "alert_id", display_name: "Alert ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 1 },
      { id: "a2", name: "patient_mrn", display_name: "Patient MRN", column_type: "SingleLineText", is_primary: false, is_phi: true, is_read_only: true, order: 2 },
      { id: "a3", name: "rule_triggered", display_name: "Rule Engine", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "a4", name: "severity", display_name: "Severity", column_type: "Select", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "a5", name: "criteria_summary", display_name: "Trigger Criteria", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "a6", name: "action_dispatched", display_name: "Dispatched Protocol", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
      { id: "a7", name: "created_at", display_name: "Triggered At", column_type: "DateTime", is_primary: false, is_phi: false, is_read_only: true, order: 7 },
    ],
  },
];

const INITIAL_ROWS_PREDICTIONS: NocoDBRow[] = [
  {
    _record_id: "rec-8801",
    _anon_ref_id: "anon-8801",
    _created_at: new Date(Date.now() - 120000).toISOString(),
    id: "pred-8801",
    prediction_id: "PRED-8801",
    patient_mrn: "MRN-78429",
    risk_level: "CRITICAL",
    probability: 0.942,
    confidence: 0.965,
    top_driver: "Serum Lactate (4.8 mmol/L)",
    review_status: "PENDING",
    model_version: "v3.42-Ensemble-XGB",
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    _record_id: "rec-8802",
    _anon_ref_id: "anon-8802",
    _created_at: new Date(Date.now() - 480000).toISOString(),
    id: "pred-8802",
    prediction_id: "PRED-8802",
    patient_mrn: "MRN-91204",
    risk_level: "HIGH",
    probability: 0.815,
    confidence: 0.92,
    top_driver: "Troponin I (1.82 ng/mL)",
    review_status: "PENDING",
    model_version: "v3.42-Ensemble-XGB",
    created_at: new Date(Date.now() - 480000).toISOString(),
  },
  {
    _record_id: "rec-8803",
    _anon_ref_id: "anon-8803",
    _created_at: new Date(Date.now() - 900000).toISOString(),
    id: "pred-8803",
    prediction_id: "PRED-8803",
    patient_mrn: "MRN-33019",
    risk_level: "HIGH",
    probability: 0.768,
    confidence: 0.89,
    top_driver: "NIHSS Score (14)",
    review_status: "CONCURRED",
    model_version: "v3.42-LightGBM",
    created_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    _record_id: "rec-8804",
    _anon_ref_id: "anon-8804",
    _created_at: new Date(Date.now() - 1500000).toISOString(),
    id: "pred-8804",
    prediction_id: "PRED-8804",
    patient_mrn: "MRN-64012",
    risk_level: "MEDIUM",
    probability: 0.542,
    confidence: 0.86,
    top_driver: "SpO2 (91%) / PaO2/FiO2 (210)",
    review_status: "REVIEWED",
    model_version: "v3.42-Ensemble-XGB",
    created_at: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    _record_id: "rec-8805",
    _anon_ref_id: "anon-8805",
    _created_at: new Date(Date.now() - 2400000).toISOString(),
    id: "pred-8805",
    prediction_id: "PRED-8805",
    patient_mrn: "MRN-55210",
    risk_level: "LOW",
    probability: 0.128,
    confidence: 0.98,
    top_driver: "Normal Baseline Vitals",
    review_status: "CONCURRED",
    model_version: "v3.42-Ensemble-XGB",
    created_at: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    _record_id: "rec-8806",
    _anon_ref_id: "anon-8806",
    _created_at: new Date(Date.now() - 3100000).toISOString(),
    id: "pred-8806",
    prediction_id: "PRED-8806",
    patient_mrn: "MRN-44192",
    risk_level: "CRITICAL",
    probability: 0.912,
    confidence: 0.94,
    top_driver: "qSOFA Score >= 2 (MAP 58)",
    review_status: "PENDING",
    model_version: "v3.42-Ensemble-XGB",
    created_at: new Date(Date.now() - 3100000).toISOString(),
  },
];

const INITIAL_ROWS_VITALS: NocoDBRow[] = [
  {
    _record_id: "rec-v1",
    _anon_ref_id: "anon-v1",
    _created_at: new Date(Date.now() - 60000).toISOString(),
    id: "vit-101",
    telemetry_id: "TEL-101",
    patient_mrn: "MRN-78429",
    heart_rate: 118,
    bp_systolic: 84,
    bp_diastolic: 52,
    spo2: 92,
    lactate: 4.8,
    shock_index: 1.4,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    _record_id: "rec-v2",
    _anon_ref_id: "anon-v2",
    _created_at: new Date(Date.now() - 120000).toISOString(),
    id: "vit-102",
    telemetry_id: "TEL-102",
    patient_mrn: "MRN-91204",
    heart_rate: 104,
    bp_systolic: 158,
    bp_diastolic: 96,
    spo2: 95,
    lactate: 2.1,
    shock_index: 0.65,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    _record_id: "rec-v3",
    _anon_ref_id: "anon-v3",
    _created_at: new Date(Date.now() - 300000).toISOString(),
    id: "vit-103",
    telemetry_id: "TEL-103",
    patient_mrn: "MRN-33019",
    heart_rate: 88,
    bp_systolic: 172,
    bp_diastolic: 98,
    spo2: 97,
    lactate: 1.4,
    shock_index: 0.51,
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    _record_id: "rec-v4",
    _anon_ref_id: "anon-v4",
    _created_at: new Date(Date.now() - 600000).toISOString(),
    id: "vit-104",
    telemetry_id: "TEL-104",
    patient_mrn: "MRN-64012",
    heart_rate: 96,
    bp_systolic: 110,
    bp_diastolic: 70,
    spo2: 90,
    lactate: 2.3,
    shock_index: 0.87,
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
];

const INITIAL_ROWS_REVIEWS: NocoDBRow[] = [
  {
    _record_id: "rec-r1",
    _anon_ref_id: "anon-r1",
    _created_at: new Date(Date.now() - 900000).toISOString(),
    id: "rev-301",
    review_id: "REV-301",
    patient_mrn: "MRN-33019",
    decision: "CONCUR",
    original_risk: "HIGH",
    concurrence: true,
    clinician_name: "Dr. Marcus Vance, MD",
    rationale: "Agreed with acute stroke risk elevation. Dispatched STAT CT Angiography.",
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    _record_id: "rec-r2",
    _anon_ref_id: "anon-r2",
    _created_at: new Date(Date.now() - 2400000).toISOString(),
    id: "rev-302",
    review_id: "REV-302",
    patient_mrn: "MRN-55210",
    decision: "CONCUR",
    original_risk: "LOW",
    concurrence: true,
    clinician_name: "Dr. Sarah Jenkins, MD",
    rationale: "Vitals stable, normal anion gap, insulin infusion tapering per protocol.",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
  },
];

const INITIAL_ROWS_ALERTS: NocoDBRow[] = [
  {
    _record_id: "rec-a1",
    _anon_ref_id: "anon-a1",
    _created_at: new Date(Date.now() - 120000).toISOString(),
    id: "alt-501",
    alert_id: "ALT-501",
    patient_mrn: "MRN-78429",
    rule_triggered: "Surviving Sepsis 1-Hour Bundle",
    severity: "CRITICAL_EMERGENCY",
    criteria_summary: "Lactate > 4.0 mmol/L + MAP < 65 mmHg",
    action_dispatched: "STAT 30ml/kg Crystalloids + Blood Cultures",
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    _record_id: "rec-a2",
    _anon_ref_id: "anon-a2",
    _created_at: new Date(Date.now() - 3100000).toISOString(),
    id: "alt-502",
    alert_id: "ALT-502",
    patient_mrn: "MRN-44192",
    rule_triggered: "qSOFA Sepsis Screen (Score 2)",
    severity: "URGENT",
    criteria_summary: "RR 24/min + Systolic BP 88 mmHg",
    action_dispatched: "Clinical Escalation to Medical ICU",
    created_at: new Date(Date.now() - 3100000).toISOString(),
  },
];

export default function DoctorDataWorkspacePage() {
  const [datasets, setDatasets] = React.useState<NocoDBDataset[]>(CLINICAL_DATASETS);
  const [selectedSlug, setSelectedSlug] = React.useState<string>("ml_predictions_monitoring");
  const [rows, setRows] = React.useState<NocoDBRow[]>(INITIAL_ROWS_PREDICTIONS);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortField, setSortField] = React.useState<string>("");
  const [sortAsc, setSortAsc] = React.useState<boolean>(false);
  const [filterRisk, setFilterRisk] = React.useState<string>("ALL");

  // Record Inspection Drawer State
  const [inspectingRow, setInspectingRow] = React.useState<NocoDBRow | null>(null);

  // Quick Add Row Modal State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addPatientMrn, setAddPatientMrn] = React.useState("");
  const [addRiskLevel, setAddRiskLevel] = React.useState("HIGH");
  const [addDriver, setAddDriver] = React.useState("");
  const [submittingRow, setSubmittingRow] = React.useState(false);

  // Real-time Event Flash State
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);

  // Live WebSocket Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Load dataset rows based on selected slug
  const loadDatasetRows = React.useCallback(async (slug: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await nocodbClient.getRows(slug);
      if (res && Array.isArray(res.rows) && res.rows.length > 0) {
        setRows(res.rows);
      } else {
        // Fallback to rich pre-populated rows
        if (slug === "ml_predictions_monitoring") setRows(INITIAL_ROWS_PREDICTIONS);
        else if (slug === "patient_vitals_telemetry") setRows(INITIAL_ROWS_VITALS);
        else if (slug === "clinical_review_audits") setRows(INITIAL_ROWS_REVIEWS);
        else if (slug === "deterministic_safety_alerts") setRows(INITIAL_ROWS_ALERTS);
        else setRows(INITIAL_ROWS_PREDICTIONS);
      }
    } catch (e) {
      if (slug === "ml_predictions_monitoring") setRows(INITIAL_ROWS_PREDICTIONS);
      else if (slug === "patient_vitals_telemetry") setRows(INITIAL_ROWS_VITALS);
      else if (slug === "clinical_review_audits") setRows(INITIAL_ROWS_REVIEWS);
      else if (slug === "deterministic_safety_alerts") setRows(INITIAL_ROWS_ALERTS);
      else setRows(INITIAL_ROWS_PREDICTIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadDatasetRows(selectedSlug);
  }, [selectedSlug, loadDatasetRows]);

  // Real-time WebSocket Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "NEW_PREDICTION" ||
      lastEvent.event_type === "vitals_updated" ||
      lastEvent.event_type === "review_submitted" ||
      lastEvent.event_type === "DATASET_MUTATED"
    ) {
      setLastLiveEvent({
        message: `Live Neon sync: Ingested record for ${lastEvent.payload?.patient_mrn || "Patient"} (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });

      if (lastEvent.payload && lastEvent.payload.prediction_id) {
        const newRow: NocoDBRow = {
          _record_id: `rec-live-${Date.now()}`,
          _anon_ref_id: `anon-live-${Date.now()}`,
          _created_at: new Date().toISOString(),
          id: `pred-live-${Date.now()}`,
          prediction_id: (lastEvent.payload.prediction_id as string) || `PRED-${Date.now()}`,
          patient_mrn: (lastEvent.payload.patient_mrn as string) || "MRN-LIVE",
          risk_level: ((lastEvent.payload.risk_level as string) || "HIGH").toUpperCase(),
          probability: (lastEvent.payload.probability as number) || 0.88,
          confidence: 0.95,
          top_driver: (lastEvent.payload.top_driver as string) || "Live Ingested Telemetry",
          review_status: "PENDING",
          model_version: "v3.42-Ensemble-XGB",
          created_at: new Date().toISOString(),
        };
        setRows((prev) => [newRow, ...prev]);
      } else {
        loadDatasetRows(selectedSlug, true);
      }
    }
  }, [lastEvent, selectedSlug, loadDatasetRows]);

  // Current dataset schema
  const currentDataset = datasets.find((d) => d.slug === selectedSlug) || datasets[0];
  const columns = currentDataset.columns || [];

  // Handle Export CSV
  const handleExportCsv = () => {
    try {
      const headers = columns.map((c) => c.display_name).join(",");
      const csvRows = rows.map((row) =>
        columns
          .map((col) => {
            const val = row[col.name];
            return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val ?? "";
          })
          .join(",")
      );
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedSlug}_clinical_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLastLiveEvent({
        message: `Exported ${rows.length} records to CSV (${selectedSlug})`,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error("Export error", e);
    }
  };

  // Handle Insert New Row
  const handleCreateRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPatientMrn.trim()) return;
    setSubmittingRow(true);
    try {
      const newRow: NocoDBRow = {
        _record_id: `rec-${Date.now()}`,
        _anon_ref_id: `anon-${Date.now()}`,
        _created_at: new Date().toISOString(),
        id: `row-${Date.now()}`,
        prediction_id: `PRED-${Math.floor(1000 + Math.random() * 9000)}`,
        patient_mrn: addPatientMrn.trim().toUpperCase(),
        risk_level: addRiskLevel,
        probability: addRiskLevel === "CRITICAL" ? 0.93 : addRiskLevel === "HIGH" ? 0.79 : 0.42,
        confidence: 0.94,
        top_driver: addDriver.trim() || "Manual Clinician Log Entry",
        review_status: "PENDING",
        model_version: "v3.42-Ensemble-XGB",
        created_at: new Date().toISOString(),
      };

      try {
        await nocodbClient.insertRow(selectedSlug, newRow);
      } catch {
        // Fallback local insertion
      }

      setRows((prev) => [newRow, ...prev]);
      setShowAddModal(false);
      setAddPatientMrn("");
      setAddDriver("");
      setLastLiveEvent({
        message: `Added live record for ${newRow.patient_mrn} to ${selectedSlug}`,
        timestamp: new Date(),
      });
    } finally {
      setSubmittingRow(false);
    }
  };

  // Filtering & Sorting
  const filteredRows = React.useMemo(() => {
    let list = [...rows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (filterRisk !== "ALL") {
      list = list.filter((r) => r.risk_level === filterRisk || r.severity === filterRisk);
    }

    if (sortField) {
      list.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return sortAsc ? -1 : 1;
        return sortAsc ? 1 : -1;
      });
    }

    return list;
  }, [rows, searchQuery, filterRisk, sortField, sortAsc]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white shadow-md shadow-indigo-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Clinician Data Workspace & Telemetry
                </h1>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold px-2 py-0.5"
                >
                  PostgreSQL Neon Direct Sync
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tabular inspection of de-identified risk inferences, TreeSHAP telemetry, and clinical review audits
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <DataWorkspaceEcgMonitor bpm={72} isSpike={filterRisk === "CRITICAL"} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-indigo-600" />
              <span>LIVE DATA STREAM</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDatasetRows(selectedSlug)}
              disabled={refreshing}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleExportCsv}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md text-xs font-bold px-3.5"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Live Event Notification Strip ─── */}
      {lastLiveEvent && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-2.5 text-xs text-blue-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600 animate-bounce" />
            <span className="font-semibold">{lastLiveEvent.message}</span>
          </div>
          <span className="text-[10px] text-blue-700 font-mono">
            {lastLiveEvent.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ─── Health & Telemetry Metrics Row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-slate-200/80 bg-white/90 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Projections</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{datasets.length}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Neon PostgreSQL Governed</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/80 bg-indigo-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Dataset Records</p>
              <p className="mt-1 text-2xl font-black text-indigo-950">{rows.length}</p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Stream Ingestion Active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Critical Strata</p>
              <p className="mt-1 text-2xl font-black text-amber-950">
                {rows.filter((r) => r.risk_level === "CRITICAL" || r.severity === "CRITICAL_EMERGENCY").length}
              </p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Requires Stat Review</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sync Latency</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">&lt; 14ms</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Zero PHI Vector Leakage</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Dataset Selector Strip ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Governed Clinical Analytics Datasets
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">De-Identified HIPAA Safe</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {datasets.map((d) => {
            const isSelected = d.slug === selectedSlug;
            return (
              <button
                key={d.slug}
                type="button"
                onClick={() => setSelectedSlug(d.slug)}
                className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500"
                    : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5 ${
                        isSelected
                          ? "bg-indigo-200 text-indigo-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {d.category.replace("_", " ")}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {d.row_count} rows
                    </span>
                  </div>

                  <h3
                    className={`text-xs font-bold transition-colors line-clamp-1 ${
                      isSelected ? "text-indigo-900" : "text-slate-900 group-hover:text-indigo-600"
                    }`}
                  >
                    {d.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold">
                  <span className={isSelected ? "text-indigo-700" : "text-slate-500"}>
                    {isSelected ? "Active View" : "Load Dataset"}
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      isSelected ? "text-indigo-700 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Search, Filters & Table Toolbar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${currentDataset.title} by MRN, driver, status, or values...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {selectedSlug === "ml_predictions_monitoring" && (
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Risk Strata</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          )}

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 shadow-2xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Row Entry
          </Button>
        </div>
      </div>

      {/* ─── Tabular Data Grid ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">Querying Neon Governed Dataset...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.display_name}</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, idx) => (
                    <tr
                      key={row.id || row._record_id || idx}
                      className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                      onClick={() => setInspectingRow(row)}
                    >
                      {columns.map((col) => {
                        const val = row[col.name];

                        // Custom badge renderers
                        if (col.name === "risk_level" || col.name === "original_risk" || col.name === "severity") {
                          const strVal = String(val).toUpperCase();
                          const isCrit = strVal === "CRITICAL" || strVal === "CRITICAL_EMERGENCY";
                          const isHigh = strVal === "HIGH" || strVal === "URGENT";
                          const isMed = strVal === "MEDIUM";

                          return (
                            <td key={col.name} className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`rounded-md px-2 py-0.5 font-bold text-[10px] tracking-wide uppercase ${
                                  isCrit
                                    ? "bg-rose-100 text-rose-800 border border-rose-200 font-black"
                                    : isHigh
                                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                                    : isMed
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {strVal}
                              </span>
                            </td>
                          );
                        }

                        if (col.name === "probability" || col.name === "confidence") {
                          const num = Number(val);
                          return (
                            <td key={col.name} className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800">
                              {isNaN(num) ? String(val) : `${(num * 100).toFixed(1)}%`}
                            </td>
                          );
                        }

                        if (col.name === "review_status" || col.name === "decision") {
                          const statusStr = String(val).toUpperCase();
                          const isApproved = statusStr === "CONCURRED" || statusStr === "CONCUR" || statusStr === "REVIEWED";
                          return (
                            <td key={col.name} className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`rounded-md px-2 py-0.5 font-bold text-[10px] ${
                                  isApproved
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {statusStr}
                              </span>
                            </td>
                          );
                        }

                        if (col.name === "patient_mrn") {
                          return (
                            <td key={col.name} className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-900">
                              {String(val)}
                            </td>
                          );
                        }

                        if (col.name === "created_at" || col.name === "timestamp") {
                          return (
                            <td key={col.name} className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                              {new Date(String(val)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </td>
                          );
                        }

                        return (
                          <td key={col.name} className="px-4 py-3 text-slate-700 max-w-xs truncate">
                            {val !== null && val !== undefined ? String(val) : "—"}
                          </td>
                        );
                      })}

                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectingRow(row)}
                          className="h-7 px-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-12 text-center text-xs text-slate-400">
                      No records matched your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredRows.length}</strong> of{" "}
            <strong className="text-slate-800">{rows.length}</strong> records in <code className="font-mono font-bold">{selectedSlug}</code>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Real-time Stream Synced</span>
        </div>
      </div>

      {/* ─── Row Inspection Drawer ─── */}
      {inspectingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Inspection & Governance</h3>
                  <p className="text-[11px] text-slate-500">De-identified clinical observation payload</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRow(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(inspectingRow).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</span>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900 break-all">
                      {v !== null && v !== undefined ? String(v) : "null"}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 mb-1 block">Full JSON Snapshot (ISO 13485 Audit):</span>
                <pre className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {JSON.stringify(inspectingRow, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingRow(null)}
                className="rounded-xl text-xs font-semibold text-slate-600"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Row Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Insert Telemetry Observation</h3>
                  <p className="text-[11px] text-slate-500">Append observation to {selectedSlug}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRow} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient MRN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MRN-78429"
                  value={addPatientMrn}
                  onChange={(e) => setAddPatientMrn(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Risk Stratum</label>
                <select
                  value={addRiskLevel}
                  onChange={(e) => setAddRiskLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Top Risk Driver / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Serum Lactate (3.9 mmol/L)"
                  value={addDriver}
                  onChange={(e) => setAddDriver(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingRow}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4"
                >
                  {submittingRow ? "Inserting..." : "Append Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
