"use client";

import * as React from "react";
import Link from "next/link";
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Zap,
  Radio,
  Pill,
  HeartPulse,
  Stethoscope,
  Activity,
  Bed,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Flame,
  ShieldCheck,
  ChevronRight,
  User,
  Syringe,
  FileCheck,
  Layers
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export type TaskCategory = "MEDICATION_PASS" | "VITALS_LABS" | "ASSESSMENT" | "PROCEDURE_ASSIST" | "HANDOVER_ADMIN";
export type TaskPriority = "STAT" | "HIGH" | "ROUTINE";

export interface NurseTaskItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  room: string;
  unit: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueTime: string;
  isOverdue?: boolean;
  done: boolean;
  completedAt?: string;
  completedBy?: string;
  dualSignoffRequired?: boolean;
  dualSignoffBy?: string;
}

const INITIAL_TASKS: NurseTaskItem[] = [
  {
    id: "tsk-001",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    title: "Titrate Norepinephrine infusion to target MAP ≥ 65",
    description: "Recheck blood pressure every 15 mins. Current infusion rate 0.08 mcg/kg/min. Dual signature required for rate change.",
    category: "MEDICATION_PASS",
    priority: "STAT",
    dueTime: "09:30",
    isOverdue: true,
    done: false,
    dualSignoffRequired: true,
  },
  {
    id: "tsk-002",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    title: "Draw Repeat Serum Lactate & ABG Panel",
    description: "Sepsis hour-3 bundle requirement. Send on ice to stat lab.",
    category: "VITALS_LABS",
    priority: "STAT",
    dueTime: "10:00",
    done: false,
  },
  {
    id: "tsk-003",
    patientId: "pat-tele-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-67210",
    room: "3B-212",
    unit: "Telemetry",
    title: "Right Groin Access Site Check & Distal Pulse Palpation",
    description: "Post-PCI 18hr observation: inspect for hematoma/bruit, verify dorsalis pedis +2 bilaterally.",
    category: "ASSESSMENT",
    priority: "HIGH",
    dueTime: "10:15",
    done: false,
  },
  {
    id: "tsk-004",
    patientId: "pat-tele-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-67210",
    room: "3B-212",
    unit: "Telemetry",
    title: "Administer Ticagrelor 90mg PO + Atorvastatin 80mg",
    description: "Post-cath antiplatelet maintenance. Ensure patient has water and is seated upright.",
    category: "MEDICATION_PASS",
    priority: "HIGH",
    dueTime: "10:30",
    done: false,
  },
  {
    id: "tsk-005",
    patientId: "pat-er-04",
    patientName: "Clara Zhang",
    mrn: "MRN-31849",
    room: "SD-108",
    unit: "Step-Down",
    title: "Duoneb (Albuterol / Ipratropium) Inhalation Therapy",
    description: "3 mL unit dose via nebulizer with 6L oxygen flow. Monitor post-treatment lung sounds.",
    category: "MEDICATION_PASS",
    priority: "HIGH",
    dueTime: "10:00",
    done: false,
  },
  {
    id: "tsk-006",
    patientId: "pat-surg-03",
    patientName: "Marcus Holloway",
    mrn: "MRN-43901",
    room: "4W-405",
    unit: "Med-Surg",
    title: "Incentive Spirometry Coaching (10 Breaths/Hour)",
    description: "Post-op Day 2 colectomy: coach patient to achieve 1500 mL target volume.",
    category: "ASSESSMENT",
    priority: "ROUTINE",
    dueTime: "11:00",
    done: false,
  },
  {
    id: "tsk-007",
    patientId: "pat-med-05",
    patientName: "David Kim",
    mrn: "MRN-19402",
    room: "4W-412",
    unit: "Med-Surg",
    title: "Administer Ceftriaxone 1g IVPB in 100ml NS",
    description: "Primary CAP antibiotic coverage. Infuse over 30 mins via dedicated peripheral line.",
    category: "MEDICATION_PASS",
    priority: "HIGH",
    dueTime: "09:00",
    done: true,
    completedAt: "08:58",
    completedBy: "Alex Rivera, RN",
  },
  {
    id: "tsk-008",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    title: "Hourly Urinary Output & Strict Fluid Balance Log",
    description: "Foley catheter output measure. Notify provider if < 0.5 mL/kg/hr.",
    category: "VITALS_LABS",
    priority: "HIGH",
    dueTime: "09:00",
    done: true,
    completedAt: "09:02",
    completedBy: "Sarah Jenkins, RN (CCRN)",
  },
];

export default function NurseTasksPage() {
  const { status: wsStatus } = useUserWebSocket();
  const [tasks, setTasks] = React.useState<NurseTaskItem[]>(INITIAL_TASKS);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("ALL");
  const [selectedUnit, setSelectedUnit] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  // Telemetry Sweep Canvas
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [focusedTaskId, setFocusedTaskId] = React.useState<string>("tsk-001");

  // Create Task Modal State
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);
  const [taskForm, setTaskForm] = React.useState({
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    title: "",
    description: "",
    category: "MEDICATION_PASS" as TaskCategory,
    priority: "HIGH" as TaskPriority,
    dueTime: "11:30",
    dualSignoff: false,
  });
  const [notificationMsg, setNotificationMsg] = React.useState<string | null>(null);

  // Dual Sign-off Modal
  const [dualSignoffModalOpen, setDualSignoffModalOpen] = React.useState(false);
  const [pendingSignoffTask, setPendingSignoffTask] = React.useState<NurseTaskItem | null>(null);
  const [coSignerName, setCoSignerName] = React.useState("Kavita Patel, RN (Charge Nurse)");

  const activeTask = React.useMemo(() => {
    return tasks.find((t) => t.id === focusedTaskId) || tasks[0];
  }, [tasks, focusedTaskId]);

  // Lead II ECG Canvas Animation
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
    const isStat = activeTask?.priority === "STAT" && !activeTask.done;
    const hr = isStat ? 116 : 76;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(x, 0, 10, height);

      ctx.strokeStyle = isStat ? "rgba(244, 63, 94, 0.12)" : "rgba(16, 185, 129, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const prevX = x;
      x += 2.2;
      if (x >= width) x = 0;

      phase = (phase + 0.08 * (hr / 75)) % (Math.PI * 2);
      let dy = 0;
      const beat = phase / (Math.PI * 2);

      if (beat > 0.15 && beat < 0.22) {
        dy = -Math.sin(((beat - 0.15) / 0.07) * Math.PI) * 7;
      } else if (beat >= 0.22 && beat < 0.26) {
        dy = 4;
      } else if (beat >= 0.26 && beat < 0.32) {
        const spike = isStat ? 38 : 28;
        dy = -Math.sin(((beat - 0.26) / 0.06) * Math.PI) * spike;
      } else if (beat >= 0.32 && beat < 0.36) {
        dy = 8;
      } else if (beat >= 0.36 && beat < 0.44) {
        dy = isStat ? -6 : 0;
      } else if (beat >= 0.44 && beat < 0.6) {
        dy = -Math.sin(((beat - 0.44) / 0.16) * Math.PI) * 12;
      } else {
        dy = (Math.random() - 0.5) * 1.5;
      }

      ctx.beginPath();
      ctx.strokeStyle = isStat ? "#f43f5e" : activeTask?.priority === "HIGH" && !activeTask.done ? "#f59e0b" : "#10b981";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = isStat ? "rgba(244, 63, 94, 0.8)" : "#10b981";
      ctx.shadowBlur = 6;
      ctx.moveTo(prevX, midY + dy);
      ctx.lineTo(x, midY + dy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeTask]);

  // Toggle Task Completion
  const handleToggleTask = (task: NurseTaskItem) => {
    if (!task.done && task.dualSignoffRequired) {
      setPendingSignoffTask(task);
      setDualSignoffModalOpen(true);
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              done: !t.done,
              completedAt: !t.done ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
              completedBy: !t.done ? "Sarah Jenkins, RN" : undefined,
            }
          : t
      )
    );

    const actionText = !task.done ? "completed & signed off" : "reopened";
    setNotificationMsg(`Task "${task.title}" ${actionText}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Dual Sign-off Submission
  const handleCompleteDualSignoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingSignoffTask) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === pendingSignoffTask.id
          ? {
              ...t,
              done: true,
              completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              completedBy: "Sarah Jenkins, RN",
              dualSignoffBy: coSignerName,
            }
          : t
      )
    );

    setDualSignoffModalOpen(false);
    setNotificationMsg(`✅ High-Alert task "${pendingSignoffTask.title}" co-signed by ${coSignerName}.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Create Task Submission
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const newTask: NurseTaskItem = {
      id: `tsk-${Date.now()}`,
      patientId: `pat-${Date.now()}`,
      patientName: taskForm.patientName,
      mrn: taskForm.mrn,
      room: taskForm.room,
      unit: taskForm.unit,
      title: taskForm.title,
      description: taskForm.description,
      category: taskForm.category,
      priority: taskForm.priority,
      dueTime: taskForm.dueTime,
      done: false,
      dualSignoffRequired: taskForm.dualSignoff,
    };

    setTasks((prev) => [newTask, ...prev]);
    setFocusedTaskId(newTask.id);
    setNewTaskOpen(false);
    setTaskForm({
      patientName: "Elena Rostova",
      mrn: "MRN-89421",
      room: "ICU-04",
      unit: "ICU",
      title: "",
      description: "",
      category: "MEDICATION_PASS",
      priority: "HIGH",
      dueTime: "11:30",
      dualSignoff: false,
    });
    setNotificationMsg(`✅ Bedside task "${newTask.title}" added to shift schedule.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Quick Preset Loader
  const handleLoadPreset = (preset: "SEPSIS_VITALS" | "VANCO_TROUGH" | "GLUCOSE_CHECK") => {
    if (preset === "SEPSIS_VITALS") {
      setTaskForm({
        ...taskForm,
        title: "Q1H Sepsis Vital Signs & Urine Output Check",
        description: "Verify MAP ≥ 65, SpO2 ≥ 92%, and urine output > 30 mL/hr.",
        category: "VITALS_LABS",
        priority: "STAT",
        dueTime: "10:00",
        dualSignoff: false,
      });
    } else if (preset === "VANCO_TROUGH") {
      setTaskForm({
        ...taskForm,
        title: "Vancomycin Trough Lab Draw (30 min prior to Dose 4)",
        description: "Target trough 15-20 mcg/mL. Do not administer infusion until trough drawn.",
        category: "VITALS_LABS",
        priority: "HIGH",
        dueTime: "11:30",
        dualSignoff: false,
      });
    } else {
      setTaskForm({
        ...taskForm,
        title: "Bedside Point-of-Care Blood Glucose (Pre-Prandial)",
        description: "Administer sliding scale Humalog insulin per protocol if BG > 150 mg/dL.",
        category: "MEDICATION_PASS",
        priority: "HIGH",
        dueTime: "11:45",
        dualSignoff: true,
      });
    }
  };

  // Filtered Tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      if (selectedCategory !== "ALL" && t.category !== selectedCategory) return false;
      if (selectedPriority !== "ALL" && t.priority !== selectedPriority) return false;
      if (selectedUnit !== "ALL" && t.unit.toLowerCase() !== selectedUnit.toLowerCase()) return false;
      if (selectedStatus === "PENDING" && t.done) return false;
      if (selectedStatus === "COMPLETED" && !t.done) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchPatient = t.patientName.toLowerCase().includes(q);
        const matchRoom = t.room.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchPatient && !matchRoom) return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, selectedPriority, selectedUnit, selectedStatus, search]);

  const counts = React.useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => !t.done).length;
    const overdue = tasks.filter((t) => !t.done && t.isOverdue).length;
    const completed = tasks.filter((t) => t.done).length;
    const statPending = tasks.filter((t) => !t.done && t.priority === "STAT").length;
    return { total, pending, overdue, completed, statPending };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
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
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Nursing Shift Task &amp; Medication Schedule
                  <span className="h-6 px-2.5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                    {counts.pending} Due Today
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time bedside medication passes, Q1H telemetry checks, assessment schedules, and dual-signatures.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{wsStatus === "connected" ? "Shift Roster Live" : "Socket Synchronized"}</span>
            </div>

            <Button
              onClick={() => setNewTaskOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Bedside Task
            </Button>
          </div>
        </div>

        {/* Lead II Monitor for Active Task Focus */}
        {activeTask && (
          <Card className="bg-[#090d16] border-slate-800 text-white shadow-lg overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                  Task Telemetry Focus: {activeTask.patientName} ({activeTask.room}) — Due {activeTask.dueTime}
                </div>
                <Badge
                  className={`text-[10px] font-mono border ${
                    activeTask.priority === "STAT"
                      ? "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                      : "bg-emerald-950 text-emerald-300 border-emerald-800"
                  }`}
                >
                  {activeTask.priority} PRIORITY
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="text-emerald-400">STATUS: {activeTask.done ? "COMPLETED" : "PENDING PASS"}</span>
                <span className="text-cyan-400">CATEGORY: {activeTask.category.replace("_", " ")}</span>
                <span className="text-amber-400">UNIT: {activeTask.unit}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              <canvas
                ref={canvasRef}
                width={1000}
                height={100}
                className="w-full h-24 block cursor-crosshair"
              />
              <div className="absolute bottom-2 right-4 text-[10px] font-mono text-slate-500 pointer-events-none">
                Real-Time Bedside Task Monitor | Shift: 0700-1900 Day RN
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">STAT &amp; Overdue</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-600">{counts.statPending + counts.overdue}</span>
                <span className="text-xs text-rose-500 font-medium">Immediate Action</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-sky-600 uppercase tracking-wider">Due Next 60 Min</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-sky-600">{counts.pending}</span>
                <span className="text-xs text-sky-500 font-medium">Pending Execution</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wider">High-Alert Co-Sign</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-purple-600">
                  {tasks.filter((t) => t.dualSignoffRequired && !t.done).length}
                </span>
                <span className="text-xs text-purple-500 font-medium">Dual RN Verified</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Completed Today</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600">{counts.completed}</span>
                <span className="text-xs text-emerald-500 font-medium">Signed &amp; Audited</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Category Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Category:
            </span>
            {[
              { id: "ALL", label: "All Tasks" },
              { id: "MEDICATION_PASS", label: "Medication Passes (BCMA)" },
              { id: "VITALS_LABS", label: "Vitals & Lab Draws" },
              { id: "ASSESSMENT", label: "Bedside Assessments" },
              { id: "PROCEDURE_ASSIST", label: "Procedures" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedCategory === tab.id
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task, medication, room, patient…"
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Priorities</option>
                <option value="STAT">STAT Priority</option>
                <option value="HIGH">High Urgency</option>
                <option value="ROUTINE">Routine Schedule</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Tasks</option>
                <option value="PENDING">Pending Only</option>
                <option value="COMPLETED">Completed Only</option>
              </select>

              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Units</option>
                <option value="ICU">ICU</option>
                <option value="Telemetry">Telemetry 3B</option>
                <option value="Step-Down">Step-Down</option>
                <option value="Med-Surg">Med-Surg 4W</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List Feed */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">All Scheduled Tasks Done</h3>
              <p className="text-xs text-slate-400 mt-1">No pending tasks found for the current filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedPriority("ALL");
                  setSelectedStatus("ALL");
                  setSelectedUnit("ALL");
                  setSearch("");
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isStat = task.priority === "STAT" && !task.done;
              const isFocused = task.id === focusedTaskId;

              return (
                <div
                  key={task.id}
                  onClick={() => setFocusedTaskId(task.id)}
                  className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer shadow-sm ${
                    isFocused
                      ? "ring-2 ring-sky-500 border-sky-300"
                      : isStat
                      ? "border-rose-300 bg-rose-50/20"
                      : task.done
                      ? "border-slate-200 opacity-60 bg-slate-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task);
                      }}
                      className="mt-0.5 shrink-0 text-slate-300 hover:text-sky-600 transition-colors"
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-300 hover:text-sky-600" />
                      )}
                    </button>

                    {/* Task Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={`text-[10px] font-bold border ${
                            isStat
                              ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                              : task.priority === "HIGH" && !task.done
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {task.priority}
                        </Badge>

                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                          {task.category.replace("_", " ")}
                        </Badge>

                        {task.dualSignoffRequired && (
                          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                            Dual-RN Co-Sign
                          </Badge>
                        )}

                        {task.isOverdue && !task.done && (
                          <Badge className="bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                            ⚠️ OVERDUE
                          </Badge>
                        )}

                        <span className="text-xs text-slate-400">·</span>
                        <span className="font-bold text-slate-900 text-sm">{task.patientName}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({task.unit} · Room {task.room})
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold ${
                          task.done ? "line-through text-slate-400" : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>

                      {/* Completed Details */}
                      {task.done && (
                        <p className="text-[11px] text-emerald-700 font-medium pt-1 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Completed at {task.completedAt} by {task.completedBy}
                          {task.dualSignoffBy && ` (Co-signed by ${task.dualSignoffBy})`}
                        </p>
                      )}
                    </div>

                    {/* Right Time Column */}
                    <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="h-3.5 w-3.5 text-sky-600" />
                        <span>Due: {task.dueTime}</span>
                      </div>

                      <Link
                        href={`/nurse/patients/${task.patientId}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add New Task Modal */}
      {newTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Add Bedside Shift Task</h3>
              </div>
              <button onClick={() => setNewTaskOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="pt-3 pb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => handleLoadPreset("SEPSIS_VITALS")}
                className="px-2 py-0.5 text-xs rounded bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-medium"
              >
                Q1H Sepsis Vitals
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("VANCO_TROUGH")}
                className="px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium"
              >
                Vancomycin Trough
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("GLUCOSE_CHECK")}
                className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
              >
                POC Glucose &amp; Insulin
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title / Action</label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Flush central venous line with Heparin 100u/mL..."
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Instructions / Orders</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Specific bedside instructions, parameters, or lab targets..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as TaskCategory })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-8"
                  >
                    <option value="MEDICATION_PASS">Medication Pass</option>
                    <option value="VITALS_LABS">Vitals &amp; Labs</option>
                    <option value="ASSESSMENT">Bedside Assessment</option>
                    <option value="PROCEDURE_ASSIST">Procedure Assist</option>
                    <option value="HANDOVER_ADMIN">Shift Handover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-8"
                  >
                    <option value="STAT">STAT Priority</option>
                    <option value="HIGH">High Urgency</option>
                    <option value="ROUTINE">Routine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Due Time</label>
                  <Input
                    type="time"
                    value={taskForm.dueTime}
                    onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="dualSignoffCheck"
                    checked={taskForm.dualSignoff}
                    onChange={(e) => setTaskForm({ ...taskForm, dualSignoff: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-600"
                  />
                  <label htmlFor="dualSignoffCheck" className="text-xs font-semibold text-purple-800">
                    Require Dual RN Co-Sign
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setNewTaskOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5">
                  <Plus className="h-4 w-4" />
                  Commit to Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual Sign-off Modal */}
      {dualSignoffModalOpen && pendingSignoffTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Dual RN Co-Signature Required</h3>
              </div>
              <button onClick={() => setDualSignoffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteDualSignoff} className="space-y-3 pt-3">
              <p className="text-xs text-slate-600">
                High-alert medication administration policy requires secondary independent verification by an authorized RN.
              </p>

              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-0.5">
                <p className="font-bold">{pendingSignoffTask.title}</p>
                <p className="text-[11px] text-purple-700">Patient: {pendingSignoffTask.patientName} ({pendingSignoffTask.room})</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Co-Signing Nurse Name</label>
                <Input
                  value={coSignerName}
                  onChange={(e) => setCoSignerName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setDualSignoffModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5">
                  <Check className="h-4 w-4" />
                  Dual-Sign &amp; Complete Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
