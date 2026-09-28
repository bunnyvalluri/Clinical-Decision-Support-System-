"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  ChevronRight,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Activity,
  Plus,
  Search,
  Filter,
  Radio,
  RefreshCw,
  Zap,
  HeartPulse,
  Stethoscope,
  Sparkles,
  User,
  Users,
  Thermometer,
  PhoneCall,
  Bed,
  Shield,
  Layers,
  ArrowUpDown,
  Eye,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Nurse Triage
 */
function TriageEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ER TRIAGE STREAM</span>
        <span className="font-mono text-sm font-black text-white leading-none flex items-center gap-1 mt-0.5">
          {bpm} <span className="text-[9px] font-normal text-slate-400">BPM</span>
        </span>
      </div>
      <canvas ref={canvasRef} width={130} height={28} className="rounded" />
    </div>
  );
}

export type TriageStatus = "WAITING" | "TRIAGE_IN_PROGRESS" | "TRIAGED" | "ESCALATED" | "COMPLETED";
export type EsiLevel = 1 | 2 | 3 | 4 | 5;

export interface TriagePatientItem {
  id: string;
  mrn: string;
  patient: string;
  age: number;
  gender: string;
  chief: string;
  status: TriageStatus;
  priority: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  esiLevel: EsiLevel;
  arrived: string;
  assignedBay: string;
  bp?: string;
  hr?: number;
  spo2?: number;
  rr?: number;
  temp?: number;
}

const STATUS_CONFIG: Record<TriageStatus, { label: string; color: string; bg: string }> = {
  WAITING: { label: "Waiting in Lobby", color: "text-amber-800", bg: "bg-amber-50 border-amber-200" },
  TRIAGE_IN_PROGRESS: { label: "In Progress", color: "text-blue-800", bg: "bg-blue-50 border-blue-200" },
  TRIAGED: { label: "Triaged & Assigned", color: "text-emerald-800", bg: "bg-emerald-50 border-emerald-200" },
  ESCALATED: { label: "STAT Escalated", color: "text-rose-800", bg: "bg-rose-50 border-rose-200" },
  COMPLETED: { label: "Encounter Completed", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
};

const ESI_CONFIG: Record<EsiLevel, { label: string; bg: string; text: string; border: string }> = {
  1: { label: "ESI 1 · Resuscitation", bg: "bg-rose-100", text: "text-rose-900 font-black", border: "border-rose-300" },
  2: { label: "ESI 2 · Emergent", bg: "bg-orange-100", text: "text-orange-900 font-bold", border: "border-orange-300" },
  3: { label: "ESI 3 · Urgent", bg: "bg-amber-100", text: "text-amber-900 font-bold", border: "border-amber-300" },
  4: { label: "ESI 4 · Semi-Urgent", bg: "bg-sky-100", text: "text-sky-900 font-semibold", border: "border-sky-300" },
  5: { label: "ESI 5 · Non-Urgent", bg: "bg-slate-100", text: "text-slate-800 font-medium", border: "border-slate-300" },
};

const INITIAL_TRIAGE_ITEMS: TriagePatientItem[] = [
  {
    id: "t-001",
    mrn: "MRN-78429",
    patient: "Elena Rostova",
    age: 64,
    gender: "Female",
    chief: "Severe Sepsis, altered mental status, MAP 58 mmHg",
    status: "ESCALATED",
    priority: "CRITICAL",
    esiLevel: 1,
    arrived: "08:14",
    assignedBay: "Resus Bay 01",
    bp: "84/52",
    hr: 118,
    spo2: 92,
    rr: 24,
    temp: 39.1,
  },
  {
    id: "t-002",
    mrn: "MRN-91204",
    patient: "Arthur Pendleton",
    age: 58,
    gender: "Male",
    chief: "Crushing substernal chest pain radiating to left jaw, diaphoresis",
    status: "TRIAGE_IN_PROGRESS",
    priority: "HIGH",
    esiLevel: 2,
    arrived: "08:26",
    assignedBay: "Cardiac Bay 03",
    bp: "158/96",
    hr: 104,
    spo2: 95,
    rr: 20,
    temp: 37.0,
  },
  {
    id: "t-003",
    mrn: "MRN-33019",
    patient: "Clara Oswald",
    age: 49,
    gender: "Female",
    chief: "Acute right-sided hemiparesis & expressive aphasia (NIHSS 14)",
    status: "TRIAGED",
    priority: "HIGH",
    esiLevel: 2,
    arrived: "08:42",
    assignedBay: "Stroke Bay 02",
    bp: "172/98",
    hr: 88,
    spo2: 97,
    rr: 18,
    temp: 36.8,
  },
  {
    id: "t-004",
    mrn: "MRN-64012",
    patient: "Gregory House",
    age: 62,
    gender: "Male",
    chief: "Progressive dyspnea, dry cough, bilateral lung crackles",
    status: "WAITING",
    priority: "MEDIUM",
    esiLevel: 3,
    arrived: "09:05",
    assignedBay: "Triage Chair 04",
    bp: "110/70",
    hr: 96,
    spo2: 90,
    rr: 22,
    temp: 37.4,
  },
  {
    id: "t-005",
    mrn: "MRN-55210",
    patient: "Maya Lin",
    age: 42,
    gender: "Female",
    chief: "Nausea, vomiting, polydipsia, blood glucose 420 mg/dL",
    status: "TRIAGED",
    priority: "MEDIUM",
    esiLevel: 3,
    arrived: "09:18",
    assignedBay: "Treatment Bay 08",
    bp: "124/78",
    hr: 86,
    spo2: 98,
    rr: 16,
    temp: 36.9,
  },
  {
    id: "t-006",
    mrn: "MRN-22941",
    patient: "David Kim",
    age: 35,
    gender: "Male",
    chief: "Right lower quadrant abdominal pain, fever 38.4°C",
    status: "WAITING",
    priority: "MEDIUM",
    esiLevel: 3,
    arrived: "09:30",
    assignedBay: "Lobby Waiting",
    bp: "128/82",
    hr: 82,
    spo2: 99,
    rr: 16,
    temp: 38.4,
  },
];

export default function NurseTriagePage() {
  const [patients, setPatients] = React.useState<TriagePatientItem[]>(INITIAL_TRIAGE_ITEMS);
  const [filter, setFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState<string>("");
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);

  // Quick Intake Modal State
  const [showIntakeModal, setShowIntakeModal] = React.useState(false);
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newAge, setNewAge] = React.useState("52");
  const [newGender, setNewGender] = React.useState("Female");
  const [newChief, setNewChief] = React.useState("");
  const [newEsiLevel, setNewEsiLevel] = React.useState<EsiLevel>(2);
  const [newBay, setNewBay] = React.useState("ER Bay 05");

  // Vitals Modal State
  const [vitalsModalPatient, setVitalsModalPatient] = React.useState<TriagePatientItem | null>(null);
  const [vBp, setVBp] = React.useState("120/80");
  const [vHr, setVHr] = React.useState("75");
  const [vSpo2, setVSpo2] = React.useState("98");
  const [vRr, setVRr] = React.useState("16");
  const [vTemp, setVTemp] = React.useState("37.0");

  // Inspect Modal State
  const [inspectingPatient, setInspectingPatient] = React.useState<TriagePatientItem | null>(null);

  // Live WebSocket Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Handle Real-time WebSocket Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "patient_admitted" ||
      lastEvent.event_type === "vitals_updated" ||
      lastEvent.event_type === "triage_escalated" ||
      lastEvent.event_type === "NEW_PREDICTION"
    ) {
      const payload = (lastEvent.payload || {}) as Record<string, any>;
      setLastLiveEvent({
        message: `Real-time ER Telemetry: Ingested update for ${payload.patient_mrn || "Patient"} (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });

      if (lastEvent.event_type === "vitals_updated" && payload.patient_mrn) {
        setPatients((prev) =>
          prev.map((p) => {
            if (p.mrn === payload.patient_mrn) {
              return {
                ...p,
                bp: `${payload.sbp || 120}/${payload.dbp || 80}`,
                hr: Number(payload.hr || p.hr || 75),
                spo2: Number(payload.spo2 || p.spo2 || 98),
                rr: Number(payload.rr || p.rr || 16),
                temp: Number(payload.temp || p.temp || 37.0),
              };
            }
            return p;
          })
        );
      }
    }
  }, [lastEvent]);

  // Handle Quick State Advancement
  const handleAdvanceStatus = (patientId: string, nextStatus: TriageStatus) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status: nextStatus } : p))
    );
    setLastLiveEvent({
      message: `Updated triage status to ${nextStatus}`,
      timestamp: new Date(),
    });
  };

  // Handle Quick Intake Form Submit
  const handleCreateIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newId = `t-${Date.now().toString().slice(-4)}`;
    const newMrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
    const isHigh = newEsiLevel <= 2;

    const newPatient: TriagePatientItem = {
      id: newId,
      mrn: newMrn,
      patient: newPatientName.trim(),
      age: Number(newAge) || 45,
      gender: newGender,
      chief: newChief.trim() || "Acute symptoms under triage assessment",
      status: "WAITING",
      priority: newEsiLevel === 1 ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM",
      esiLevel: newEsiLevel,
      arrived: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      assignedBay: newBay,
      bp: "120/80",
      hr: 78,
      spo2: 98,
      rr: 16,
      temp: 37.0,
    };

    setPatients((prev) => [newPatient, ...prev]);
    setShowIntakeModal(false);
    setNewPatientName("");
    setNewChief("");
    setLastLiveEvent({
      message: `Admitted new ER triage patient ${newPatient.patient} (${newPatient.mrn})`,
      timestamp: new Date(),
    });
  };

  // Open Vitals Modal
  const handleOpenVitals = (p: TriagePatientItem) => {
    setVitalsModalPatient(p);
    setVBp(p.bp || "120/80");
    setVHr(String(p.hr || 75));
    setVSpo2(String(p.spo2 || 98));
    setVRr(String(p.rr || 16));
    setVTemp(String(p.temp || 37.0));
  };

  // Save Vitals
  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsModalPatient) return;

    setPatients((prev) =>
      prev.map((p) =>
        p.id === vitalsModalPatient.id
          ? {
              ...p,
              bp: vBp,
              hr: Number(vHr),
              spo2: Number(vSpo2),
              rr: Number(vRr),
              temp: Number(vTemp),
              status: p.status === "WAITING" ? "TRIAGE_IN_PROGRESS" : p.status,
            }
          : p
      )
    );

    setVitalsModalPatient(null);
    setLastLiveEvent({
      message: `Vitals recorded for ${vitalsModalPatient.patient}: HR ${vHr}, SpO2 ${vSpo2}%, BP ${vBp}`,
      timestamp: new Date(),
    });
  };

  // 1-Click Rapid Escalation
  const handleEscalate = (p: TriagePatientItem) => {
    setPatients((prev) =>
      prev.map((item) =>
        item.id === p.id
          ? { ...item, status: "ESCALATED", priority: "CRITICAL", esiLevel: 1 }
          : item
      )
    );
    setLastLiveEvent({
      message: `🚨 STAT RAPID ESCALATION: ${p.patient} (${p.mrn}) dispatched to Attending Physician`,
      timestamp: new Date(),
    });
  };

  // Metrics
  const totalCount = patients.length;
  const waitingCount = patients.filter((p) => p.status === "WAITING").length;
  const inProgressCount = patients.filter((p) => p.status === "TRIAGE_IN_PROGRESS").length;
  const escalatedCount = patients.filter((p) => p.status === "ESCALATED").length;
  const esi1Count = patients.filter((p) => p.esiLevel === 1).length;

  const filtered = patients.filter((t) => {
    const matchFilter = filter === "ALL" || t.status === filter;
    const matchSearch =
      t.patient.toLowerCase().includes(search.toLowerCase()) ||
      t.chief.toLowerCase().includes(search.toLowerCase()) ||
      t.mrn.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedBay.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Emergency Triage & Acuity Queue
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5"
                >
                  ESI Level 1–5 Protocol
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time emergency department arrival intake, continuous physiological vitals, and physician rapid escalation
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <TriageEcgMonitor bpm={esi1Count > 0 ? 118 : 74} isSpike={esi1Count > 0} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
              <span>LIVE TRIAGE ACTIVE</span>
            </div>

            <Button
              size="sm"
              onClick={() => setShowIntakeModal(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 text-xs font-bold px-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Intake Patient
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Live Event Notification Strip ─── */}
      {lastLiveEvent && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-xs text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600 animate-bounce" />
            <span className="font-semibold">{lastLiveEvent.message}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">
            {lastLiveEvent.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ─── ESI Acuity & Triage Metrics Row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-amber-200/80 bg-amber-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Waiting in Lobby</p>
              <p className="mt-1 text-2xl font-black text-amber-950">{waitingCount}</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Initial Assessment Pending</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/80 bg-blue-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Triage In Progress</p>
              <p className="mt-1 text-2xl font-black text-blue-950">{inProgressCount}</p>
              <p className="text-[10px] text-blue-600 font-medium mt-0.5">Bedside Vitals & ESI</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-2xs rounded-2xl ${escalatedCount > 0 ? "border-rose-300 bg-rose-50/60" : "border-slate-200 bg-white"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">STAT Escalations</p>
              <p className="mt-1 text-2xl font-black text-rose-950">{escalatedCount}</p>
              <p className="text-[10px] text-rose-600 font-medium mt-0.5">Physician Rapid Response</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Avg Triage Latency</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">6.4 min</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Under 15m Hospital Target</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search, Tabs & Filter Toolbar ─── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { key: "ALL", label: "All Patients", count: totalCount },
            { key: "WAITING", label: "Waiting", count: waitingCount },
            { key: "TRIAGE_IN_PROGRESS", label: "In Progress", count: inProgressCount },
            { key: "TRIAGED", label: "Triaged", count: patients.filter((p) => p.status === "TRIAGED").length },
            { key: "ESCALATED", label: "STAT Escalated", count: escalatedCount },
            { key: "COMPLETED", label: "Completed", count: patients.filter((p) => p.status === "COMPLETED").length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors shrink-0 ${
                filter === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  filter === tab.key ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search triage roster by patient name, MRN, chief complaint, or bay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* ─── Triage Table Grid ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">ESI Acuity</th>
                <th className="px-4 py-3.5">Patient Details</th>
                <th className="px-4 py-3.5">Chief Complaint</th>
                <th className="px-4 py-3.5">Assigned Bay & Status</th>
                <th className="px-4 py-3.5">Bedside Vitals</th>
                <th className="px-4 py-3.5 text-right">Nurse Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const esiInfo = ESI_CONFIG[p.esiLevel] || ESI_CONFIG[3];
                  const statusInfo = STATUS_CONFIG[p.status] || STATUS_CONFIG.WAITING;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] tracking-wide ${esiInfo.bg} ${esiInfo.text} ${esiInfo.border}`}
                        >
                          {esiInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{p.patient}</p>
                        <p className="font-mono text-[10px] text-slate-500 font-semibold">
                          {p.gender}, {p.age}y · {p.mrn}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="text-slate-800 font-medium line-clamp-1">{p.chief}</p>
                        <span className="text-[10px] text-slate-400 font-mono">Arrived: {p.arrived}</span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{p.assignedBay}</p>
                        <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold border mt-0.5 ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                        {p.bp ? (
                          <div className="text-slate-700 space-y-0.5">
                            <p>
                              <strong className="text-slate-900">{p.bp}</strong> mmHg ·{" "}
                              <strong className={p.hr && p.hr > 100 ? "text-rose-600 font-bold" : "text-slate-900"}>{p.hr}</strong> bpm
                            </p>
                            <p className="text-slate-500 text-[10px]">
                              SpO2: <strong className={p.spo2 && p.spo2 < 93 ? "text-rose-600" : "text-slate-800"}>{p.spo2}%</strong> · Temp: {p.temp}°C
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Vitals pending</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenVitals(p)}
                            className="h-7 text-xs border-slate-200 text-emerald-700 hover:bg-emerald-50 font-bold px-2.5"
                          >
                            <Thermometer className="h-3 w-3 mr-1" />
                            Vitals
                          </Button>

                          {p.status === "WAITING" && (
                            <Button
                              size="sm"
                              onClick={() => handleAdvanceStatus(p.id, "TRIAGE_IN_PROGRESS")}
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5"
                            >
                              Begin
                            </Button>
                          )}

                          {p.status === "TRIAGE_IN_PROGRESS" && (
                            <Button
                              size="sm"
                              onClick={() => handleAdvanceStatus(p.id, "TRIAGED")}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5"
                            >
                              Assign
                            </Button>
                          )}

                          {p.status !== "ESCALATED" && (
                            <Button
                              size="sm"
                              onClick={() => handleEscalate(p)}
                              className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 shadow-2xs"
                              title="Rapid Physician Escalation"
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Escalate
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setInspectingPatient(p)}
                            className="h-7 text-xs text-slate-500 hover:bg-slate-100 px-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-slate-400">
                    No triage patients matched your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Quick Intake Modal ─── */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Emergency Patient Intake</h3>
                  <p className="text-[11px] text-slate-500">Initial ER lobby registration & triage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIntake} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Chen"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Acuity (ESI Level)</label>
                <select
                  value={newEsiLevel}
                  onChange={(e) => setNewEsiLevel(Number(e.target.value) as EsiLevel)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none font-bold"
                >
                  <option value={1}>ESI 1 — Resuscitation (Immediate Life Threat)</option>
                  <option value={2}>ESI 2 — Emergent (High Risk / Confusion / Severe Pain)</option>
                  <option value={3}>ESI 3 — Urgent (Multiple Resources Needed)</option>
                  <option value={4}>ESI 4 — Semi-Urgent (One Resource Needed)</option>
                  <option value={5}>ESI 5 — Non-Urgent (No Resources Needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chief Complaint & Presentation</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Chest pain, shortness of breath, diaphoresis"
                  value={newChief}
                  onChange={(e) => setNewChief(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned ER Bay / Chair</label>
                <input
                  type="text"
                  value={newBay}
                  onChange={(e) => setNewBay(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIntakeModal(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  Admit to Triage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Vitals Modal ─── */}
      {vitalsModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Thermometer className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Bedside Vitals</h3>
                  <p className="text-[11px] text-slate-500">
                    {vitalsModalPatient.patient} ({vitalsModalPatient.mrn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVitalsModalPatient(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    required
                    value={vBp}
                    onChange={(e) => setVBp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    required
                    value={vHr}
                    onChange={(e) => setVHr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={vSpo2}
                    onChange={(e) => setVSpo2(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resp Rate (/min)</label>
                  <input
                    type="number"
                    required
                    value={vRr}
                    onChange={(e) => setVRr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vTemp}
                    onChange={(e) => setVTemp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVitalsModalPatient(null)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  Save Telemetry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Inspect Patient Modal ─── */}
      {inspectingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{inspectingPatient.patient}</h3>
                  <p className="text-[11px] text-slate-500">MRN: {inspectingPatient.mrn} · Arrived {inspectingPatient.arrived}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPatient(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chief Complaint</span>
                <p className="mt-1 font-semibold text-slate-800">{inspectingPatient.chief}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-500">Blood Pressure</span>
                  <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">{inspectingPatient.bp || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-500">Heart Rate</span>
                  <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">{inspectingPatient.hr ? `${inspectingPatient.hr} bpm` : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-500">Oxygen Sat</span>
                  <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">{inspectingPatient.spo2 ? `${inspectingPatient.spo2}%` : "—"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-xs text-blue-900 space-y-1">
                <p className="font-bold">Clinical Action Directives:</p>
                <p className="text-blue-800">
                  Assigned Bay: <strong>{inspectingPatient.assignedBay}</strong>. Ensure continuous cardiac telemetry and repeat vitals assessment within protocol schedule.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingPatient(null)}
                className="rounded-xl text-xs font-semibold text-slate-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
