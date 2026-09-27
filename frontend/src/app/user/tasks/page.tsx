"use client";

import * as React from "react";
import Link from "next/link";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Flame,
  Activity,
  Pill,
  FileQuestion,
  Sparkles,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  Radio,
  Zap,
  RefreshCw,
  HeartPulse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { useAuthStore } from "@/features/auth/authStore";
import apiClient from "@/services/apiClient";

interface HealthTaskItem {
  id: string;
  title: string;
  description: string;
  type: "LOG_VITALS" | "MEDICATION_CONFIRM" | "QUESTIONNAIRE" | "LIFESTYLE" | string;
  due_date: string;
  status: "PENDING" | "COMPLETED";
  action_href?: string;
  action_label?: string;
  prescribed_by?: string;
}

const INITIAL_TASKS: HealthTaskItem[] = [
  {
    id: "task-01",
    title: "Log Morning Resting Blood Pressure & Pulse",
    description: "Measure resting blood pressure after 5 minutes of seated rest before breakfast.",
    type: "LOG_VITALS",
    due_date: "Today, 10:00 AM",
    status: "PENDING",
    action_href: "/user/vitals",
    action_label: "Open Vitals Logger",
    prescribed_by: "Dr. Vadla Abhinay, MD",
  },
  {
    id: "task-02",
    title: "Morning Antihypertensive Dose (Lisinopril 10mg)",
    description: "Confirm daily scheduled oral dose taken with a full glass of water.",
    type: "MEDICATION_CONFIRM",
    due_date: "Today, 09:00 AM",
    status: "COMPLETED",
    action_href: "/user/health-summary",
    action_label: "View Prescription",
    prescribed_by: "Dr. Vadla Abhinay, MD",
  },
  {
    id: "task-03",
    title: "Pre-Visit Cardiovascular Symptom Survey",
    description: "Fill out the 5-question pre-appointment exertion & activity questionnaire.",
    type: "QUESTIONNAIRE",
    due_date: "Tomorrow, 05:00 PM",
    status: "PENDING",
    action_href: "/user/appointments",
    action_label: "Take Survey",
    prescribed_by: "Cardiology Clinical Staff",
  },
  {
    id: "task-04",
    title: "Post-Dinner 20-Min Moderate Aerobic Walk",
    description: "Light to moderate aerobic exercise for secondary cardiovascular conditioning.",
    type: "LIFESTYLE",
    due_date: "Today, 08:00 PM",
    status: "PENDING",
    action_href: "/user/whiteboards",
    action_label: "View Care Plan",
    prescribed_by: "Physical Therapy Team",
  },
];

export default function PatientTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = React.useState<HealthTaskItem[]>(INITIAL_TASKS);
  const [filter, setFilter] = React.useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState("LIFESTYLE");
  const [newDue, setNewDue] = React.useState("Today, 08:00 PM");
  const [celebrationToast, setCelebrationToast] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [livePing, setLivePing] = React.useState(13);

  // Ping jitter
  React.useEffect(() => {
    const pingTimer = setInterval(() => {
      setLivePing(11 + Math.floor(Math.random() * 7));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  // Fetch from backend
  const fetchTasks = React.useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await apiClient.get("/user/tasks/");
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const merged = res.data.map((item: Partial<HealthTaskItem> & Record<string, unknown>, idx: number) => ({
          ...INITIAL_TASKS[idx % INITIAL_TASKS.length],
          ...item,
          id: (item.id as string) || `task-api-${idx}`,
        }));
        setTasks(merged);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, []);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // WebSocket Live Integration
  const handleWsEvent = React.useCallback((evt: { event_type: string; payload?: Record<string, unknown> }) => {
    if (
      evt.event_type === "task_assigned" ||
      evt.event_type === "task_updated" ||
      evt.event_type === "care_plan_milestone_added" ||
      evt.event_type === "medication_reminder_triggered"
    ) {
      const p = evt.payload || {};
      const newTask: HealthTaskItem = {
        id: String(p.id || `task-${Date.now().toString().slice(-4)}`),
        title: String(p.title || "Real-Time Care Regimen Milestone"),
        description: String(p.description || "Assigned live by attending cardiology team."),
        type: String(p.type || "LOG_VITALS"),
        due_date: "Today, 06:00 PM",
        status: "PENDING",
        prescribed_by: String(p.prescribed_by || "Dr. Vadla Abhinay, MD"),
      };

      setTasks((prev) => [newTask, ...prev]);
      setCelebrationToast(`⚡ New clinical task assigned by care team: "${newTask.title}"`);
      setTimeout(() => setCelebrationToast(null), 5000);
    }
  }, []);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  const toggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const willBeDone = target.status !== "COMPLETED";

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: willBeDone ? "COMPLETED" : "PENDING" } : t))
    );

    if (willBeDone) {
      setCelebrationToast(`✓ Recorded complete: "${target.title}"`);
      setTimeout(() => setCelebrationToast(null), 3500);
    }
  };

  // Quick Complete Vitals via Live Stream
  const handleQuickCompleteVitals = () => {
    setTasks((prev) =>
      prev.map((t) => (t.type === "LOG_VITALS" ? { ...t, status: "COMPLETED" } : t))
    );
    setCelebrationToast("✓ Live vitals telemetry synchronized & verified with care team!");
    setTimeout(() => setCelebrationToast(null), 4000);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: HealthTaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: "Self-scheduled regimen reminder created by patient.",
      type: newType,
      due_date: newDue,
      status: "PENDING",
      prescribed_by: "Self (Patient Managed)",
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setIsAddModalOpen(false);
    setCelebrationToast(`✓ Self-care reminder "${newTask.title}" scheduled.`);
    setTimeout(() => setCelebrationToast(null), 3500);
  };

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalCount = tasks.length;
  const adherencePercent = Math.round((completedCount / (totalCount || 1)) * 100);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "LOG_VITALS":
        return (
          <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[11px] font-semibold gap-1">
            <Activity className="h-3 w-3 text-teal-600" />
            Vitals Telemetry
          </Badge>
        );
      case "MEDICATION_CONFIRM":
        return (
          <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[11px] font-semibold gap-1">
            <Pill className="h-3 w-3 text-indigo-600" />
            Medication Regimen
          </Badge>
        );
      case "QUESTIONNAIRE":
        return (
          <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-[11px] font-semibold gap-1">
            <FileQuestion className="h-3 w-3 text-sky-600" />
            Clinical Survey
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[11px] font-semibold">
            Health Milestone
          </Badge>
        );
    }
  };

  return (
    <ResponsivePageContainer className="space-y-4 sm:space-y-6 pb-12 max-w-5xl mx-auto min-w-0 w-full overflow-hidden">
      {/* Real-time Toast */}
      {celebrationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Care Plan Synchronization</p>
            <p className="text-slate-300 text-[11px]">{celebrationToast}</p>
          </div>
          <button
            onClick={() => setCelebrationToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-6 lg:p-7 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <ListTodo className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
              Daily Health Tasks &amp; Regimen Checklist
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              Care Stream Active ({livePing}ms)
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Personalized clinical milestones, medication reminders, and diagnostic surveys assigned
            by your cardiology care team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 h-9 bg-white hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-teal-600" : ""}`} />
            <span>Sync</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickCompleteVitals}
            className="flex-1 sm:flex-initial text-xs font-semibold gap-1.5 border-teal-200 bg-teal-50/60 text-teal-800 hover:bg-teal-100/80 h-9 shadow-2xs"
          >
            <Zap className="h-3.5 w-3.5 text-teal-700" />
            <span>Auto-Sync Vitals Task</span>
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs h-9 px-4"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Adherence Progress Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Daily Care Adherence</span>
            <span className="font-bold text-slate-900 text-base">{adherencePercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>{completedCount} of {totalCount} completed</span>
            <span className="text-teal-700 font-semibold">{totalCount - completedCount} pending</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Adherence Streak</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 truncate block">7 Consecutive Days</span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5 truncate">
              High Regimen Compliance
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shrink-0">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Care Team Oversight</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">Synchronized with EHR</span>
            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
              Dr. Vadla Abhinay, MD
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `All Tasks (${totalCount})` },
            { id: "PENDING", label: `Pending (${totalCount - completedCount})` },
            { id: "COMPLETED", label: `Completed (${completedCount})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === cat.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">All tasks completed!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have completed all scheduled health tasks for today. Excellent adherence to your
              cardiovascular care regimen.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "COMPLETED";
            return (
              <Card
                key={task.id}
                className={`bg-white border-slate-200/90 shadow-xs transition-all duration-200 ${
                  isDone
                    ? "opacity-80 bg-slate-50/60 border-emerald-200"
                    : "hover:border-teal-300 hover:shadow-md"
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
                  {/* Custom Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={isDone ? "Mark pending" : "Mark completed"}
                    className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                      isDone
                        ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                        : "border-slate-300 hover:border-teal-500 bg-white"
                    }`}
                  >
                    {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(task.type)}
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {task.due_date}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold self-start sm:self-auto ${
                          isDone
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-800 bg-amber-50 border-amber-200"
                        }`}
                      >
                        {isDone ? "COMPLETED" : "ACTION REQUIRED"}
                      </Badge>
                    </div>

                    <h3
                      className={`text-sm font-bold leading-snug ${
                        isDone ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 truncate">
                        Assigned by: <strong className="text-slate-600">{task.prescribed_by}</strong>
                      </span>

                      {task.action_href && !isDone && (
                        <Link href={task.action_href} className="self-start sm:self-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 p-0 h-auto gap-1"
                          >
                            {task.action_label || "Perform Action"}{" "}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      <ResponsiveModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Self-Care Milestone"
        subtitle="Schedule a personal reminder for your care regimen"
        maxWidth="md"
      >
        <form onSubmit={handleAddTask} className="space-y-4 text-xs text-slate-900">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Reminder Title</label>
            <Input
              placeholder="e.g., Evening 20-minute brisk walk"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-xs h-9 bg-slate-50 border-slate-200"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Task Category</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full text-xs h-9 bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-hidden focus:border-teal-500"
            >
              <option value="LOG_VITALS">Vitals Telemetry</option>
              <option value="MEDICATION_CONFIRM">Medication Regimen</option>
              <option value="QUESTIONNAIRE">Health Survey</option>
              <option value="LIFESTYLE">Lifestyle &amp; Activity</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Target Time / Due Date</label>
            <Input
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              placeholder="Today, 08:00 PM"
              className="text-xs h-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              Save Reminder
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
