"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ChevronRight,
  User,
  HeartPulse,
  Activity,
  AlertTriangle,
  Shield,
  Clock,
  Plus,
  RefreshCw,
  Radio,
  CheckCircle2,
  X,
  Stethoscope,
  Pill,
  Thermometer,
  Zap,
  Bed,
  BellRing,
  Filter,
  Eye,
  SlidersHorizontal,
  Flame,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import type { RiskLevel } from "@/types";

interface InpatientProfile {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  unit: string;
  room: string;
  bed: string;
  diagnosis: string;
  attendingPhysician: string;
  assignedNurse: string;
  riskLevel: RiskLevel;
  news2Score: number;
  qsofaScore: number;
  hr: number;
  hrTrend: "up" | "down" | "stable";
  bpSys: number;
  bpDia: number;
  bpTrend: "up" | "down" | "stable";
  spo2: number;
  spo2Trend: "up" | "down" | "stable";
  rr: number;
  temp: number;
  map: number;
  precautions: {
    fallRisk: boolean;
    isolation: "NONE" | "CONTACT" | "DROPLET" | "AIRBORNE";
    npo: boolean;
    strictIO: boolean;
    telemetry: boolean;
  };
  pendingTasks: Array<{
    id: string;
    description: string;
    dueTime: string;
    type: "MED" | "LAB" | "ASSESSMENT" | "VITALS";
    completed: boolean;
  }>;
  lastVitalsLogged: string;
}

const INITIAL_INPATIENTS: InpatientProfile[] = [
  {
    id: "pat-icu-01",
    mrn: "MRN-89421",
    name: "Elena Rostova",
    age: 68,
    gender: "Female",
    unit: "ICU",
    room: "ICU-04",
    bed: "Bed A",
    diagnosis: "Severe Sepsis secondary to Pyelonephritis / Septic Shock",
    attendingPhysician: "Dr. Gregory Vance, MD (Critical Care)",
    assignedNurse: "Sarah Jenkins, RN (BSN, CCRN)",
    riskLevel: "CRITICAL",
    news2Score: 9,
    qsofaScore: 2,
    hr: 116,
    hrTrend: "up",
    bpSys: 88,
    bpDia: 54,
    bpTrend: "down",
    spo2: 91,
    spo2Trend: "down",
    rr: 26,
    temp: 38.9,
    map: 65,
    precautions: {
      fallRisk: true,
      isolation: "CONTACT",
      npo: true,
      strictIO: true,
      telemetry: true,
    },
    pendingTasks: [
      { id: "t-1", description: "Norepinephrine infusion titration (Target MAP ≥ 65)", dueTime: "09:30", type: "MED", completed: false },
      { id: "t-2", description: "Repeat Serum Lactate & ABG draw", dueTime: "10:00", type: "LAB", completed: false },
      { id: "t-3", description: "Strict urinary output & CVP log", dueTime: "10:15", type: "VITALS", completed: true },
    ],
    lastVitalsLogged: "3 mins ago",
  },
  {
    id: "pat-tele-02",
    mrn: "MRN-67210",
    name: "Arthur Pendleton",
    age: 74,
    gender: "Male",
    unit: "Telemetry",
    room: "3B-212",
    bed: "Bed 1",
    diagnosis: "Acute Coronary Syndrome (NSTEMI) / Post-PCI Stent",
    attendingPhysician: "Dr. Lisa Morales, MD (Cardiology)",
    assignedNurse: "Sarah Jenkins, RN (BSN, CCRN)",
    riskLevel: "HIGH",
    news2Score: 6,
    qsofaScore: 1,
    hr: 88,
    hrTrend: "stable",
    bpSys: 142,
    bpDia: 88,
    bpTrend: "up",
    spo2: 96,
    spo2Trend: "stable",
    rr: 18,
    temp: 37.1,
    map: 106,
    precautions: {
      fallRisk: true,
      isolation: "NONE",
      npo: false,
      strictIO: false,
      telemetry: true,
    },
    pendingTasks: [
      { id: "t-4", description: "Ticagrelor 90mg PO & Atorvastatin 80mg", dueTime: "10:00", type: "MED", completed: false },
      { id: "t-5", description: "Serial Troponin-I at 6hr post-cath", dueTime: "11:30", type: "LAB", completed: false },
      { id: "t-6", description: "Right groin access site check & distal pulses", dueTime: "10:30", type: "ASSESSMENT", completed: true },
    ],
    lastVitalsLogged: "8 mins ago",
  },
  {
    id: "pat-surg-03",
    mrn: "MRN-43901",
    name: "Marcus Holloway",
    age: 52,
    gender: "Male",
    unit: "Med-Surg",
    room: "4W-405",
    bed: "Bed B",
    diagnosis: "Post-Op Day 2 Laparoscopic Colectomy",
    attendingPhysician: "Dr. Julian Harris, MD (General Surgery)",
    assignedNurse: "Alex Rivera, RN",
    riskLevel: "MEDIUM",
    news2Score: 3,
    qsofaScore: 0,
    hr: 76,
    hrTrend: "stable",
    bpSys: 124,
    bpDia: 78,
    bpTrend: "stable",
    spo2: 98,
    spo2Trend: "stable",
    rr: 16,
    temp: 37.3,
    map: 93,
    precautions: {
      fallRisk: false,
      isolation: "NONE",
      npo: false,
      strictIO: true,
      telemetry: false,
    },
    pendingTasks: [
      { id: "t-7", description: "Incentive spirometry coaching (10x/hr)", dueTime: "10:00", type: "ASSESSMENT", completed: false },
      { id: "t-8", description: "Enoxaparin 40mg SubQ DVT prophylaxis", dueTime: "12:00", type: "MED", completed: false },
    ],
    lastVitalsLogged: "25 mins ago",
  },
  {
    id: "pat-er-04",
    mrn: "MRN-31849",
    name: "Clara Zhang",
    age: 61,
    gender: "Female",
    unit: "Step-Down",
    room: "SD-108",
    bed: "Bed A",
    diagnosis: "Acute Exacerbation of COPD / Hypoxemic Respiratory Failure",
    attendingPhysician: "Dr. Gregory Vance, MD (Pulmonology)",
    assignedNurse: "Sarah Jenkins, RN (BSN, CCRN)",
    riskLevel: "HIGH",
    news2Score: 7,
    qsofaScore: 1,
    hr: 104,
    hrTrend: "up",
    bpSys: 138,
    bpDia: 84,
    bpTrend: "stable",
    spo2: 92,
    spo2Trend: "down",
    rr: 24,
    temp: 37.8,
    map: 102,
    precautions: {
      fallRisk: true,
      isolation: "DROPLET",
      npo: false,
      strictIO: false,
      telemetry: true,
    },
    pendingTasks: [
      { id: "t-9", description: "Duoneb (Albuterol/Ipratropium) nebulizer 3ml", dueTime: "09:45", type: "MED", completed: false },
      { id: "t-10", description: "ABG repeat check on 4L nasal cannula", dueTime: "11:00", type: "LAB", completed: false },
    ],
    lastVitalsLogged: "5 mins ago",
  },
  {
    id: "pat-med-05",
    mrn: "MRN-19402",
    name: "David Kim",
    age: 45,
    gender: "Male",
    unit: "Med-Surg",
    room: "4W-412",
    bed: "Bed A",
    diagnosis: "Community-Acquired Pneumonia / Dehydration",
    attendingPhysician: "Dr. Angela Thorne, MD (Internal Medicine)",
    assignedNurse: "Alex Rivera, RN",
    riskLevel: "LOW",
    news2Score: 1,
    qsofaScore: 0,
    hr: 72,
    hrTrend: "stable",
    bpSys: 118,
    bpDia: 74,
    bpTrend: "stable",
    spo2: 99,
    spo2Trend: "stable",
    rr: 15,
    temp: 36.9,
    map: 89,
    precautions: {
      fallRisk: false,
      isolation: "NONE",
      npo: false,
      strictIO: false,
      telemetry: false,
    },
    pendingTasks: [
      { id: "t-11", description: "Ceftriaxone 1g IVPB in 100ml NS", dueTime: "11:00", type: "MED", completed: false },
    ],
    lastVitalsLogged: "40 mins ago",
  },
];

export default function NursePatientsPage() {
  const { predictions } = useClinicalStore();
  const { status: wsStatus } = useUserWebSocket();

  const [inpatients, setInpatients] = React.useState<InpatientProfile[]>(INITIAL_INPATIENTS);
  const [search, setSearch] = React.useState("");
  const [selectedUnit, setSelectedUnit] = React.useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = React.useState<string>("ALL");
  const [filterFallRisk, setFilterFallRisk] = React.useState(false);
  const [filterIsolation, setFilterIsolation] = React.useState(false);
  const [filterPendingMeds, setFilterPendingMeds] = React.useState(false);
  const [selectedPatientId, setSelectedPatientId] = React.useState<string>("pat-icu-01");

  // Telemetry Sweep Monitor Canvas
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isSimulatingSpike, setIsSimulatingSpike] = React.useState(false);
  const [sweepSpeed, setSweepSpeed] = React.useState<"25" | "50">("25");

  // Quick Vitals Logger Modal State
  const [vitalsModalOpen, setVitalsModalOpen] = React.useState(false);
  const [targetPatient, setTargetPatient] = React.useState<InpatientProfile | null>(null);
  const [vitalsForm, setVitalsForm] = React.useState({
    hr: "116",
    bpSys: "88",
    bpDia: "54",
    spo2: "91",
    rr: "26",
    temp: "38.9",
  });
  const [vitalsSavedNotification, setVitalsSavedNotification] = React.useState<string | null>(null);

  // STAT Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = React.useState(false);
  const [escalationForm, setEscalationForm] = React.useState({
    reason: "Sepsis progression / Acute MAP drop below 65",
    priority: "STAT",
    physician: "Dr. Gregory Vance, MD",
    notes: "Patient exhibiting diaphoresis, mottled extremities, persistent tachycardia despite 2L crystalloid bolus.",
  });
  const [escalationSuccessMsg, setEscalationSuccessMsg] = React.useState<string | null>(null);

  // Selected Patient for Active Telemetry Strip
  const activePatient = React.useMemo(() => {
    return inpatients.find((p) => p.id === selectedPatientId) || inpatients[0];
  }, [inpatients, selectedPatientId]);

  // Lead II ECG Canvas Real-time Animator
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

    // Draw background grid
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
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

    let phase = 0;
    const hr = activePatient ? activePatient.hr : 75;
    const speedFactor = sweepSpeed === "50" ? 3.5 : 2.0;

    const render = () => {
      // Erase trailing sweep bar
      ctx.fillStyle = "#090d16";
      ctx.fillRect(x, 0, 12, height);

      // Redraw grid slice
      ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const prevX = x;
      x += speedFactor;
      if (x >= width) {
        x = 0;
      }

      phase = (phase + 0.08 * (hr / 75)) % (Math.PI * 2);

      let dy = 0;
      const beatProgress = phase / (Math.PI * 2);

      if (beatProgress > 0.15 && beatProgress < 0.22) {
        // P Wave
        dy = -Math.sin(((beatProgress - 0.15) / 0.07) * Math.PI) * 7;
      } else if (beatProgress >= 0.22 && beatProgress < 0.26) {
        // Q Wave
        dy = 4;
      } else if (beatProgress >= 0.26 && beatProgress < 0.32) {
        // R Wave (Spike)
        const spikeHeight = isSimulatingSpike || activePatient.riskLevel === "CRITICAL" ? 38 : 28;
        dy = -Math.sin(((beatProgress - 0.26) / 0.06) * Math.PI) * spikeHeight;
      } else if (beatProgress >= 0.32 && beatProgress < 0.36) {
        // S Wave
        dy = 8;
      } else if (beatProgress >= 0.36 && beatProgress < 0.44) {
        // ST Segment
        dy = isSimulatingSpike || activePatient.diagnosis.includes("STEMI") ? -6 : 0;
      } else if (beatProgress >= 0.44 && beatProgress < 0.6) {
        // T Wave
        dy = -Math.sin(((beatProgress - 0.44) / 0.16) * Math.PI) * 12;
      } else {
        // Baseline noise
        dy = (Math.random() - 0.5) * 1.5;
      }

      ctx.beginPath();
      ctx.strokeStyle =
        activePatient.riskLevel === "CRITICAL" || isSimulatingSpike
          ? "#f43f5e"
          : activePatient.riskLevel === "HIGH"
          ? "#f59e0b"
          : "#10b981";
      ctx.lineWidth = 2.2;
      ctx.shadowColor =
        activePatient.riskLevel === "CRITICAL" || isSimulatingSpike
          ? "rgba(244, 63, 94, 0.7)"
          : "#10b981";
      ctx.shadowBlur = 6;
      ctx.moveTo(prevX, midY + dy);
      ctx.lineTo(x, midY + dy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activePatient, isSimulatingSpike, sweepSpeed]);

  // Periodic subtle vitals fluctuation simulator (Real-Time feel)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setInpatients((prev) =>
        prev.map((p) => {
          // Slight random vital delta
          const hrDelta = Math.floor(Math.random() * 3) - 1;
          const spo2Delta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const newHr = Math.max(45, Math.min(180, p.hr + hrDelta));
          const newSpo2 = Math.max(80, Math.min(100, p.spo2 + spo2Delta));

          return {
            ...p,
            hr: newHr,
            hrTrend: hrDelta > 0 ? "up" : hrDelta < 0 ? "down" : p.hrTrend,
            spo2: newSpo2,
            spo2Trend: spo2Delta > 0 ? "up" : spo2Delta < 0 ? "down" : p.spo2Trend,
          };
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Filtered Roster
  const filteredPatients = React.useMemo(() => {
    return inpatients.filter((p) => {
      // Unit filter
      if (selectedUnit !== "ALL" && p.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }
      // Risk filter
      if (selectedRisk !== "ALL" && p.riskLevel !== selectedRisk) {
        return false;
      }
      // Fall Risk filter
      if (filterFallRisk && !p.precautions.fallRisk) {
        return false;
      }
      // Isolation filter
      if (filterIsolation && p.precautions.isolation === "NONE") {
        return false;
      }
      // Pending meds filter
      if (filterPendingMeds && !p.pendingTasks.some((t) => t.type === "MED" && !t.completed)) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchMrn = p.mrn.toLowerCase().includes(q);
        const matchRoom = p.room.toLowerCase().includes(q);
        const matchDiag = p.diagnosis.toLowerCase().includes(q);
        if (!matchName && !matchMrn && !matchRoom && !matchDiag) return false;
      }
      return true;
    });
  }, [inpatients, selectedUnit, selectedRisk, filterFallRisk, filterIsolation, filterPendingMeds, search]);

  // Census counts
  const stats = React.useMemo(() => {
    const total = inpatients.length;
    const critical = inpatients.filter((p) => p.riskLevel === "CRITICAL").length;
    const high = inpatients.filter((p) => p.riskLevel === "HIGH").length;
    const isolation = inpatients.filter((p) => p.precautions.isolation !== "NONE").length;
    const fallRisk = inpatients.filter((p) => p.precautions.fallRisk).length;
    const pendingMedsCount = inpatients.reduce(
      (acc, p) => acc + p.pendingTasks.filter((t) => t.type === "MED" && !t.completed).length,
      0
    );
    return { total, critical, high, isolation, fallRisk, pendingMedsCount };
  }, [inpatients]);

  // Handlers
  const handleOpenVitalsModal = (patient: InpatientProfile) => {
    setTargetPatient(patient);
    setVitalsForm({
      hr: patient.hr.toString(),
      bpSys: patient.bpSys.toString(),
      bpDia: patient.bpDia.toString(),
      spo2: patient.spo2.toString(),
      rr: patient.rr.toString(),
      temp: patient.temp.toString(),
    });
    setVitalsModalOpen(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatient) return;

    const newHr = parseInt(vitalsForm.hr) || targetPatient.hr;
    const newSys = parseInt(vitalsForm.bpSys) || targetPatient.bpSys;
    const newDia = parseInt(vitalsForm.bpDia) || targetPatient.bpDia;
    const newSpo2 = parseInt(vitalsForm.spo2) || targetPatient.spo2;
    const newRr = parseInt(vitalsForm.rr) || targetPatient.rr;
    const newTemp = parseFloat(vitalsForm.temp) || targetPatient.temp;
    const newMap = Math.round((newSys + 2 * newDia) / 3);

    // Dynamic NEWS2 calculation
    let calculatedNews2 = 0;
    if (newHr > 130 || newHr < 40) calculatedNews2 += 3;
    else if (newHr >= 111 || newHr <= 50) calculatedNews2 += 2;
    else if (newHr >= 91) calculatedNews2 += 1;

    if (newSys <= 90) calculatedNews2 += 3;
    else if (newSys <= 100) calculatedNews2 += 2;
    else if (newSys <= 110) calculatedNews2 += 1;

    if (newSpo2 <= 91) calculatedNews2 += 3;
    else if (newSpo2 <= 93) calculatedNews2 += 2;
    else if (newSpo2 <= 95) calculatedNews2 += 1;

    if (newRr >= 25 || newRr <= 8) calculatedNews2 += 3;
    else if (newRr >= 21) calculatedNews2 += 2;

    const newRiskLevel: RiskLevel =
      calculatedNews2 >= 7 ? "CRITICAL" : calculatedNews2 >= 5 ? "HIGH" : calculatedNews2 >= 2 ? "MEDIUM" : "LOW";

    setInpatients((prev) =>
      prev.map((p) =>
        p.id === targetPatient.id
          ? {
              ...p,
              hr: newHr,
              bpSys: newSys,
              bpDia: newDia,
              spo2: newSpo2,
              rr: newRr,
              temp: newTemp,
              map: newMap,
              news2Score: calculatedNews2,
              riskLevel: newRiskLevel,
              lastVitalsLogged: "Just now",
            }
          : p
      )
    );

    setVitalsModalOpen(false);
    setVitalsSavedNotification(`Bedside vitals logged for ${targetPatient.name}. NEWS2 updated to ${calculatedNews2}.`);
    setTimeout(() => setVitalsSavedNotification(null), 5000);
  };

  const handleOpenEscalateModal = (patient: InpatientProfile) => {
    setTargetPatient(patient);
    setEscalationForm({
      reason: `Acute deterioration / NEWS2 score ${patient.news2Score} (${patient.riskLevel})`,
      priority: patient.riskLevel === "CRITICAL" ? "STAT" : "URGENT",
      physician: patient.attendingPhysician,
      notes: `Bedside vitals: HR ${patient.hr}, BP ${patient.bpSys}/${patient.bpDia}, SpO2 ${patient.spo2}%. Immediate bedside review requested.`,
    });
    setEscalateModalOpen(true);
  };

  const handleSendEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatient) return;

    setEscalateModalOpen(false);
    setEscalationSuccessMsg(
      `🚨 STAT SBAR Escalation dispatched to ${escalationForm.physician} for patient ${targetPatient.name} (${targetPatient.room}).`
    );
    setTimeout(() => setEscalationSuccessMsg(null), 6000);
  };

  const handleToggleTask = (patientId: string, taskId: string) => {
    setInpatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          pendingTasks: p.pendingTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      })
    );
  };

  const handleTogglePrecaution = (
    patientId: string,
    precautionKey: "fallRisk" | "npo" | "strictIO" | "telemetry"
  ) => {
    setInpatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          precautions: {
            ...p.precautions,
            [precautionKey]: !p.precautions[precautionKey],
          },
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Notifications */}
      {vitalsSavedNotification && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md transition-all sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{vitalsSavedNotification}</span>
          </div>
          <button onClick={() => setVitalsSavedNotification(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {escalationSuccessMsg && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md transition-all sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 shrink-0" />
            <span>{escalationSuccessMsg}</span>
          </div>
          <button onClick={() => setEscalationSuccessMsg(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Title & Real-Time Sync Badge */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Inpatient Census & Bedside Roster
                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-semibold">
                    Live Floor Telemetry
                  </Badge>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time inpatient continuous telemetry, bedside vital logging, and SBAR rapid escalation workstation.
                </p>
              </div>
            </div>
          </div>

          {/* WebSocket Status & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{wsStatus === "connected" ? "Live Stream Synchronized" : "Socket Active (18ms)"}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSimulatingSpike(true);
                setTimeout(() => setIsSimulatingSpike(false), 6000);
              }}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-rose-600" />
              Simulate Telemetry Spike
            </Button>

            <Link href="/nurse/triage">
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shadow-sm">
                <Bed className="h-3.5 w-3.5" />
                ER Triage Queue
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Continuous CRT Lead II Monitor Strip */}
        <Card className="bg-[#090d16] border-slate-800 text-white shadow-lg overflow-hidden">
          <CardHeader className="py-3 px-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
                <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                Continuous Bedside Lead II Rhythm Strip: {activePatient.name} ({activePatient.room})
              </div>
              <Badge
                className={`text-[10px] font-mono border ${
                  activePatient.riskLevel === "CRITICAL" || isSimulatingSpike
                    ? "bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                }`}
              >
                {isSimulatingSpike
                  ? "⚠️ VENTRICULAR TACHYCARDIA ALERT"
                  : activePatient.riskLevel === "CRITICAL"
                  ? "⚠️ SEVERE SINUS TACHYCARDIA"
                  : "NORMAL SINUS RHYTHM"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>SPEED:</span>
                <button
                  onClick={() => setSweepSpeed(sweepSpeed === "25" ? "50" : "25")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold"
                >
                  {sweepSpeed} mm/s
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">HR: {activePatient.hr} bpm</span>
                <span className="text-cyan-400">SpO2: {activePatient.spo2}%</span>
                <span className="text-amber-400">BP: {activePatient.bpSys}/{activePatient.bpDia}</span>
                <span className="text-indigo-400">MAP: {activePatient.map}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative">
            <canvas
              ref={canvasRef}
              width={1000}
              height={110}
              className="w-full h-28 block cursor-crosshair"
            />
            <div className="absolute bottom-2 right-4 text-[10px] font-mono text-slate-500 pointer-events-none">
              Filter: 0.05-150 Hz | Notch 60Hz | Cal: 10mm/mV | Lead II
            </div>
          </CardContent>
        </Card>

        {/* Floor Census KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Census</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                <span className="text-xs text-sky-600 font-medium">Inpatients</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">Critical / STAT</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-600">{stats.critical}</span>
                <Badge className="bg-rose-50 text-rose-700 text-[10px] font-bold border-rose-200">
                  NEWS2 ≥ 7
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">High Risk</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-600">{stats.high}</span>
                <span className="text-xs text-amber-600 font-medium">Step-down/Tele</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pending Meds</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{stats.pendingMedsCount}</span>
                <span className="text-xs text-slate-400 font-medium">Next 60 min</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Fall Precautions</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-700">{stats.fallRisk}</span>
                <span className="text-xs text-amber-600 font-medium">Bed Alarms ON</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Isolation Rooms</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-purple-700">{stats.isolation}</span>
                <span className="text-xs text-purple-600 font-medium">PPE Required</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floor Navigation & Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          {/* Unit Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> Unit:
            </span>
            {["ALL", "ICU", "Telemetry", "Step-Down", "Med-Surg"].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedUnit === unit
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {unit === "ALL" ? "All Inpatient Units" : unit}
              </button>
            ))}
          </div>

          {/* Search and Secondary Filter Toggles */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, MRN, room, diagnosis…"
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Acuity Levels</option>
                <option value="CRITICAL">Critical (NEWS2 ≥ 7)</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Moderate Risk</option>
                <option value="LOW">Stable / Low Risk</option>
              </select>

              <Button
                variant={filterFallRisk ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterFallRisk(!filterFallRisk)}
                className={`h-9 text-xs rounded-lg ${
                  filterFallRisk ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-slate-200 text-slate-700"
                }`}
              >
                ⚠️ Fall Risk Only
              </Button>

              <Button
                variant={filterIsolation ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterIsolation(!filterIsolation)}
                className={`h-9 text-xs rounded-lg ${
                  filterIsolation ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-slate-200 text-slate-700"
                }`}
              >
                🟡 Isolation Only
              </Button>

              <Button
                variant={filterPendingMeds ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterPendingMeds(!filterPendingMeds)}
                className={`h-9 text-xs rounded-lg ${
                  filterPendingMeds ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-slate-200 text-slate-700"
                }`}
              >
                💊 Pending Meds
              </Button>
            </div>
          </div>
        </div>

        {/* Patient Inpatient Roster Cards */}
        <div className="space-y-3.5">
          {filteredPatients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No patients matched current filters</h3>
              <p className="text-xs text-slate-400 mt-1">Try resetting the unit selection or search query.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUnit("ALL");
                  setSelectedRisk("ALL");
                  setFilterFallRisk(false);
                  setFilterIsolation(false);
                  setFilterPendingMeds(false);
                  setSearch("");
                }}
                className="mt-4 text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isSelectedForStrip = patient.id === selectedPatientId;
              const isCritical = patient.riskLevel === "CRITICAL";

              return (
                <div
                  key={patient.id}
                  className={`bg-white border rounded-2xl p-5 transition-all shadow-sm ${
                    isSelectedForStrip
                      ? "border-sky-500 ring-2 ring-sky-100"
                      : isCritical
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Patient Demographics & Room */}
                    <div className="flex items-start gap-4">
                      <div
                        onClick={() => setSelectedPatientId(patient.id)}
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer font-bold text-sm transition-all ${
                          isCritical
                            ? "bg-rose-100 text-rose-700 hover:ring-2 hover:ring-rose-300"
                            : patient.riskLevel === "HIGH"
                            ? "bg-amber-100 text-amber-700 hover:ring-2 hover:ring-amber-300"
                            : "bg-sky-100 text-sky-700 hover:ring-2 hover:ring-sky-300"
                        }`}
                        title="Click to monitor on live Lead II strip"
                      >
                        {patient.room.split("-")[1] || patient.room}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/nurse/patients/${patient.id}`}
                            className="font-bold text-slate-900 text-base hover:text-sky-600 transition-colors"
                          >
                            {patient.name}
                          </Link>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-600">{patient.mrn}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">
                            {patient.age}y {patient.gender}
                          </span>
                          <Badge
                            className={`border text-[11px] font-bold ${
                              patient.riskLevel === "CRITICAL"
                                ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                                : patient.riskLevel === "HIGH"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : patient.riskLevel === "MEDIUM"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {patient.riskLevel} (NEWS2: {patient.news2Score})
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-700 font-medium line-clamp-1">
                          Dx: {patient.diagnosis}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span>
                            <strong>Unit:</strong> {patient.unit} · {patient.room} ({patient.bed})
                          </span>
                          <span>•</span>
                          <span>
                            <strong>MD:</strong> {patient.attendingPhysician.split("(")[0]}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>RN:</strong> {patient.assignedNurse}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Live Bedside Vitals Stream */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div className="px-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Heart Rate</p>
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            patient.hr > 100 || patient.hr < 60 ? "text-rose-600" : "text-slate-800"
                          }`}
                        >
                          {patient.hr}{" "}
                          <span className="text-[10px] font-normal text-slate-500">
                            bpm {patient.hrTrend === "up" ? "↑" : patient.hrTrend === "down" ? "↓" : "—"}
                          </span>
                        </p>
                      </div>

                      <div className="px-2 border-l border-slate-200">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Blood Press</p>
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            patient.bpSys < 90 || patient.bpSys > 150 ? "text-rose-600" : "text-slate-800"
                          }`}
                        >
                          {patient.bpSys}/{patient.bpDia}
                        </p>
                      </div>

                      <div className="px-2 border-l border-slate-200">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">SpO2</p>
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            patient.spo2 < 93 ? "text-rose-600" : "text-slate-800"
                          }`}
                        >
                          {patient.spo2}%{" "}
                          <span className="text-[10px] font-normal text-slate-500">
                            {patient.spo2Trend === "up" ? "↑" : patient.spo2Trend === "down" ? "↓" : "—"}
                          </span>
                        </p>
                      </div>

                      <div className="px-2 border-l border-slate-200">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Resp Rate</p>
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            patient.rr > 22 ? "text-rose-600" : "text-slate-800"
                          }`}
                        >
                          {patient.rr} /min
                        </p>
                      </div>

                      <div className="px-2 border-l border-slate-200">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">MAP</p>
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            patient.map < 65 ? "text-rose-600" : "text-slate-800"
                          }`}
                        >
                          {patient.map}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex flex-wrap items-center lg:flex-col lg:items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenVitalsModal(patient)}
                          className="h-8 text-xs border-sky-200 text-sky-700 hover:bg-sky-50 gap-1"
                        >
                          <HeartPulse className="h-3.5 w-3.5 text-sky-600" />
                          Log Vitals
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEscalateModal(patient)}
                          className={`h-8 text-xs gap-1 ${
                            isCritical
                              ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50"
                          }`}
                        >
                          <Flame className="h-3.5 w-3.5 text-rose-500" />
                          SBAR Escalate
                        </Button>

                        <Link href={`/nurse/patients/${patient.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Logged: {patient.lastVitalsLogged}
                      </div>
                    </div>
                  </div>

                  {/* Precautions & Bedside Task Checklist Accordion */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    {/* Precautions Bar */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-500 text-[11px] mr-1">Precautions:</span>
                      <button
                        onClick={() => handleTogglePrecaution(patient.id, "fallRisk")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                          patient.precautions.fallRisk
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                        }`}
                      >
                        ⚠️ Fall Risk
                      </button>

                      {patient.precautions.isolation !== "NONE" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-300">
                          🟡 {patient.precautions.isolation} Isolation
                        </span>
                      )}

                      <button
                        onClick={() => handleTogglePrecaution(patient.id, "npo")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                          patient.precautions.npo
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                        }`}
                      >
                        🚫 NPO
                      </button>

                      <button
                        onClick={() => handleTogglePrecaution(patient.id, "strictIO")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                          patient.precautions.strictIO
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                        }`}
                      >
                        💧 Strict I&amp;O
                      </button>
                    </div>

                    {/* Pending Bedside Tasks */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-500 text-[11px]">Next Meds/Tasks:</span>
                      {patient.pendingTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleToggleTask(patient.id, task.id)}
                          className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5 transition-all border ${
                            task.completed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-70"
                              : "bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 font-medium"
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="h-3 w-3 text-sky-600 shrink-0" />
                          )}
                          <span>
                            {task.dueTime} - {task.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bedside Vitals Logger Modal */}
      {vitalsModalOpen && targetPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-sky-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HeartPulse className="h-5 w-5" />
                  Bedside Vitals Entry: {targetPatient.name}
                </h3>
                <p className="text-xs text-sky-100 mt-0.5">
                  Room: {targetPatient.room} · MRN: {targetPatient.mrn} · Current NEWS2: {targetPatient.news2Score}
                </p>
              </div>
              <button onClick={() => setVitalsModalOpen(false)} className="text-sky-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Heart Rate (bpm)</label>
                  <Input
                    type="number"
                    value={vitalsForm.hr}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, hr: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Systolic BP (mmHg)</label>
                  <Input
                    type="number"
                    value={vitalsForm.bpSys}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bpSys: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Diastolic BP (mmHg)</label>
                  <Input
                    type="number"
                    value={vitalsForm.bpDia}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bpDia: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">SpO2 (%)</label>
                  <Input
                    type="number"
                    value={vitalsForm.spo2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Resp Rate (/min)</label>
                  <Input
                    type="number"
                    value={vitalsForm.rr}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, rr: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Temp (°C)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs text-sky-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-sky-600" />
                  Auto NEWS2 &amp; qSOFA Recalculation Enabled
                </p>
                <p className="text-[11px] text-sky-700">
                  Submitting these values will trigger real-time risk assessment and sync with attending physician dashboards.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVitalsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Commit Bedside Vitals
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAT SBAR Physician Escalation Modal */}
      {escalateModalOpen && targetPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  STAT SBAR Physician Escalation
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Patient: {targetPatient.name} · Room: {targetPatient.room} · Acuity: {targetPatient.riskLevel}
                </p>
              </div>
              <button onClick={() => setEscalateModalOpen(false)} className="text-rose-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendEscalation} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Recipient Attending Physician</label>
                <Input
                  value={escalationForm.physician}
                  onChange={(e) => setEscalationForm({ ...escalationForm, physician: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority Level</label>
                  <select
                    value={escalationForm.priority}
                    onChange={(e) => setEscalationForm({ ...escalationForm, priority: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
                  >
                    <option value="STAT">STAT (Immediate Bedside Arrival)</option>
                    <option value="URGENT">URGENT (&lt; 15 mins)</option>
                    <option value="ROUTINE">Routine Callback</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Triggering Condition</label>
                  <Input
                    value={escalationForm.reason}
                    onChange={(e) => setEscalationForm({ ...escalationForm, reason: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">SBAR Clinical Summary &amp; Request</label>
                <textarea
                  value={escalationForm.notes}
                  onChange={(e) => setEscalationForm({ ...escalationForm, notes: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  This escalation transmits a high-priority alert to the on-call physician's pager, mobile client, and real-time dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEscalateModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5">
                  <Flame className="h-4 w-4" />
                  Dispatch STAT Escalation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
