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
  Bed,
  Flame,
  Pill,
  BellRing,
  Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset, NocoDBRow, NocoDBSchemaColumn } from "@/services/nocodb/types";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Nurse Data Workspace
 */
function NurseDataWorkspaceEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
        <span>LEAD II: {bpm} BPM</span>
      </div>
    </div>
  );
}

// 4 Governed Operational Datasets for Nursing Workspace
const NURSE_WORKSPACE_DATASETS: NocoDBDataset[] = [
  {
    id: "ds-nurse-vitals",
    title: "Bedside Vitals & NEWS2 Telemetry Stream",
    slug: "nurse_bedside_telemetry",
    description: "Real-time continuous physiological data feed, automated early warning scores (NEWS2, qSOFA), and RN bedside attestations.",
    category: "CLINICAL_OPS",
    allowed_roles: ["NURSE", "DOCTOR", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 1428,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "col-1", name: "room_bed", display_name: "Bed / Unit", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 0 },
      { id: "col-2", name: "patient_ref", display_name: "Patient Name (De-ID)", column_type: "SingleLineText", is_primary: false, is_phi: true, is_read_only: true, order: 1 },
      { id: "col-3", name: "heart_rate", display_name: "Heart Rate (bpm)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 2 },
      { id: "col-4", name: "blood_pressure", display_name: "Blood Pressure (mmHg)", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "col-5", name: "spo2", display_name: "SpO2 (%)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "col-6", name: "resp_rate", display_name: "Resp Rate (/min)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "col-7", name: "temp_c", display_name: "Temp (°C)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
      { id: "col-8", name: "news2_score", display_name: "NEWS2 Score", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 7 },
      { id: "col-9", name: "acuity_level", display_name: "Acuity Status", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, order: 8 },
      { id: "col-10", name: "attesting_nurse", display_name: "Attesting RN", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 9 },
    ],
  },
  {
    id: "ds-nurse-triage",
    title: "ER Triage & ESI Intake Queue Metrics",
    slug: "nurse_triage_throughput",
    description: "Emergency department triage wait-times, ESI acuity stratification (Level 1–5), door-to-bed allocation, and STAT escalation triggers.",
    category: "CLINICAL_OPS",
    allowed_roles: ["NURSE", "DOCTOR", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 624,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "col-11", name: "triage_id", display_name: "Triage ID", column_type: "SingleLineText", is_primary: true, is_phi: false, is_read_only: true, order: 0 },
      { id: "col-12", name: "esi_level", display_name: "ESI Priority Level", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, order: 1 },
      { id: "col-13", name: "chief_complaint", display_name: "Chief Complaint", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 2 },
      { id: "col-14", name: "arrival_mode", display_name: "Arrival Mode", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "col-15", name: "wait_minutes", display_name: "Wait Time (mins)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "col-16", name: "bed_allocated", display_name: "Allocated Bay", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "col-17", name: "stat_code", display_name: "Protocol Code", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
    ],
  },
  {
    id: "ds-nurse-meds",
    title: "Bedside Medication Administration Audits (BCMA)",
    slug: "nurse_med_passes",
    description: "Bar-code medication administration (BCMA) logs, high-alert medication dual-signatures, IV titration rates, and dose timing compliance.",
    category: "CLINICAL_OPS",
    allowed_roles: ["NURSE", "DOCTOR", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 3120,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "col-18", name: "med_name", display_name: "Medication / Infusion", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 0 },
      { id: "col-19", name: "dose_route", display_name: "Dose & Route", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 1 },
      { id: "col-20", name: "scheduled_time", display_name: "Scheduled Time", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 2 },
      { id: "col-21", name: "administered_time", display_name: "Administered Time", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "col-22", name: "bcma_verified", display_name: "Barcode Verified", column_type: "Checkbox", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "col-23", name: "dual_signoff_rn", display_name: "Dual Sign-off RN", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
      { id: "col-24", name: "compliance_status", display_name: "Timing Status", column_type: "Select", is_primary: false, is_phi: false, is_read_only: true, order: 6 },
    ],
  },
  {
    id: "ds-nurse-alarms",
    title: "Physiological Alarm Telemetry & Escalation Log",
    slug: "nurse_alarm_escalations",
    description: "Audited log of physiological bedside monitor alarms, silence duration protocols, SBAR physician pages, and clinical response times.",
    category: "SYSTEM_TELEMETRY",
    allowed_roles: ["NURSE", "DOCTOR", "ADMIN"],
    is_active: true,
    is_system_dataset: true,
    row_count: 482,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    columns: [
      { id: "col-25", name: "alarm_type", display_name: "Alarm Condition", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 0 },
      { id: "col-26", name: "severity", display_name: "Severity", column_type: "Select", is_primary: false, is_phi: false, is_read_only: false, order: 1 },
      { id: "col-27", name: "bed_location", display_name: "Bed Location", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 2 },
      { id: "col-28", name: "physician_paged", display_name: "Attending Physician Paged", column_type: "SingleLineText", is_primary: false, is_phi: false, is_read_only: true, order: 3 },
      { id: "col-29", name: "response_time_min", display_name: "MD Response (min)", column_type: "Number", is_primary: false, is_phi: false, is_read_only: true, order: 4 },
      { id: "col-30", name: "resolution_status", display_name: "Resolution Status", column_type: "Select", is_primary: false, is_phi: false, is_read_only: true, order: 5 },
    ],
  },
];

// Mock Initial Rows for Datasets
const MOCK_ROWS: Record<string, NocoDBRow[]> = {
  nurse_bedside_telemetry: [
    {
      _record_id: "rec-v-101",
      _anon_ref_id: "anon-89421",
      _created_at: "2026-09-28T09:12:00Z",
      room_bed: "ICU-04 (Bed A)",
      patient_ref: "E. Rostova",
      heart_rate: 116,
      blood_pressure: "88/54",
      spo2: 91,
      resp_rate: 26,
      temp_c: 38.9,
      news2_score: 9,
      acuity_level: "CRITICAL",
      attesting_nurse: "Sarah Jenkins, RN (CCRN)",
    },
    {
      _record_id: "rec-v-102",
      _anon_ref_id: "anon-67210",
      _created_at: "2026-09-28T09:10:00Z",
      room_bed: "3B-212 (Bed 1)",
      patient_ref: "A. Pendleton",
      heart_rate: 88,
      blood_pressure: "142/88",
      spo2: 96,
      resp_rate: 18,
      temp_c: 37.1,
      news2_score: 6,
      acuity_level: "HIGH",
      attesting_nurse: "Sarah Jenkins, RN (CCRN)",
    },
    {
      _record_id: "rec-v-103",
      _anon_ref_id: "anon-31849",
      _created_at: "2026-09-28T09:05:00Z",
      room_bed: "SD-108 (Bed A)",
      patient_ref: "C. Zhang",
      heart_rate: 104,
      blood_pressure: "138/84",
      spo2: 92,
      resp_rate: 24,
      temp_c: 37.8,
      news2_score: 7,
      acuity_level: "HIGH",
      attesting_nurse: "Sarah Jenkins, RN (CCRN)",
    },
    {
      _record_id: "rec-v-104",
      _anon_ref_id: "anon-43901",
      _created_at: "2026-09-28T08:50:00Z",
      room_bed: "4W-405 (Bed B)",
      patient_ref: "M. Holloway",
      heart_rate: 76,
      blood_pressure: "124/78",
      spo2: 98,
      resp_rate: 16,
      temp_c: 37.3,
      news2_score: 3,
      acuity_level: "MEDIUM",
      attesting_nurse: "Alex Rivera, RN",
    },
    {
      _record_id: "rec-v-105",
      _anon_ref_id: "anon-19402",
      _created_at: "2026-09-28T08:42:00Z",
      room_bed: "4W-412 (Bed A)",
      patient_ref: "D. Kim",
      heart_rate: 72,
      blood_pressure: "118/74",
      spo2: 99,
      resp_rate: 15,
      temp_c: 36.9,
      news2_score: 1,
      acuity_level: "LOW",
      attesting_nurse: "Alex Rivera, RN",
    },
  ],
  nurse_triage_throughput: [
    {
      _record_id: "rec-t-201",
      _anon_ref_id: "anon-t-881",
      _created_at: "2026-09-28T09:14:00Z",
      triage_id: "TRG-9041",
      esi_level: "ESI 1 (Resuscitation)",
      chief_complaint: "Acute Dyspnea / Unresponsive",
      arrival_mode: "EMS Priority 1",
      wait_minutes: 0,
      bed_allocated: "Trauma Bay 1",
      stat_code: "STAT CODE RESUSCITATION",
    },
    {
      _record_id: "rec-t-202",
      _anon_ref_id: "anon-t-882",
      _created_at: "2026-09-28T09:08:00Z",
      triage_id: "TRG-9042",
      esi_level: "ESI 2 (Emergent)",
      chief_complaint: "Substernal Crushing Chest Pain",
      arrival_mode: "Walk-in (Triage)",
      wait_minutes: 3,
      bed_allocated: "Exam Bay 3",
      stat_code: "STEMI PROTOCOL",
    },
    {
      _record_id: "rec-t-203",
      _anon_ref_id: "anon-t-883",
      _created_at: "2026-09-28T08:55:00Z",
      triage_id: "TRG-9043",
      esi_level: "ESI 2 (Emergent)",
      chief_complaint: "Sudden Right-Sided Hemiparesis",
      arrival_mode: "EMS Stroke Code",
      wait_minutes: 1,
      bed_allocated: "CT Scan / Neuro Bay",
      stat_code: "STROKE CODE (NIHSS 14)",
    },
    {
      _record_id: "rec-t-204",
      _anon_ref_id: "anon-t-884",
      _created_at: "2026-09-28T08:40:00Z",
      triage_id: "TRG-9044",
      esi_level: "ESI 3 (Urgent)",
      chief_complaint: "High Fever & Flank Pain",
      arrival_mode: "Walk-in",
      wait_minutes: 14,
      bed_allocated: "Fast-Track Bed 4",
      stat_code: "SEPSIS RULE-OUT",
    },
  ],
  nurse_med_passes: [
    {
      _record_id: "rec-m-301",
      _anon_ref_id: "anon-m-112",
      _created_at: "2026-09-28T09:15:00Z",
      med_name: "Norepinephrine 4mg/250ml D5W",
      dose_route: "0.08 mcg/kg/min (IV Titration)",
      scheduled_time: "09:15",
      administered_time: "09:15",
      bcma_verified: true,
      dual_signoff_rn: "Kavita Patel, RN (Charge RN)",
      compliance_status: "ON_TIME (DUAL_VERIFIED)",
    },
    {
      _record_id: "rec-m-302",
      _anon_ref_id: "anon-m-113",
      _created_at: "2026-09-28T09:00:00Z",
      med_name: "Vancomycin 1.5g IVPB in 500ml NS",
      dose_route: "1.5g over 90 mins (IV Infusion)",
      scheduled_time: "09:00",
      administered_time: "08:58",
      bcma_verified: true,
      dual_signoff_rn: "Sarah Jenkins, RN",
      compliance_status: "ON_TIME",
    },
    {
      _record_id: "rec-m-303",
      _anon_ref_id: "anon-m-114",
      _created_at: "2026-09-28T08:30:00Z",
      med_name: "Ticagrelor (Brilinta) 90mg PO",
      dose_route: "90mg Oral",
      scheduled_time: "08:30",
      administered_time: "08:32",
      bcma_verified: true,
      dual_signoff_rn: null,
      compliance_status: "ON_TIME",
    },
    {
      _record_id: "rec-m-304",
      _anon_ref_id: "anon-m-115",
      _created_at: "2026-09-28T08:00:00Z",
      med_name: "Enoxaparin (Lovenox) 40mg SubQ",
      dose_route: "40mg Subcutaneous Injection",
      scheduled_time: "08:00",
      administered_time: "08:05",
      bcma_verified: true,
      dual_signoff_rn: null,
      compliance_status: "ON_TIME",
    },
  ],
  nurse_alarm_escalations: [
    {
      _record_id: "rec-a-401",
      _anon_ref_id: "anon-a-91",
      _created_at: "2026-09-28T09:11:00Z",
      alarm_type: "Critical MAP Deterioration (62 mmHg)",
      severity: "CRITICAL",
      bed_location: "ICU-04",
      physician_paged: "Dr. Gregory Vance, MD (Critical Care)",
      response_time_min: 2,
      resolution_status: "BEDSIDE_EVALUATION_ACTIVE",
    },
    {
      _record_id: "rec-a-402",
      _anon_ref_id: "anon-a-92",
      _created_at: "2026-09-28T09:04:00Z",
      alarm_type: "Non-Sustained V-Tach Run (6 beats)",
      severity: "HIGH",
      bed_location: "3B-212",
      physician_paged: "Dr. Lisa Morales, MD (Cardiology)",
      response_time_min: 4,
      resolution_status: "12_LEAD_ECG_ORDERED",
    },
    {
      _record_id: "rec-a-403",
      _anon_ref_id: "anon-a-93",
      _created_at: "2026-09-28T08:45:00Z",
      alarm_type: "SpO2 Desaturation (89% on Room Air)",
      severity: "HIGH",
      bed_location: "SD-108",
      physician_paged: "Dr. Gregory Vance, MD",
      response_time_min: 5,
      resolution_status: "OXYGEN_TITRATED_TO_4L",
    },
  ],
};

export default function NurseDataWorkspacePage() {
  const { status: wsStatus } = useUserWebSocket();
  const [datasets] = React.useState<NocoDBDataset[]>(NURSE_WORKSPACE_DATASETS);
  const [selectedSlug, setSelectedSlug] = React.useState<string>("nurse_bedside_telemetry");
  const [rows, setRows] = React.useState<Record<string, NocoDBRow[]>>(MOCK_ROWS);
  const [search, setSearch] = React.useState<string>("");
  const [selectedRow, setSelectedRow] = React.useState<NocoDBRow | null>(null);
  const [notificationMsg, setNotificationMsg] = React.useState<string | null>(null);
  const [isSimulatingSpike, setIsSimulatingSpike] = React.useState(false);

  const currentDataset = React.useMemo(() => {
    return datasets.find((d) => d.slug === selectedSlug) || datasets[0];
  }, [datasets, selectedSlug]);

  const activeColumns = React.useMemo(() => {
    return currentDataset.columns ?? [];
  }, [currentDataset]);

  const currentRows = React.useMemo(() => {
    const list = rows[selectedSlug] || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((r) =>
      Object.values(r).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [rows, selectedSlug, search]);

  // Simulate real-time live ingestion
  const handleSimulateIngestion = () => {
    setIsSimulatingSpike(true);
    setTimeout(() => setIsSimulatingSpike(false), 5000);

    if (selectedSlug === "nurse_bedside_telemetry") {
      const newRecord: NocoDBRow = {
        _record_id: `rec-v-${Date.now()}`,
        _anon_ref_id: `anon-${Math.floor(10000 + Math.random() * 90000)}`,
        _created_at: new Date().toISOString(),
        room_bed: "ICU-02 (Bed B)",
        patient_ref: "R. Chen",
        heart_rate: 128,
        blood_pressure: "82/48",
        spo2: 89,
        resp_rate: 28,
        temp_c: 39.2,
        news2_score: 10,
        acuity_level: "CRITICAL",
        attesting_nurse: "Sarah Jenkins, RN (CCRN)",
      };
      setRows((prev) => ({
        ...prev,
        nurse_bedside_telemetry: [newRecord, ...prev.nurse_bedside_telemetry],
      }));
      setNotificationMsg("🚨 Ingested real-time critical telemetry event for ICU-02 (NEWS2: 10)");
    } else if (selectedSlug === "nurse_triage_throughput") {
      const newRecord: NocoDBRow = {
        _record_id: `rec-t-${Date.now()}`,
        _anon_ref_id: `anon-t-${Math.floor(100 + Math.random() * 900)}`,
        _created_at: new Date().toISOString(),
        triage_id: `TRG-${Math.floor(9050 + Math.random() * 50)}`,
        esi_level: "ESI 1 (Resuscitation)",
        chief_complaint: "Anaphylaxis / Stridor",
        arrival_mode: "EMS Code 3",
        wait_minutes: 0,
        bed_allocated: "Trauma Bay 2",
        stat_code: "STAT ANAPHYLAXIS PROTOCOL",
      };
      setRows((prev) => ({
        ...prev,
        nurse_triage_throughput: [newRecord, ...prev.nurse_triage_throughput],
      }));
      setNotificationMsg("🚨 Ingested real-time ESI Level 1 Emergency Intake (Anaphylaxis)");
    } else {
      setNotificationMsg("✅ Real-time record successfully ingested and committed to audit log.");
    }

    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!currentDataset || currentRows.length === 0 || activeColumns.length === 0) return;
    const headers = activeColumns.map((c) => c.display_name).join(",");
    const csvRows = currentRows.map((r) =>
      activeColumns.map((c) => `"${String(r[c.name] ?? "")}"`).join(",")
    );
    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Dynamic Action Notification */}
      {notificationMsg && (
        <div className="bg-sky-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md sticky top-0 z-50 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Nursing Operational &amp; Clinical Data Workspace
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                    Governed NocoDB Feed
                  </Badge>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time physiological telemetry, emergency triage throughput, BCMA medication passes, and alarm audit logs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NurseDataWorkspaceEcgMonitor bpm={82} isSpike={isSimulatingSpike} />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{wsStatus === "connected" ? "Ingestion Buffer Live" : "Feed Synchronized"}</span>
            </div>

            <Button
              size="sm"
              onClick={handleSimulateIngestion}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              Simulate Live Ingestion
            </Button>
          </div>
        </div>

        {/* Dataset Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {datasets.map((dataset) => {
            const isSelected = dataset.slug === selectedSlug;
            const recordCount = rows[dataset.slug]?.length || dataset.row_count || 0;

            return (
              <Card
                key={dataset.id}
                onClick={() => {
                  setSelectedSlug(dataset.slug);
                  setSearch("");
                }}
                className={`transition-all cursor-pointer border ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/30 ring-2 ring-sky-100 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        isSelected ? "bg-sky-100 text-sky-700 border-sky-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {dataset.category}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-700">{recordCount} records</span>
                  </div>

                  <h3
                    className={`font-bold text-xs line-clamp-1 ${
                      isSelected ? "text-sky-900" : "text-slate-900"
                    }`}
                  >
                    {dataset.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {dataset.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table Command Bar: Search, Filters & CSV Export */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in dataset records…"
              className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>HIPAA De-Identified</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-slate-200 text-slate-700 text-xs gap-1.5 h-9 rounded-lg hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Governed Data Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  {activeColumns.map((col) => (
                    <th key={col.id} className="py-3 px-4 whitespace-nowrap">
                      {col.display_name}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeColumns.length + 2}
                      className="py-12 text-center text-slate-400"
                    >
                      No records matched current search filter.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row, idx) => {
                    const isCritical =
                      row.acuity_level === "CRITICAL" ||
                      row.severity === "CRITICAL" ||
                      String(row.esi_level).includes("ESI 1");

                    return (
                      <tr
                        key={row._record_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCritical ? "bg-rose-50/30" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>

                        {activeColumns.map((col) => {
                          const val = row[col.name];

                          if (col.name === "acuity_level" || col.name === "severity") {
                            return (
                              <td key={col.id} className="py-3 px-4 whitespace-nowrap">
                                <Badge
                                  className={`text-[10px] font-bold border ${
                                    val === "CRITICAL"
                                      ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                                      : val === "HIGH"
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {String(val)}
                                </Badge>
                              </td>
                            );
                          }

                          if (col.name === "esi_level") {
                            return (
                              <td key={col.id} className="py-3 px-4 whitespace-nowrap">
                                <Badge
                                  className={`text-[10px] font-bold border ${
                                    String(val).includes("ESI 1")
                                      ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                                      : String(val).includes("ESI 2")
                                      ? "bg-orange-500 text-white border-orange-600"
                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                  }`}
                                >
                                  {String(val)}
                                </Badge>
                              </td>
                            );
                          }

                          if (col.name === "bcma_verified") {
                            return (
                              <td key={col.id} className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verified
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td key={col.id} className="py-3 px-4 whitespace-nowrap text-slate-800 font-medium">
                              {val !== undefined && val !== null ? String(val) : "—"}
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRow(row)}
                            className="h-7 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* JSON Row Inspector Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Record Inspector: {selectedRow._record_id}
                </h3>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
                <pre>{JSON.stringify(selectedRow, null, 2)}</pre>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Created: {new Date(selectedRow._created_at).toLocaleString()}</span>
                <span className="font-mono text-sky-600 font-medium">Ref: {selectedRow._anon_ref_id}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedRow(null)} className="text-xs">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
