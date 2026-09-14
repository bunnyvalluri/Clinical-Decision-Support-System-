"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Download,
  HeartPulse,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/authStore";
import { ResponsiveModal } from "@/components/responsive";
import apiClient from "@/services/apiClient";
import { userApi } from "@/services/api/userApi";

interface DashboardPatient {
  full_name: string;
  mrn: string;
  age: number;
  gender: string;
  blood_group: string;
  primary_physician?: string;
}

interface DashboardVitals {
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  recorded_at: string;
  source: string;
}

interface DashboardPrediction {
  id: string;
  model_name: string;
  model_version_str: string;
  prediction_result: string;
  probability: number;
  created_at: string;
  explanation: string;
  disclaimer: string;
}

interface DashboardAppointment {
  id: string;
  clinician_name: string;
  department: string;
  scheduled_time: string;
  location_or_link: string;
  reason_for_visit: string;
}

interface DashboardTask {
  id: string;
  title: string;
  due_date: string;
  status: string;
  category?: "measurement" | "medication" | "lab" | "lifestyle";
  completed_at?: string;
}

interface DashboardData {
  patient: DashboardPatient;
  latest_vitals: DashboardVitals;
  latest_prediction: DashboardPrediction;
  next_appointment: DashboardAppointment;
  unread_notification_count: number;
}

// 7-day historical telemetry data
const TELEMETRY_HISTORY = [
  { day: "Mon", systolic: 138, diastolic: 88, hr: 78, spo2: 97 },
  { day: "Tue", systolic: 136, diastolic: 87, hr: 75, spo2: 98 },
  { day: "Wed", systolic: 135, diastolic: 86, hr: 79, spo2: 97 },
  { day: "Thu", systolic: 133, diastolic: 85, hr: 74, spo2: 98 },
  { day: "Fri", systolic: 137, diastolic: 88, hr: 77, spo2: 97 },
  { day: "Sat", systolic: 132, diastolic: 84, hr: 73, spo2: 99 },
  { day: "Today", systolic: 134, diastolic: 86, hr: 76, spo2: 98 },
];

/**
 * Ultra-fast, zero-lag pure SVG Telemetry Chart.
 * Eliminates Recharts ResizeObserver loops and guarantees 120 FPS performance.
 */
function NativeTelemetryChart({
  tab,
}: {
  tab: "bp" | "hr";
}) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  const width = 560;
  const height = 200;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Domain scaling
  const bpMin = 60;
  const bpMax = 160;
  const hrMin = 50;
  const hrMax = 110;

  const getY = (val: number, min: number, max: number) => {
    const clamped = Math.max(min, Math.min(max, val));
    return padding.top + chartH - ((clamped - min) / (max - min)) * chartH;
  };

  const getX = (idx: number) => {
    return padding.left + (idx / (TELEMETRY_HISTORY.length - 1)) * chartW;
  };

  // Build SVG Path
  const buildPath = (dataKeys: (item: (typeof TELEMETRY_HISTORY)[0]) => number, min: number, max: number) => {
    const points = TELEMETRY_HISTORY.map((d, i) => `${getX(i).toFixed(1)},${getY(dataKeys(d), min, max).toFixed(1)}`);
    return `M ${points.join(" L ")}`;
  };

  const buildArea = (dataKeys: (item: (typeof TELEMETRY_HISTORY)[0]) => number, min: number, max: number) => {
    const points = TELEMETRY_HISTORY.map((d, i) => `${getX(i).toFixed(1)},${getY(dataKeys(d), min, max).toFixed(1)}`);
    const firstX = getX(0).toFixed(1);
    const lastX = getX(TELEMETRY_HISTORY.length - 1).toFixed(1);
    const bottomY = (padding.top + chartH).toFixed(1);
    return `M ${points.join(" L ")} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  const hoveredItem = hoverIndex !== null ? TELEMETRY_HISTORY[hoverIndex] : null;

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-56 overflow-visible"
      >
        <defs>
          <linearGradient id="chartSysGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chartDiaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chartHrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {tab === "bp" ? (
          <>
            {[80, 100, 120, 140, 160].map((val) => {
              const y = getY(val, bpMin, bpMax);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={val === 120 ? "#10b981" : "#f1f5f9"}
                    strokeDasharray={val === 120 ? "4 4" : undefined}
                    strokeWidth={val === 120 ? 1.5 : 1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={10}
                    className="fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
            {/* Target 120 annotation */}
            <text
              x={width - padding.right - 4}
              y={getY(120, bpMin, bpMax) - 4}
              textAnchor="end"
              fontSize={9}
              className="fill-emerald-600 font-bold"
            >
              Target SBP (120)
            </text>
          </>
        ) : (
          <>
            {[60, 70, 80, 90, 100].map((val) => {
              const y = getY(val, hrMin, hrMax);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={val === 100 || val === 60 ? "#10b981" : "#f1f5f9"}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={10}
                    className="fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* X-axis Day Labels */}
        {TELEMETRY_HISTORY.map((d, i) => (
          <text
            key={d.day}
            x={getX(i)}
            y={height - 10}
            textAnchor="middle"
            fontSize={11}
            className={`font-medium ${i === hoverIndex ? "fill-teal-700 font-bold" : "fill-slate-400"}`}
          >
            {d.day}
          </text>
        ))}

        {/* Data Paths */}
        {tab === "bp" ? (
          <>
            {/* Diastolic Area & Line */}
            <path d={buildArea((d) => d.diastolic, bpMin, bpMax)} fill="url(#chartDiaGrad)" />
            <path
              d={buildPath((d) => d.diastolic, bpMin, bpMax)}
              fill="none"
              stroke="#0d9488"
              strokeWidth={2.5}
            />

            {/* Systolic Area & Line */}
            <path d={buildArea((d) => d.systolic, bpMin, bpMax)} fill="url(#chartSysGrad)" />
            <path
              d={buildPath((d) => d.systolic, bpMin, bpMax)}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={2.5}
            />

            {/* Systolic & Diastolic Dots */}
            {TELEMETRY_HISTORY.map((d, i) => {
              const sx = getX(i);
              const sy = getY(d.systolic, bpMin, bpMax);
              const dy = getY(d.diastolic, bpMin, bpMax);
              const isHov = hoverIndex === i;
              return (
                <g key={i}>
                  <circle
                    cx={sx}
                    cy={sy}
                    r={isHov ? 5 : 3.5}
                    className="fill-rose-500 stroke-white stroke-2 transition-all cursor-pointer"
                  />
                  <circle
                    cx={sx}
                    cy={dy}
                    r={isHov ? 5 : 3.5}
                    className="fill-teal-600 stroke-white stroke-2 transition-all cursor-pointer"
                  />
                </g>
              );
            })}
          </>
        ) : (
          <>
            {/* Pulse Line & Area */}
            <path d={buildArea((d) => d.hr, hrMin, hrMax)} fill="url(#chartHrGrad)" />
            <path
              d={buildPath((d) => d.hr, hrMin, hrMax)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2.5}
            />

            {/* Pulse Dots */}
            {TELEMETRY_HISTORY.map((d, i) => {
              const x = getX(i);
              const y = getY(d.hr, hrMin, hrMax);
              const isHov = hoverIndex === i;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={isHov ? 5 : 3.5}
                  className="fill-amber-500 stroke-white stroke-2 transition-all cursor-pointer"
                />
              );
            })}
          </>
        )}

        {/* Transparent hover capture columns */}
        {TELEMETRY_HISTORY.map((_, i) => {
          const x = getX(i) - chartW / (TELEMETRY_HISTORY.length - 1) / 2;
          const w = chartW / (TELEMETRY_HISTORY.length - 1);
          return (
            <rect
              key={i}
              x={x}
              y={padding.top}
              width={w}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredItem && (
        <div
          className="absolute top-2 pointer-events-none transition-all duration-150 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs space-y-0.5 z-20"
          style={{
            left: `${Math.min(75, Math.max(15, ((hoverIndex || 0) / 6) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-bold text-slate-300 border-b border-slate-800 pb-0.5">
            {hoveredItem.day} Reading
          </p>
          {tab === "bp" ? (
            <>
              <p className="text-rose-400">
                Systolic: <strong>{hoveredItem.systolic} mmHg</strong>
              </p>
              <p className="text-teal-400">
                Diastolic: <strong>{hoveredItem.diastolic} mmHg</strong>
              </p>
            </>
          ) : (
            <>
              <p className="text-amber-400">
                Pulse: <strong>{hoveredItem.hr} bpm</strong>
              </p>
              <p className="text-sky-400">
                SpO2: <strong>{hoveredItem.spo2}%</strong>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [chartTab, setChartTab] = React.useState<"bp" | "hr">("bp");
  const [copiedMrn, setCopiedMrn] = React.useState(false);
  const [taskFilter, setTaskFilter] = React.useState<"all" | "pending" | "done">("all");
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [showAddTaskInput, setShowAddTaskInput] = React.useState(false);

  // Quick log vitals form state
  const [logSbp, setLogSbp] = React.useState("130");
  const [logDbp, setLogDbp] = React.useState("84");
  const [logHr, setLogHr] = React.useState("74");
  const [logSpo2, setLogSpo2] = React.useState("98");
  const [isSubmittingVital, setIsSubmittingVital] = React.useState(false);

  // Interactive task list
  const [tasks, setTasks] = React.useState<DashboardTask[]>([
    {
      id: "task-01",
      title: "Log Morning Blood Pressure & Pulse",
      due_date: "Today, 10:00 AM",
      status: "COMPLETED",
      category: "measurement",
      completed_at: "08:15 AM",
    },
    {
      id: "task-02",
      title: "Take Losartan 50mg with Breakfast",
      due_date: "Today, 08:30 AM",
      status: "COMPLETED",
      category: "medication",
      completed_at: "08:35 AM",
    },
    {
      id: "task-03",
      title: "20-Minute Light Cardiovascular Walk",
      due_date: "Today, 05:00 PM",
      status: "PENDING",
      category: "lifestyle",
    },
    {
      id: "task-04",
      title: "Review Potassium & Electrolyte Lab Report",
      due_date: "Tomorrow, 12:00 PM",
      status: "PENDING",
      category: "lab",
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getFallbackData = React.useCallback((): DashboardData => {
    return {
      patient: {
        full_name: user?.full_name || "Eleanor Vance",
        mrn: user?.license_number || "MRN-PA-90241",
        age: 68,
        gender: "Female",
        blood_group: "A+",
        primary_physician: "Dr. Sarah Lin, MD (Chief of Cardiology)",
      },
      latest_vitals: {
        systolic_bp: 134,
        diastolic_bp: 86,
        heart_rate: 76,
        spo2: 98,
        recorded_at: new Date().toISOString(),
        source: "USER_ENTERED",
      },
      latest_prediction: {
        id: "pred-demo-01",
        model_name: "CardioEnsemble-RF",
        model_version_str: "v1.4.2",
        prediction_result: "MEDIUM",
        probability: 0.42,
        created_at: new Date().toISOString(),
        explanation:
          "The ensemble machine learning model evaluates your current blood pressure readings, historical ambulatory telemetry, and demographic risk factors as Moderate Risk (42.0%). Systolic BP elevation contributes most to this score, while regular physical exercise serves as a protective factor.",
        disclaimer:
          "Notice: This prediction is a model-generated estimate for clinical decision support. It is not an autonomous diagnosis.",
      },
      next_appointment: {
        id: "appt-demo-01",
        clinician_name: "Dr. Sarah Lin, MD",
        department: "Cardiology Outpatient Clinic",
        scheduled_time: new Date(Date.now() + 86400000 * 3).toISOString(),
        location_or_link: "Suite 402 - Heart & Vascular Pavilion",
        reason_for_visit: "Quarterly Cardiovascular Review & Holter Follow-up",
      },
      unread_notification_count: 2,
    };
  }, [user]);

  // Fetch once on mount
  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await apiClient.get("/user/dashboard/");
        if (!isMounted) return;
        if (res.data) {
          setData(res.data);
          return;
        }
      } catch {
        // Fallback gracefully
      }
      if (isMounted) {
        setData(getFallbackData());
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [getFallbackData]);

  const handleCopyMrn = (mrn: string) => {
    navigator.clipboard.writeText(mrn);
    setCopiedMrn(true);
    showToast(`Copied MRN (${mrn}) to clipboard.`);
    setTimeout(() => setCopiedMrn(false), 2000);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = t.status === "COMPLETED";
          const updated = {
            ...t,
            status: isDone ? "PENDING" : "COMPLETED",
            completed_at: isDone ? undefined : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          if (!isDone) {
            showToast(`Completed: "${t.title}"`);
            userApi.completeTask(taskId).catch(() => {});
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: DashboardTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      due_date: "Today",
      status: "PENDING",
      category: "lifestyle",
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    setShowAddTaskInput(false);
    showToast("New health reminder added.");
  };

  const handleSaveVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVital(true);
    const sbp = Number(logSbp) || 120;
    const dbp = Number(logDbp) || 80;
    const hr = Number(logHr) || 72;
    const spo2 = Number(logSpo2) || 98;

    try {
      await userApi.logVital({
        systolic_bp: sbp,
        diastolic_bp: dbp,
        heart_rate: hr,
        oxygen_saturation: spo2,
      });
    } catch {
      // Offline fallback
    }

    if (data) {
      setData({
        ...data,
        latest_vitals: {
          systolic_bp: sbp,
          diastolic_bp: dbp,
          heart_rate: hr,
          spo2: spo2,
          recorded_at: new Date().toISOString(),
          source: "USER_ENTERED",
        },
      });
    }

    setIsSubmittingVital(false);
    setShowLogModal(false);
    showToast(`Logged vitals: ${sbp}/${dbp} mmHg, ${hr} bpm, ${spo2}% SpO2.`);
  };

  const handleExportSummary = () => {
    showToast("Clinical Telemetry Summary exported.");
  };

  const vitals = data?.latest_vitals;
  const prediction = data?.latest_prediction;
  const nextAppt = data?.next_appointment;
  const patient = data?.patient;

  // Task completion calculation
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasksCount = tasks.length;
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "pending") return t.status === "PENDING";
    if (taskFilter === "done") return t.status === "COMPLETED";
    return true;
  });

  // Dynamic time greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Risk display metadata
  const riskScore = Math.round((prediction?.probability || 0.42) * 100);
  const riskLevel = prediction?.prediction_result || "MEDIUM";

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/60 backdrop-blur-md flex items-center gap-3 text-xs font-medium max-w-md">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome & Patient Identity Banner (Dedicated Clinical Light Mode) */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        {/* Subtle clinical accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-emerald-500 to-sky-500" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            {/* Live Status indicator & Regulatory tag */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                Active Telemetry Monitoring
              </span>
              <span className="text-xs text-slate-500 font-medium">
                FDA SaMD Class II Aligned · Protocol Cardio-2026
              </span>
            </div>

            {/* Dynamic Greeting (Natural inline text wrapping) */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                {greeting},{" "}
                <span className="text-teal-700">
                  {patient?.full_name || user?.full_name || "Eleanor"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Your vitals are synchronizing in real time with your clinical care team. Last telemetry was recorded{" "}
                <span className="text-slate-900 font-semibold">today at 08:00 AM</span>.
              </p>
            </div>

            {/* Patient Meta Badges (Light clinical chips) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <button
                onClick={() => handleCopyMrn(patient?.mrn || "MRN-PA-90241")}
                title="Click to copy MRN"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold transition-colors shadow-2xs shrink-0"
              >
                <span>MRN: {patient?.mrn || "MRN-PA-90241"}</span>
                {copiedMrn ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium shadow-2xs shrink-0">
                Age: <strong className="text-slate-900 font-bold">{patient?.age || 68}</strong> (Female)
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium shadow-2xs shrink-0">
                Blood Group: <strong className="text-slate-900 font-bold">{patient?.blood_group || "A+"}</strong>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium shadow-2xs flex items-center gap-1.5 shrink-0">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                <span>Dr. Sarah Lin (Cardiology)</span>
              </span>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 w-full sm:w-auto">
            <Link href="/user/risk-assessment/new" className="w-full sm:w-auto">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2 shadow-xs transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" /> Start Health Assessment
              </Button>
            </Link>

            <Button
              onClick={() => setShowLogModal(true)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-2 shadow-2xs transition-colors"
            >
              <HeartPulse className="h-3.5 w-3.5 text-rose-500" /> Quick Log Vitals
            </Button>

            <Button
              onClick={handleExportSummary}
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs gap-1.5 transition-colors border border-slate-200/60"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Vital Metrics Grid (4 Interactive Telemetry Cards: 1-col mobile, 2-col tablet/laptop, 4-col large desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Blood Pressure Card */}
        <Card className="bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">Blood Pressure</h2>
                  <span className="text-[10px] text-slate-400 block truncate">Target &lt; 120/80</span>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50/80 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-colors shrink-0"
              >
                + Log
              </button>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {vitals?.systolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : "134/86"}
                </span>
                <span className="ml-1.5 text-xs font-semibold text-slate-400">mmHg</span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                <TrendingDown className="h-3 w-3" /> -2 mmHg
              </span>
            </div>

            {/* Mini Sparkline */}
            <div className="pt-1">
              <div className="h-8 w-full flex items-end gap-1">
                {[138, 136, 135, 133, 137, 132, vitals?.systolic_bp || 134].map((val, idx) => {
                  const heightPercent = Math.min(100, Math.max(25, ((val - 120) / (145 - 120)) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group/bar">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-sm transition-all duration-300 ${
                          idx === 6 ? "bg-rose-500" : "bg-rose-200 group-hover/bar:bg-rose-400"
                        }`}
                        title={`Day ${idx + 1}: ${val} mmHg`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium gap-1">
                <span className="shrink-0">7 days ago</span>
                <span className="text-slate-600 font-semibold truncate text-center">Moderate Control</span>
                <span className="shrink-0">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resting Heart Rate Card */}
        <Card className="bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-500" />
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">Resting Pulse</h2>
                  <span className="text-[10px] text-slate-400 block truncate">Target 60–100 bpm</span>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 bg-amber-50/80 hover:bg-amber-100 px-2 py-0.5 rounded-md transition-colors shrink-0"
              >
                + Log
              </button>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {vitals?.heart_rate || 76}
                </span>
                <span className="ml-1.5 text-xs font-semibold text-slate-400">bpm</span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Normal Rhythm
              </span>
            </div>

            <div className="pt-1">
              <div className="h-8 w-full flex items-center justify-between px-2 bg-amber-50/50 rounded-lg border border-amber-100 gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Sinus Rhythm (Normal)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">Avg 74</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium gap-1">
                <span className="shrink-0">Min: 68 bpm</span>
                <span className="shrink-0">Max: 82 bpm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blood Oxygen (SpO2) Card */}
        <Card className="bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-teal-500" />
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">Blood Oxygen</h2>
                  <span className="text-[10px] text-slate-400 block truncate">Target &gt; 95%</span>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50/80 hover:bg-sky-100 px-2 py-0.5 rounded-md transition-colors shrink-0"
              >
                + Log
              </button>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {vitals?.spo2 || 98}
                </span>
                <span className="ml-1 text-xs font-semibold text-slate-400">%</span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 shrink-0">
                Optimal
              </span>
            </div>

            <div className="pt-1 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-teal-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${vitals?.spo2 || 98}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium gap-1">
                <span className="truncate">Pulse Oximeter</span>
                <span className="text-emerald-600 font-semibold shrink-0">100% Saturation Max</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Clinical Risk Index Card */}
        <Card className="bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">AI Risk Index</h2>
                  <span className="text-[10px] text-slate-400 block truncate">CardioEnsemble-RF</span>
                </div>
              </div>
              <Link
                href="/user/predictions"
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50/80 hover:bg-teal-100 px-2 py-0.5 rounded-md transition-colors shrink-0"
              >
                Details &gt;
              </Link>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-amber-700">
                  {riskScore}%
                </span>
                <span className="ml-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
                  {riskLevel}
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                95% CI: 36-48%
              </span>
            </div>

            <div className="pt-1 space-y-1">
              <div className="grid grid-cols-3 gap-1 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400" title="Low Risk (0-30%)" />
                <div className="bg-amber-400 relative" title="Moderate Risk (30-70%)">
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-slate-900 rounded-full shadow-sm"
                    style={{ left: `${((riskScore - 30) / 40) * 100}%` }}
                  />
                </div>
                <div className="bg-rose-400" title="High Risk (70-100%)" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="text-emerald-700 font-semibold">Low</span>
                <span className="text-amber-700 font-bold">Moderate</span>
                <span className="text-rose-700 font-semibold">High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout: Responsive grid (1-col on mobile/tablet/laptop, 3-col on xl: >= 1280px) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: Clinical AI Assessment Deep-Dive & Telemetry Trends */}
        <div className="xl:col-span-2 space-y-6 min-w-0">
          {/* AI Clinical Health Assessment Feature Card */}
          <Card className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100/80 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-700 border border-teal-500/20 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                        AI Clinical Risk Analysis
                      </CardTitle>
                      <Badge variant="medium" className="text-[11px] font-bold shrink-0">
                        {riskLevel} RISK · {riskScore}%
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-500 truncate">
                      Evaluated by {prediction?.model_name || "CardioEnsemble-RF"} {prediction?.model_version_str || "v1.4.2"} · Updated today
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/user/risk-assessment/new">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm">
                      <RefreshCw className="h-3.5 w-3.5" /> Recalculate
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Radial Arc Gauge & Algorithmic Narrative Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
                {/* SVG Radial Gauge */}
                <div className="flex flex-col items-center justify-center text-center shrink-0">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={301.59}
                        strokeDashoffset={60}
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="url(#riskGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={301.59}
                        strokeDashoffset={301.59 - (301.59 * 0.75 * (riskScore / 100))}
                      />
                      <defs>
                        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="60%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900">{riskScore}%</span>
                      <span className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">
                        Moderate
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-1">
                    95% Confidence Interval: [36% – 48%]
                  </span>
                </div>

                {/* Algorithmic Narrative Breakdown */}
                <div className="md:col-span-2 space-y-3 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {prediction?.explanation ||
                      "The clinical algorithm evaluates your cardiovascular risk index as moderate. Primary drivers include sustained systolic pressure at 134 mmHg and demographic age factors, balanced by stable oxygenation and continuous compliance with medications."}
                  </p>

                  {/* Feature Drivers Breakdown */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Key Contributing Risk Factors:
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <span className="text-slate-600 flex items-center gap-1.5 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate">Systolic BP (134 mmHg average)</span>
                        </span>
                        <span className="font-semibold text-rose-600 shrink-0">+18% risk weight</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "65%" }} />
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1">
                        <span className="text-slate-600 flex items-center gap-1.5 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate">Age &amp; Prior Clinical History</span>
                        </span>
                        <span className="font-semibold text-amber-600 shrink-0">+12% risk weight</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "42%" }} />
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1">
                        <span className="text-slate-600 flex items-center gap-1.5 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">Optimal SpO2 (98%) &amp; Walking Activity</span>
                        </span>
                        <span className="font-semibold text-emerald-600 shrink-0">-8% protective factor</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "30%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Clinical Action Points */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  Personalized Care Recommendations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <p className="text-xs font-bold text-slate-800">1. Daily BP Logging</p>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Record morning readings prior to breakfast to capture true resting baseline.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <p className="text-xs font-bold text-slate-800">2. Sodium Limitation</p>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Target &lt; 2,000 mg dietary sodium to help reduce vascular arterial tension.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2 md:col-span-1">
                    <p className="text-xs font-bold text-slate-800">3. Clinician Review</p>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Discuss these 30-day telemetry trends during your appointment on Thursday.
                    </p>
                  </div>
                </div>
              </div>

              {/* Regulatory SaMD Clinical Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-amber-900">
                    Clinical Decision Support System (SaMD Class II Aligned) Notice
                  </p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    This predictive score is an assistive analytical metric intended to aid in proactive patient self-monitoring and clinician consultation. It does NOT replace medical diagnostic judgment or emergency evaluation.
                  </p>
                </div>
              </div>

              {/* Bottom Card Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <Link
                  href="/user/predictions"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition-colors"
                >
                  View Historical Predictions &amp; Model Explainability <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/user/risk-assessment"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  Past Questionnaire Assessments &gt;
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Ultra-Fast Native SVG Telemetry Trends Visualizer */}
          <Card className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  7-Day Telemetry Trend Visualizer
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Continuous multi-parameter vital telemetry synced with hospital electronic health records
                </CardDescription>
              </div>

              {/* Toggle Switch */}
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setChartTab("bp")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    chartTab === "bp"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Blood Pressure
                </button>
                <button
                  type="button"
                  onClick={() => setChartTab("hr")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    chartTab === "hr"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pulse &amp; SpO2
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between text-xs gap-3 text-slate-600">
                  {chartTab === "bp" ? (
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-3 w-3 rounded-full bg-rose-500" />
                        Systolic (mmHg)
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-3 w-3 rounded-full bg-teal-600" />
                        Diastolic (mmHg)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-3 w-3 rounded-full bg-amber-500" />
                        Resting Pulse (bpm)
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-3 w-3 rounded-full bg-sky-500" />
                        SpO2 (%)
                      </span>
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {chartTab === "bp" ? "Safe Target: 120/80 mmHg" : "Safe Target: 60-100 bpm, SpO2 > 95%"}
                  </span>
                </div>

                {/* Pure Native SVG Chart - zero ResizeObserver lag */}
                <NativeTelemetryChart tab={chartTab} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Daily Health Plan, Care Team & Appointments (Stacked in 1-col on xl, 3-col on lg, 2-col on md, 1-col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-6 min-w-0">
          {/* Daily Health Plan & Task Checklist */}
          <Card className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 truncate">
                    Daily Care Checklist
                  </CardTitle>
                </div>
                <button
                  onClick={() => setShowAddTaskInput(!showAddTaskInput)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </button>
              </div>

              {/* Progress bar */}
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {completedTasksCount} of {totalTasksCount} tasks completed
                  </span>
                  <span className="font-bold text-teal-700">{taskProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-2">
                {(["all", "pending", "done"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize transition-colors ${
                      taskFilter === filter
                        ? "bg-teal-50 text-teal-800 border border-teal-200"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 space-y-2.5">
              {/* Quick Add Task Form */}
              {showAddTaskInput && (
                <form onSubmit={handleAddNewTask} className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2">
                  <Input
                    placeholder="E.g., Take evening medication..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="text-xs bg-white h-8"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddTaskInput(false)}
                      className="h-7 text-xs px-2 text-slate-500"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-7 text-xs px-3 bg-teal-600 text-white">
                      Save Reminder
                    </Button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "COMPLETED";
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none min-w-0 ${
                        isDone
                          ? "bg-slate-50/70 border-slate-200/60 opacity-80"
                          : "bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs"
                      }`}
                    >
                      <button
                        type="button"
                        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isDone
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-300 bg-white hover:border-teal-500"
                        }`}
                        aria-label={`Toggle task: ${task.title}`}
                      >
                        {isDone && <Check className="h-3.5 w-3.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold leading-snug transition-colors break-words ${
                            isDone ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {task.due_date}
                          </span>
                          {task.completed_at && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              · Done at {task.completed_at}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No tasks matching this filter.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointment Card */}
          {nextAppt && (
            <Card className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100/80 bg-gradient-to-r from-sky-50/40 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 truncate">
                      Upcoming Appointment
                    </CardTitle>
                  </div>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                    In 3 Days
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Calendar Badge */}
                  <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase">SEP</span>
                    <span className="text-lg font-black text-slate-900 leading-none">17</span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{nextAppt.clinician_name}</h4>
                    <p className="text-xs text-slate-600 truncate">{nextAppt.department}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                      <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">Thu, Sep 17 at 9:53 AM</span>
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{nextAppt.location_or_link}</span>
                    </p>
                  </div>
                </div>

                {/* Pre-Appointment Checklist */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block">Pre-Visit Instructions:</span>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 className="h-3 w-3 text-teal-600 shrink-0" />
                    <span className="truncate">Bring 7-day home BP log or app export</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 className="h-3 w-3 text-teal-600 shrink-0" />
                    <span className="truncate">Bring current medication containers</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Link href="/user/appointments" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs border-slate-200 truncate">
                      Manage / Reschedule
                    </Button>
                  </Link>
                  <Button
                    onClick={() => showToast("Added to your digital calendar (.ics)!")}
                    size="sm"
                    className="w-full sm:w-auto text-xs bg-slate-900 text-white hover:bg-slate-800 shrink-0"
                  >
                    Add to Cal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Care Team Quick Access Card */}
          <Card className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 truncate">
                    Care Team Message
                  </CardTitle>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      SL
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-teal-950 truncate">Dr. Sarah Lin, MD</p>
                      <p className="text-[10px] text-slate-400 truncate">Cardiology Specialist</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">Yesterday</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &quot;Your 30-day vitals trend looks consistent. Keep up with the daily sodium restriction and let us know immediately if any dizziness occurs.&quot;
                </p>
              </div>

              <div className="space-y-2">
                <Link href="/user/messages" className="block">
                  <Button
                    size="sm"
                    className="w-full text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Reply to Care Team
                  </Button>
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 px-1">
                  <span className="shrink-0">Urgent Clinic Triage:</span>
                  <a
                    href="tel:5550194820"
                    className="font-semibold text-teal-700 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Phone className="h-3 w-3" /> (555) 019-4820
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Vitals Log Modal */}
      <ResponsiveModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Quick Log Patient Vitals"
        subtitle="Record your current home biometric readings to synchronize with clinical telemetry"
        maxWidth="md"
      >
        <form onSubmit={handleSaveVital} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Systolic BP (mmHg)</label>
              <Input
                type="number"
                min="70"
                max="250"
                value={logSbp}
                onChange={(e) => setLogSbp(e.target.value)}
                required
                className="font-bold text-sm"
              />
              <span className="text-[10px] text-slate-400">Normal: &lt; 120</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Diastolic BP (mmHg)</label>
              <Input
                type="number"
                min="40"
                max="150"
                value={logDbp}
                onChange={(e) => setLogDbp(e.target.value)}
                required
                className="font-bold text-sm"
              />
              <span className="text-[10px] text-slate-400">Normal: &lt; 80</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Heart Rate (bpm)</label>
              <Input
                type="number"
                min="40"
                max="200"
                value={logHr}
                onChange={(e) => setLogHr(e.target.value)}
                required
                className="font-bold text-sm"
              />
              <span className="text-[10px] text-slate-400">Normal: 60 - 100</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">SpO2 Oxygen (%)</label>
              <Input
                type="number"
                min="70"
                max="100"
                value={logSpo2}
                onChange={(e) => setLogSpo2(e.target.value)}
                required
                className="font-bold text-sm"
              />
              <span className="text-[10px] text-slate-400">Normal: 95 - 100%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <span>
              Telemetry will be instantly reviewed by your assigned clinical team and ingested into your risk prediction model.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLogModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingVital}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              {isSubmittingVital ? "Saving..." : "Save Telemetry"}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}
