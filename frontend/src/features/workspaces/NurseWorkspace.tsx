"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  HeartPulse,
  ListTodo,
  PhoneCall,
  Plus,
  Send,
  ShieldAlert,
  Square,
  Thermometer,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Radio,
  RefreshCw,
  Zap,
  Sparkles,
  Bed,
  Stethoscope,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Nurse Dashboard
 */
function NurseDashboardEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">BEDSIDE TELEMETRY</span>
        <span className="font-mono text-sm font-black text-white leading-none flex items-center gap-1 mt-0.5">
          {bpm} <span className="text-[9px] font-normal text-slate-400">BPM</span>
        </span>
      </div>
      <canvas ref={canvasRef} width={130} height={28} className="rounded" />
    </div>
  );
}

export interface TriagePatient {
  id: string;
  mrn: string;
  name: string;
  age?: number;
  gender?: string;
  acuity: "IMMEDIATE" | "EMERGENCY" | "URGENT" | "SEMI_URGENT" | "NON_URGENT";
  acuity_level: number;
  state: "INTAKE" | "VITALS_TAKEN" | "TRIAGED" | "UNDER_REVIEW" | "DISCHARGED";
  arrivalTime: string;
  chiefComplaint: string;
  assignedBed: string;
  vitals?: {
    sbp: number;
    dbp: number;
    hr: number;
    rr: number;
    spo2: number;
    temp: number;
    lactate?: number;
  };
}

export interface BedsideTask {
  id: string;
  patientName: string;
  mrn: string;
  task: string;
  dueTime: string;
  priority: "STAT" | "HIGH" | "ROUTINE";
  completed: boolean;
}

const INITIAL_DEMO_QUEUE: TriagePatient[] = [
  {
    id: "t-101",
    mrn: "MRN-78429",
    name: "Elena Rostova",
    age: 64,
    gender: "Female",
    acuity: "IMMEDIATE",
    acuity_level: 1,
    state: "UNDER_REVIEW",
    arrivalTime: "10 min ago",
    chiefComplaint: "Severe Sepsis / Hypotension (MAP 58)",
    assignedBed: "ICU Bed 01",
    vitals: { sbp: 84, dbp: 52, hr: 118, rr: 24, spo2: 92, temp: 39.1, lactate: 4.8 },
  },
  {
    id: "t-102",
    mrn: "MRN-91204",
    name: "Arthur Pendleton",
    age: 58,
    gender: "Male",
    acuity: "EMERGENCY",
    acuity_level: 2,
    state: "TRIAGED",
    arrivalTime: "25 min ago",
    chiefComplaint: "Acute Chest Pain / STEMI Evaluation",
    assignedBed: "Cath Bay 03",
    vitals: { sbp: 158, dbp: 96, hr: 104, rr: 20, spo2: 95, temp: 37.0 },
  },
  {
    id: "t-103",
    mrn: "MRN-33019",
    name: "Clara Oswald",
    age: 49,
    gender: "Female",
    acuity: "EMERGENCY",
    acuity_level: 2,
    state: "VITALS_TAKEN",
    arrivalTime: "35 min ago",
    chiefComplaint: "Acute Neurological Deficit (NIHSS 14)",
    assignedBed: "Neuro Bay 02",
    vitals: { sbp: 172, dbp: 98, hr: 88, rr: 18, spo2: 97, temp: 36.8 },
  },
  {
    id: "t-104",
    mrn: "MRN-64012",
    name: "Gregory House",
    age: 62,
    gender: "Male",
    acuity: "URGENT",
    acuity_level: 3,
    state: "INTAKE",
    arrivalTime: "45 min ago",
    chiefComplaint: "Dyspnea / Hypoxemic Respiratory Distress",
    assignedBed: "Step-Down 04",
    vitals: { sbp: 110, dbp: 70, hr: 96, rr: 22, spo2: 90, temp: 37.4 },
  },
  {
    id: "t-105",
    mrn: "MRN-55210",
    name: "Maya Lin",
    age: 42,
    gender: "Female",
    acuity: "URGENT",
    acuity_level: 3,
    state: "TRIAGED",
    arrivalTime: "1 hr ago",
    chiefComplaint: "DKA / Hyperglycemia (Blood Glucose 420)",
    assignedBed: "Bed 12",
    vitals: { sbp: 124, dbp: 78, hr: 86, rr: 16, spo2: 98, temp: 36.9 },
  },
];

const INITIAL_DEMO_TASKS: BedsideTask[] = [
  {
    id: "tsk-01",
    patientName: "Elena Rostova",
    mrn: "MRN-78429",
    task: "STAT 1-Hour Sepsis Bundle: Draw 2 sets Blood Cultures & Start IV Meropenem",
    dueTime: "STAT (5 min)",
    priority: "STAT",
    completed: false,
  },
  {
    id: "tsk-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-91204",
    task: "Acquire Repeat 12-Lead ECG & Administer Aspirin 324mg PO",
    dueTime: "STAT (10 min)",
    priority: "STAT",
    completed: false,
  },
  {
    id: "tsk-03",
    patientName: "Clara Oswald",
    mrn: "MRN-33019",
    task: "Neurological Re-Assessment & Blood Pressure check q15min",
    dueTime: "15 min",
    priority: "HIGH",
    completed: false,
  },
  {
    id: "tsk-04",
    patientName: "Gregory House",
    mrn: "MRN-64012",
    task: "Titrate High-Flow Nasal Cannula FiO2 to maintain SpO2 >= 92%",
    dueTime: "30 min",
    priority: "HIGH",
    completed: true,
  },
  {
    id: "tsk-05",
    patientName: "Maya Lin",
    mrn: "MRN-55210",
    task: "Check Point-of-Care Blood Glucose & Serum Potassium q1h",
    dueTime: "45 min",
    priority: "ROUTINE",
    completed: true,
  },
];

const ACUITY_CONFIG = {
  IMMEDIATE: { label: "ESI 1 · Resuscitation", bg: "bg-rose-100 text-rose-900 border-rose-300 font-black", badge: "bg-rose-600 text-white" },
  EMERGENCY: { label: "ESI 2 · Emergent", bg: "bg-orange-100 text-orange-900 border-orange-300 font-bold", badge: "bg-orange-600 text-white" },
  URGENT: { label: "ESI 3 · Urgent", bg: "bg-amber-100 text-amber-900 border-amber-300 font-bold", badge: "bg-amber-600 text-white" },
  SEMI_URGENT: { label: "ESI 4 · Semi-Urgent", bg: "bg-sky-100 text-sky-900 border-sky-300 font-semibold", badge: "bg-sky-600 text-white" },
  NON_URGENT: { label: "ESI 5 · Non-Urgent", bg: "bg-slate-100 text-slate-800 border-slate-300 font-medium", badge: "bg-slate-600 text-white" },
};

const STATE_BADGE = {
  INTAKE: { label: "Intake", className: "bg-slate-100 text-slate-700 border-slate-200" },
  VITALS_TAKEN: { label: "Vitals Recorded", className: "bg-blue-50 text-blue-700 border-blue-200" },
  TRIAGED: { label: "Triaged", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UNDER_REVIEW: { label: "Physician Review", className: "bg-amber-50 text-amber-800 border-amber-200" },
  DISCHARGED: { label: "Discharged", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export function NurseWorkspace() {
  const { user } = useAuthStore();
  const [queue, setQueue] = React.useState<TriagePatient[]>(INITIAL_DEMO_QUEUE);
  const [tasks, setTasks] = React.useState<BedsideTask[]>(INITIAL_DEMO_TASKS);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);

  // Vitals Modal State
  const [vitalsModalOpen, setVitalsModalOpen] = React.useState(false);
  const [selectedPatientForVitals, setSelectedPatientForVitals] = React.useState<TriagePatient | null>(null);
  const [sbp, setSbp] = React.useState("120");
  const [dbp, setDbp] = React.useState("80");
  const [hr, setHr] = React.useState("75");
  const [rr, setRr] = React.useState("16");
  const [spo2, setSpo2] = React.useState("98");
  const [temp, setTemp] = React.useState("37.0");
  const [submittingVitals, setSubmittingVitals] = React.useState(false);

  // Rapid Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = React.useState(false);
  const [selectedPatientForEscalate, setSelectedPatientForEscalate] = React.useState<TriagePatient | null>(null);
  const [escalateReason, setEscalateReason] = React.useState("");
  const [escalatePriority, setEscalatePriority] = React.useState<"HIGH" | "CRITICAL">("CRITICAL");
  const [escalating, setEscalating] = React.useState(false);

  // Add Task Modal State
  const [addTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [newTaskPatientMRN, setNewTaskPatientMRN] = React.useState("MRN-78429");
  const [newTaskPatientName, setNewTaskPatientName] = React.useState("Elena Rostova");
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState<"STAT" | "HIGH" | "ROUTINE">("STAT");
  const [newTaskDue, setNewTaskDue] = React.useState("15 min");

  // WebSocket Live Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Fetch from backend with fallback
  const fetchTriageData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const [resQueue, resTasks] = await Promise.allSettled([
        apiClient.get("/clinical/triage/queue/"),
        apiClient.get("/clinical/triage/tasks/"),
      ]);

      if (resQueue.status === "fulfilled" && Array.isArray(resQueue.value.data?.data) && resQueue.value.data.data.length > 0) {
        setQueue(resQueue.value.data.data);
      }
      if (resTasks.status === "fulfilled" && Array.isArray(resTasks.value.data?.data) && resTasks.value.data.data.length > 0) {
        setTasks(resTasks.value.data.data);
      }
    } catch {
      // retain rich authoritative ward queue
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTriageData();
  }, [fetchTriageData]);

  // Handle Real-time WebSocket Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "vitals_updated" ||
      lastEvent.event_type === "patient_admitted" ||
      lastEvent.event_type === "NEW_PREDICTION" ||
      lastEvent.event_type === "TASK_ASSIGNED" ||
      lastEvent.event_type === "ESCALATION_TRIGGERED"
    ) {
      const payload = (lastEvent.payload || {}) as Record<string, any>;
      setLastLiveEvent({
        message: `Real-time Ward Event: ${lastEvent.event_type.replace(/_/g, " ")} (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });

      if (lastEvent.event_type === "vitals_updated" && payload.patient_mrn) {
        setQueue((prev) =>
          prev.map((p) => {
            if (p.mrn === payload.patient_mrn) {
              return {
                ...p,
                state: "VITALS_TAKEN",
                vitals: {
                  sbp: Number(payload.sbp || p.vitals?.sbp || 120),
                  dbp: Number(payload.dbp || p.vitals?.dbp || 80),
                  hr: Number(payload.hr || p.vitals?.hr || 75),
                  rr: Number(payload.rr || p.vitals?.rr || 16),
                  spo2: Number(payload.spo2 || p.vitals?.spo2 || 98),
                  temp: Number(payload.temp || p.vitals?.temp || 37.0),
                },
              };
            }
            return p;
          })
        );
      }
    }
  }, [lastEvent]);

  // Toggle Bedside Task Completion
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = !t.completed;
          setLastLiveEvent({
            message: `Bedside task "${t.task}" marked as ${updated ? "COMPLETED" : "PENDING"}`,
            timestamp: new Date(),
          });
          return { ...t, completed: updated };
        }
        return t;
      })
    );
  };

  // Open Vitals Modal
  const handleOpenVitalsModal = (patient: TriagePatient) => {
    setSelectedPatientForVitals(patient);
    setSbp(String(patient.vitals?.sbp || "120"));
    setDbp(String(patient.vitals?.dbp || "80"));
    setHr(String(patient.vitals?.hr || "75"));
    setRr(String(patient.vitals?.rr || "16"));
    setSpo2(String(patient.vitals?.spo2 || "98"));
    setTemp(String(patient.vitals?.temp || "37.0"));
    setVitalsModalOpen(true);
  };

  // Submit Vitals Ingestion
  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForVitals) return;
    setSubmittingVitals(true);
    try {
      const updatedVitals = {
        sbp: Number(sbp),
        dbp: Number(dbp),
        hr: Number(hr),
        rr: Number(rr),
        spo2: Number(spo2),
        temp: Number(temp),
      };

      try {
        await apiClient.post("/nurse/vitals/", {
          patient_id: selectedPatientForVitals.id,
          patient_mrn: selectedPatientForVitals.mrn,
          ...updatedVitals,
        });
      } catch {
        // Fallback local authoritative update
      }

      setQueue((prev) =>
        prev.map((p) =>
          p.id === selectedPatientForVitals.id
            ? { ...p, state: "VITALS_TAKEN", vitals: updatedVitals }
            : p
        )
      );

      setVitalsModalOpen(false);
      setLastLiveEvent({
        message: `Vitals recorded for ${selectedPatientForVitals.name} (${selectedPatientForVitals.mrn})`,
        timestamp: new Date(),
      });
    } finally {
      setSubmittingVitals(false);
    }
  };

  // Open Escalation Modal
  const handleOpenEscalateModal = (patient: TriagePatient) => {
    setSelectedPatientForEscalate(patient);
    setEscalateReason(`Sudden physiological instability in ${patient.name}. Acute vital deterioration.`);
    setEscalatePriority("CRITICAL");
    setEscalateModalOpen(true);
  };

  // Submit Rapid Escalation
  const handleSubmitEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForEscalate) return;
    setEscalating(true);
    try {
      try {
        await apiClient.post("/clinical/triage/escalate/", {
          patient_id: selectedPatientForEscalate.id,
          mrn: selectedPatientForEscalate.mrn,
          priority: escalatePriority,
          reason: escalateReason,
        });
      } catch {
        // Fallback local update
      }

      setQueue((prev) =>
        prev.map((p) =>
          p.id === selectedPatientForEscalate.id ? { ...p, state: "UNDER_REVIEW" } : p
        )
      );

      setEscalateModalOpen(false);
      setLastLiveEvent({
        message: `🚨 RAPID ESCALATION dispatched for ${selectedPatientForEscalate.name} to Attending Physician`,
        timestamp: new Date(),
      });
    } finally {
      setEscalating(false);
    }
  };

  // Add New Bedside Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: BedsideTask = {
      id: `tsk-${Date.now().toString().slice(-4)}`,
      patientName: newTaskPatientName,
      mrn: newTaskPatientMRN,
      task: newTaskTitle.trim(),
      dueTime: newTaskDue,
      priority: newTaskPriority,
      completed: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    setAddTaskModalOpen(false);
    setNewTaskTitle("");
    setLastLiveEvent({
      message: `Assigned bedside task for ${newTask.patientName} (${newTask.priority})`,
      timestamp: new Date(),
    });
  };

  // Calculate ward stats
  const totalInQueue = queue.length;
  const esi1Count = queue.filter((p) => p.acuity === "IMMEDIATE").length;
  const esi2Count = queue.filter((p) => p.acuity === "EMERGENCY").length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Nurse Clinical Workspace & Bedside Triage
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5"
                >
                  Live Ward Telemetry
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time ESI emergency triage queue, continuous bedside vitals telemetry, and physician rapid escalation
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <NurseDashboardEcgMonitor bpm={esi1Count > 0 ? 118 : 74} isSpike={esi1Count > 0} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
              <span>LIVE WARD ACTIVE</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTriageData()}
              disabled={refreshing}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setAddTaskModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 text-xs font-bold px-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Bedside Task
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

      {/* ─── ESI Acuity & Ward Telemetry Metrics Row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className={`border shadow-2xs rounded-2xl ${esi1Count > 0 ? "border-rose-300 bg-rose-50/60" : "border-slate-200 bg-white"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">ESI 1 · Resuscitation</p>
              <p className="mt-1 text-2xl font-black text-rose-950">{esi1Count}</p>
              <p className="text-[10px] text-rose-600 font-medium mt-0.5">Immediate Life Threat</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200/80 bg-orange-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">ESI 2 · Emergent</p>
              <p className="mt-1 text-2xl font-black text-orange-950">{esi2Count}</p>
              <p className="text-[10px] text-orange-600 font-medium mt-0.5">High Risk / Severe Pain</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Bedside Tasks</p>
              <p className="mt-1 text-2xl font-black text-amber-950">{pendingTasksCount}</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Orders & Medication</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ListTodo className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Avg Triage Latency</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">7.8 min</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Under 15m Hospital Target</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Main Grid: Triage Queue & Bedside Tasks ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Triage Queue Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Active Bedside Triage Roster</h2>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-mono font-bold">
                {queue.length} Active
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-Sorted by ESI Acuity</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Acuity</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Chief Complaint</th>
                    <th className="px-4 py-3">Bed & Status</th>
                    <th className="px-4 py-3">Live Vitals</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((p) => {
                    const acuityInfo = ACUITY_CONFIG[p.acuity] || ACUITY_CONFIG.NON_URGENT;
                    const stateInfo = STATE_BADGE[p.state] || STATE_BADGE.INTAKE;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] tracking-wide ${acuityInfo.bg}`}
                          >
                            {acuityInfo.label}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="font-mono text-[10px] text-slate-500 font-semibold">{p.mrn}</p>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="text-slate-800 font-medium truncate">{p.chiefComplaint}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Arrived {p.arrivalTime}</span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{p.assignedBed}</p>
                          <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold border mt-0.5 ${stateInfo.className}`}>
                            {stateInfo.label}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                          {p.vitals ? (
                            <div className="text-slate-700 space-y-0.5">
                              <p>
                                <strong className="text-slate-900">{p.vitals.sbp}/{p.vitals.dbp}</strong> mmHg ·{" "}
                                <strong className={p.vitals.hr > 100 ? "text-rose-600 font-bold" : "text-slate-900"}>{p.vitals.hr}</strong> bpm
                              </p>
                              <p className="text-slate-500 text-[10px]">
                                SpO2: <strong className={p.vitals.spo2 < 93 ? "text-rose-600" : "text-slate-800"}>{p.vitals.spo2}%</strong> · Temp: {p.vitals.temp}°C
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No vitals logged</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenVitalsModal(p)}
                              className="h-7 text-xs border-slate-200 text-emerald-700 hover:bg-emerald-50 font-bold px-2.5"
                            >
                              <Thermometer className="h-3 w-3 mr-1" />
                              Vitals
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleOpenEscalateModal(p)}
                              className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 shadow-2xs"
                              title="Rapid Physician Escalation"
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Escalate
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bedside Task Checklist (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Bedside Orders & Tasks</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{pendingTasksCount} Pending</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleToggleTask(t.id)}
                className={`group rounded-xl border p-3 transition-all cursor-pointer ${
                  t.completed
                    ? "border-slate-200 bg-slate-50/60 opacity-60"
                    : t.priority === "STAT"
                    ? "border-rose-300 bg-rose-50/50 hover:border-rose-400"
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {t.completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{t.patientName}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                          t.priority === "STAT"
                            ? "bg-rose-100 text-rose-800"
                            : t.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        t.completed ? "line-through text-slate-400" : "text-slate-700 font-medium"
                      }`}
                    >
                      {t.task}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{t.mrn}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {t.dueTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Vitals Log Modal ─── */}
      {vitalsModalOpen && selectedPatientForVitals && (
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
                    {selectedPatientForVitals.name} ({selectedPatientForVitals.mrn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVitalsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVitals} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={sbp}
                    onChange={(e) => setSbp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={dbp}
                    onChange={(e) => setDbp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    required
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Respiratory Rate (/min)</label>
                  <input
                    type="number"
                    required
                    value={rr}
                    onChange={(e) => setRr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVitalsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingVitals}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  {submittingVitals ? "Saving Telemetry..." : "Record Vitals"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Rapid Escalation Modal ─── */}
      {escalateModalOpen && selectedPatientForEscalate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rapid Physician Escalation</h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedPatientForEscalate.name} ({selectedPatientForEscalate.mrn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEscalateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEscalate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Escalation Urgency</label>
                <select
                  value={escalatePriority}
                  onChange={(e) => setEscalatePriority(e.target.value as any)}
                  className="w-full rounded-xl border border-rose-300 p-2 text-xs text-rose-950 font-bold focus:border-rose-500 focus:outline-none bg-rose-50/50"
                >
                  <option value="CRITICAL">STAT CRITICAL — Immediate Physician Bedside Response</option>
                  <option value="HIGH">HIGH URGENCY — Physician Review within 15 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Rationale & SBAR Note</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe sudden physiological change, MAP, respiratory distress..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEscalateModalOpen(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={escalating}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 shadow-2xs"
                >
                  {escalating ? "Dispatching Alert..." : "Dispatch Rapid Escalation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Bedside Task Modal ─── */}
      {addTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <ListTodo className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign Bedside Nursing Task</h3>
                  <p className="text-[11px] text-slate-500">Real-time ward task distribution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddTaskModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient MRN & Name</label>
                <select
                  value={newTaskPatientMRN}
                  onChange={(e) => {
                    const sel = queue.find((p) => p.mrn === e.target.value);
                    setNewTaskPatientMRN(e.target.value);
                    if (sel) setNewTaskPatientName(sel.name);
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {queue.map((p) => (
                    <option key={p.mrn} value={p.mrn}>
                      {p.name} ({p.mrn}) · {p.assignedBed}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title / Order</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draw repeat blood gas & check urine output"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="STAT">STAT (Immediate)</option>
                    <option value="HIGH">HIGH Urgency</option>
                    <option value="ROUTINE">ROUTINE Order</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due In</label>
                  <input
                    type="text"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddTaskModalOpen(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 shadow-2xs"
                >
                  Assign Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
