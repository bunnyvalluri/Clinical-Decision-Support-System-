"use client";

import * as React from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/authStore";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import apiClient from "@/services/apiClient";

interface TriagePatient {
  id: string;
  mrn: string;
  name: string;
  age?: number;
  gender?: string;
  acuity: "IMMEDIATE" | "EMERGENCY" | "URGENT" | "SEMI_URGENT" | "NON_URGENT";
  acuity_level?: number;
  state: "INTAKE" | "VITALS_TAKEN" | "TRIAGED" | "UNDER_REVIEW" | "DISCHARGED" | "WAITING" | "TRIAGE_IN_PROGRESS" | "ESCALATED" | "COMPLETED";
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
  };
}

interface BedsideTask {
  id: string;
  patientName: string;
  mrn: string;
  task: string;
  dueTime: string;
  priority: "STAT" | "HIGH" | "ROUTINE";
  completed: boolean;
}
// ─── Helper: map ESI numeric level to acuity label ───────────────────────────
function esiToAcuity(level: number): TriagePatient["acuity"] {
  if (level === 1) return "IMMEDIATE";
  if (level === 2) return "EMERGENCY";
  if (level === 3) return "URGENT";
  if (level === 4) return "SEMI_URGENT";
  return "NON_URGENT";
}

// ─── Helper: map backend state strings to local state type ───────────────────
function normaliseState(s: string): TriagePatient["state"] {
  const map: Record<string, TriagePatient["state"]> = {
    WAITING: "INTAKE",
    TRIAGE_IN_PROGRESS: "VITALS_TAKEN",
    TRIAGED: "TRIAGED",
    ESCALATED: "UNDER_REVIEW",
    COMPLETED: "DISCHARGED",
  };
  return (map[s] as TriagePatient["state"]) ?? (s as TriagePatient["state"]);
}

// ─── Helper: map backend task priority to local priority ─────────────────────
function normaliseTaskPriority(p: string): BedsideTask["priority"] {
  if (p === "STAT" || p === "CRITICAL") return "STAT";
  if (p === "HIGH" || p === "URGENT") return "HIGH";
  return "ROUTINE";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NurseWorkspace() {
  const { user } = useAuthStore();
  const { notifications } = useClinicalStore();

  const [queue, setQueue] = React.useState<TriagePatient[]>([]);
  const [tasks, setTasks] = React.useState<BedsideTask[]>([]);
  const [loadingQueue, setLoadingQueue] = React.useState(true);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [queueError, setQueueError] = React.useState<string | null>(null);
  const [tasksError, setTasksError] = React.useState<string | null>(null);

  // Vitals Modal State
  const [vitalsModalOpen, setVitalsModalOpen] = React.useState(false);
  const [selectedPatientForVitals, setSelectedPatientForVitals] = React.useState<TriagePatient | null>(null);
  const [sbp, setSbp] = React.useState("135");
  const [dbp, setDbp] = React.useState("85");
  const [hr, setHr] = React.useState("84");
  const [rr, setRr] = React.useState("16");
  const [spo2, setSpo2] = React.useState("98.5");
  const [temp, setTemp] = React.useState("37.0");
  const [vitalsError, setVitalsError] = React.useState<string | null>(null);
  const [vitalsSuccess, setVitalsSuccess] = React.useState(false);
  const [isSubmittingVitals, setIsSubmittingVitals] = React.useState(false);

  // Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = React.useState(false);
  const [selectedPatientForEscalate, setSelectedPatientForEscalate] = React.useState<TriagePatient | null>(null);
  const [escalateReason, setEscalateReason] = React.useState("");
  const [escalatePriority, setEscalatePriority] = React.useState<"HIGH" | "CRITICAL">("HIGH");
  const [escalateSubmitting, setEscalateSubmitting] = React.useState(false);
  const [escalateSuccess, setEscalateSuccess] = React.useState(false);

  // ── Fetch triage queue from backend ─────────────────────────────────────────
  const fetchQueue = React.useCallback(async () => {
    setLoadingQueue(true);
    setQueueError(null);
    try {
      const res = await apiClient.get("/clinical/triage/queue/");
      const raw: Array<Record<string, unknown>> = res.data?.data ?? [];
      setQueue(
        raw.map((item) => ({
          id: String(item.id),
          mrn: String(item.mrn ?? ""),
          name: String(item.patient_name ?? ""),
          acuity: esiToAcuity(Number(item.acuity_level ?? 3)),
          acuity_level: Number(item.acuity_level ?? 3),
          state: normaliseState(String(item.state ?? "WAITING")),
          arrivalTime: item.arrival_time
            ? new Date(String(item.arrival_time)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "—",
          chiefComplaint: String(item.chief_complaint ?? ""),
          assignedBed: String(item.bed_assignment ?? "Unassigned"),
        }))
      );
    } catch {
      setQueueError("Unable to load triage queue. Ensure the backend is running and you have the Nurse role.");
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // ── Fetch bedside tasks from backend ─────────────────────────────────────────
  const fetchTasks = React.useCallback(async () => {
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const res = await apiClient.get("/clinical/triage/tasks/");
      const raw: Array<Record<string, unknown>> = res.data?.data ?? [];
      setTasks(
        raw.map((item) => ({
          id: String(item.id),
          patientName: String(item.patient_name ?? ""),
          mrn: String(item.patient_mrn ?? ""),
          task: String(item.title ?? ""),
          dueTime: item.due_at
            ? new Date(String(item.due_at)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "—",
          priority: normaliseTaskPriority(String(item.priority ?? "ROUTINE")),
          completed: String(item.status) === "COMPLETED",
        }))
      );
    } catch {
      setTasksError("Unable to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const res = await apiClient.get("/clinical/triage/queue/");
        if (!isMounted) return;
        const raw: Array<Record<string, unknown>> = res.data?.data ?? [];
        setQueue(
          raw.map((item) => ({
            id: String(item.id),
            mrn: String(item.mrn ?? ""),
            name: String(item.patient_name ?? ""),
            acuity: esiToAcuity(Number(item.acuity_level ?? 3)),
            acuity_level: Number(item.acuity_level ?? 3),
            state: normaliseState(String(item.state ?? "WAITING")),
            arrivalTime: item.arrival_time
              ? new Date(String(item.arrival_time)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : "—",
            chiefComplaint: String(item.chief_complaint ?? ""),
            assignedBed: String(item.bed_assignment ?? "Unassigned"),
          }))
        );
      } catch {
        if (isMounted) setQueueError("Unable to load triage queue. Ensure the backend is running and you have the Nurse role.");
      } finally {
        if (isMounted) setLoadingQueue(false);
      }

      try {
        const res = await apiClient.get("/clinical/triage/tasks/");
        if (!isMounted) return;
        const raw: Array<Record<string, unknown>> = res.data?.data ?? [];
        setTasks(
          raw.map((item) => ({
            id: String(item.id),
            patientName: String(item.patient_name ?? ""),
            mrn: String(item.patient_mrn ?? ""),
            task: String(item.title ?? ""),
            dueTime: item.due_at
              ? new Date(String(item.due_at)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : "—",
            priority: normaliseTaskPriority(String(item.priority ?? "ROUTINE")),
            completed: String(item.status) === "COMPLETED",
          }))
        );
      } catch {
        if (isMounted) setTasksError("Unable to load tasks.");
      } finally {
        if (isMounted) setLoadingTasks(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Toggle Task Completion (optimistic + backend PATCH) ──────────────────────
  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.completed;
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t)));
    try {
      await apiClient.patch("/clinical/triage/tasks/", {
        task_id: taskId,
        status: newCompleted ? "COMPLETED" : "PENDING",
      });
    } catch {
      // Roll back on failure
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !newCompleted } : t)));
    }
  };

  // ── Biological range validation ──────────────────────────────────────────────
  const sbpNum = Number(sbp);
  const dbpNum = Number(dbp);
  const hrNum = Number(hr);
  const spo2Num = Number(spo2);
  const tempNum = Number(temp);

  const isPhysiologicalContradiction = sbpNum > 0 && dbpNum > 0 && sbpNum <= dbpNum;
  const isHrOutOfRange = hrNum > 0 && (hrNum < 30 || hrNum > 240);
  const isSpo2OutOfRange = spo2Num > 0 && (spo2Num < 50 || spo2Num > 100);

  const handleOpenVitalsModal = (p: TriagePatient) => {
    setSelectedPatientForVitals(p);
    if (p.vitals) {
      setSbp(p.vitals.sbp.toString());
      setDbp(p.vitals.dbp.toString());
      setHr(p.vitals.hr.toString());
      setRr(p.vitals.rr.toString());
      setSpo2(p.vitals.spo2.toString());
      setTemp(p.vitals.temp.toString());
    } else {
      setSbp("125"); setDbp("80"); setHr("76"); setRr("16"); setSpo2("98.0"); setTemp("36.8");
    }
    setVitalsError(null);
    setVitalsSuccess(false);
    setVitalsModalOpen(true);
  };

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingVitals) return;
    setVitalsError(null);

    if (isPhysiologicalContradiction) {
      setVitalsError("Biological contradiction: Systolic BP must strictly exceed Diastolic BP.");
      return;
    }
    if (isHrOutOfRange) {
      setVitalsError("Heart rate out of physiological range (30 - 240 bpm).");
      return;
    }
    if (isSpo2OutOfRange) {
      setVitalsError("Oxygen saturation must be between 50% and 100%.");
      return;
    }

    setIsSubmittingVitals(true);
    try {
      if (selectedPatientForVitals) {
        const vitalsRes = await apiClient.post("/clinical/vitals/", {
          patient_id: selectedPatientForVitals.id,
          systolic_bp: sbpNum,
          diastolic_bp: dbpNum,
          heart_rate: hrNum,
          respiratory_rate: Number(rr),
          oxygen_saturation: spo2Num,
          body_temperature: tempNum,
        });

        if (vitalsRes.data?.success === false) {
          setVitalsError(vitalsRes.data.error ?? "Failed to record vital signs.");
          return;
        }

        // Update local queue state with new vitals
        setQueue((prev) =>
          prev.map((p) =>
            p.id === selectedPatientForVitals.id
              ? {
                  ...p,
                  state: p.state === "INTAKE" || p.state === "WAITING" ? "VITALS_TAKEN" : p.state,
                  vitals: { sbp: sbpNum, dbp: dbpNum, hr: hrNum, rr: Number(rr), spo2: spo2Num, temp: tempNum },
                }
              : p
          )
        );
      }

      setVitalsSuccess(true);
      setTimeout(() => setVitalsModalOpen(false), 700);
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setVitalsError(apiErr ?? "Failed to record vital signs.");
    } finally {
      setIsSubmittingVitals(false);
    }
  };

  const handleOpenEscalateModal = (p: TriagePatient) => {
    setSelectedPatientForEscalate(p);
    setEscalateReason(`Patient ${p.name} displaying acute deterioration.`);
    setEscalatePriority(p.acuity === "IMMEDIATE" ? "CRITICAL" : "HIGH");
    setEscalateSuccess(false);
    setEscalateModalOpen(true);
  };

  const handleSubmitEscalation = async () => {
    if (!escalateReason.trim()) return;
    setEscalateSubmitting(true);

    try {
      if (selectedPatientForEscalate) {
        const res = await apiClient.post("/clinical/triage/escalate/", {
          patient_id: selectedPatientForEscalate.id,
          reason: escalateReason.trim(),
          priority: escalatePriority,
        });

        if (res.data?.success === false) {
          return;
        }

        setQueue((prev) =>
          prev.map((p) =>
            p.id === selectedPatientForEscalate.id ? { ...p, state: "UNDER_REVIEW" } : p
          )
        );
      }

      setEscalateSuccess(true);
      setTimeout(() => setEscalateModalOpen(false), 700);
    } finally {
      setEscalateSubmitting(false);
    }
  };

  // ── Derive ESI counts from live queue ────────────────────────────────────────
  const esiCounts = React.useMemo(() => ({
    1: queue.filter((p) => p.acuity_level === 1 || p.acuity === "IMMEDIATE").length,
    2: queue.filter((p) => p.acuity_level === 2 || p.acuity === "EMERGENCY").length,
    3: queue.filter((p) => p.acuity_level === 3 || p.acuity === "URGENT").length,
    4: queue.filter((p) => p.acuity_level === 4 || p.acuity === "SEMI_URGENT").length,
    5: queue.filter((p) => p.acuity_level === 5 || p.acuity === "NON_URGENT").length,
  }), [queue]);

  return (
    <div className="space-y-6">
      {/* Triage Nurse Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 border border-sky-200 text-sky-700">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Triage &amp; Bedside Nursing Center
            </h1>
            <p className="text-xs text-slate-500">
              Active Nurse: <span className="font-semibold text-slate-800">{user?.full_name || "—"}</span> •{" "}
              Unit: <span className="font-semibold text-slate-800">{user?.department || "Emergency Triage &amp; Bedside"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-xs px-2.5 py-1">
            Emergency Severity Index (ESI) Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchQueue(); fetchTasks(); }}
            className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Nursing Triage Acuity Metrics — live counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-rose-50/70 border-rose-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-rose-900">ESI 1 • Immediate (Red)</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-700">{loadingQueue ? "…" : esiCounts[1]}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-[11px] text-rose-800 font-medium">Life-threatening / STAT review</p></CardContent>
        </Card>

        <Card className="bg-orange-50/70 border-orange-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-orange-900">ESI 2 • Emergency (Orange)</CardDescription>
            <CardTitle className="text-2xl font-bold text-orange-700">{loadingQueue ? "…" : esiCounts[2]}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-[11px] text-orange-800 font-medium">High risk / Severe pain or distress</p></CardContent>
        </Card>

        <Card className="bg-amber-50/70 border-amber-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-amber-900">ESI 3 • Urgent (Yellow)</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700">{loadingQueue ? "…" : esiCounts[3]}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-[11px] text-amber-800 font-medium">Multiple diagnostic resources</p></CardContent>
        </Card>

        <Card className="bg-blue-50/70 border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-blue-900">ESI 4 • Semi-Urgent (Blue)</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-700">{loadingQueue ? "…" : esiCounts[4]}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-[11px] text-blue-800 font-medium">Single diagnostic resource</p></CardContent>
        </Card>

        <Card className="bg-emerald-50/70 border-emerald-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-emerald-900">ESI 5 • Non-Urgent (Green)</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700">{loadingQueue ? "…" : esiCounts[5]}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-[11px] text-emerald-800 font-medium">Routine outpatient care</p></CardContent>
        </Card>
      </div>

      {/* Main Grid: Triage Queue & Bedside Actionable Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Triage Intake Queue (2 Columns) */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-600" />
                Live Triage Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Patients awaiting or undergoing bedside nursing triage assessments.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
              {loadingQueue ? "…" : `${queue.length} Total`}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loadingQueue ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
                <Activity className="h-4 w-4 animate-spin" />
                Loading triage queue…
              </div>
            ) : queueError ? (
              <div className="flex items-center gap-2 m-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {queueError}
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-slate-500">No active patients in triage queue</p>
                <p className="text-xs text-slate-400">New admissions will appear here automatically.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acuity / Time</TableHead>
                    <TableHead>Patient / MRN</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Latest Vitals</TableHead>
                    <TableHead>Triage State</TableHead>
                    <TableHead className="text-right">Nursing Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell>
                        <Badge
                          variant={
                            p.acuity === "IMMEDIATE"
                              ? "critical"
                              : p.acuity === "EMERGENCY"
                              ? "high"
                              : p.acuity === "URGENT"
                              ? "medium"
                              : "low"
                          }
                          className="text-[10px]"
                        >
                          {p.acuity}
                        </Badge>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {p.arrivalTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.mrn}</div>
                        <p className="text-[10px] text-slate-600 line-clamp-1 mt-0.5">{p.chiefComplaint}</p>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">
                        {p.assignedBed}
                      </TableCell>
                      <TableCell>
                        {p.vitals ? (
                          <div className="text-[11px] font-mono space-y-0.5">
                            <div className="text-slate-900 font-semibold">
                              BP: {p.vitals.sbp}/{p.vitals.dbp}
                            </div>
                            <div className="text-slate-500 text-[10px]">
                              HR: {p.vitals.hr} | SpO2: {p.vitals.spo2}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No vitals yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">
                          {p.state.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenVitalsModal(p)}
                            className="h-7 text-xs border-sky-200 text-sky-700 bg-white hover:bg-sky-50 font-medium"
                          >
                            <HeartPulse className="h-3 w-3 mr-1" />
                            Vitals
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEscalateModal(p)}
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold"
                          >
                            <PhoneCall className="h-3 w-3 mr-1" />
                            Escalate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Actionable Bedside Checklist (1 Column) */}
        <Card className="bg-white border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-emerald-600" />
                Bedside Task Checklist
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                {loadingTasks ? "…" : `${tasks.filter((t) => t.completed).length}/${tasks.length} Done`}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Protocol orders &amp; monitoring milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 flex-1">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                <Activity className="h-4 w-4 animate-spin" />
                Loading tasks…
              </div>
            ) : tasksError ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {tasksError}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                <p className="text-xs font-medium text-slate-500">No pending tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    task.completed
                      ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                      : task.priority === "STAT"
                      ? "bg-rose-50/50 border-rose-200 text-slate-900"
                      : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button className="mt-0.5 shrink-0 text-slate-500">
                      {task.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold flex items-center justify-between">
                        <span>{task.patientName}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            task.priority === "STAT"
                              ? "bg-rose-100 text-rose-700 font-bold"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {task.dueTime}
                        </span>
                      </div>
                      <p className={`mt-0.5 text-[11px] ${task.completed ? "text-slate-400" : "text-slate-600"}`}>
                        {task.task}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Vitals Entry Modal with Biological Guardrails */}
      {vitalsModalOpen && selectedPatientForVitals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-sky-50 p-2 text-sky-700 border border-sky-200">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Bedside Vital Signs Entry</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <span className="font-semibold text-slate-800">{selectedPatientForVitals.name}</span> ({selectedPatientForVitals.mrn})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVitalsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                  <input type="number" value={sbp} onChange={(e) => setSbp(e.target.value)} required min={50} max={260}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none ${isPhysiologicalContradiction ? "border-rose-400 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-sky-500 focus:bg-white"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                  <input type="number" value={dbp} onChange={(e) => setDbp(e.target.value)} required min={30} max={160}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none ${isPhysiologicalContradiction ? "border-rose-400 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-sky-500 focus:bg-white"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                  <input type="number" value={hr} onChange={(e) => setHr(e.target.value)} required min={30} max={240}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none ${isHrOutOfRange ? "border-rose-400 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-sky-500 focus:bg-white"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Respiratory Rate (bpm)</label>
                  <input type="number" value={rr} onChange={(e) => setRr(e.target.value)} required min={6} max={60}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
                  <input type="number" step="0.1" value={spo2} onChange={(e) => setSpo2(e.target.value)} required min={50} max={100}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none ${isSpo2OutOfRange ? "border-rose-400 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-sky-500 focus:bg-white"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature (°C)</label>
                  <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required min={30} max={45}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {isPhysiologicalContradiction && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>Biological contradiction: Systolic BP ({sbpNum}) must exceed Diastolic BP ({dbpNum}).</span>
                </div>
              )}
              {vitalsError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">{vitalsError}</div>
              )}
              {vitalsSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Vital signs verified and committed to patient record!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setVitalsModalOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" variant="default" size="sm"
                  disabled={isPhysiologicalContradiction || isHrOutOfRange || isSpo2OutOfRange}
                  className="text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-sm font-semibold"
                >
                  Save &amp; Validate Vitals
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Click Escalation Modal */}
      {escalateModalOpen && selectedPatientForEscalate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-100 p-2 text-rose-700 border border-rose-200">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Escalate to Attending Physician</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <span className="font-semibold text-slate-800">{selectedPatientForEscalate.name}</span> ({selectedPatientForEscalate.mrn})
                  </p>
                </div>
              </div>
              <button onClick={() => setEscalateModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Escalation Urgency Tier:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setEscalatePriority("HIGH")}
                    className={`rounded-lg border p-2 text-center font-semibold transition-colors ${escalatePriority === "HIGH" ? "border-orange-600 bg-orange-50 text-orange-800" : "border-slate-200 bg-white text-slate-600"}`}
                  >
                    High (Urgent)
                  </button>
                  <button type="button" onClick={() => setEscalatePriority("CRITICAL")}
                    className={`rounded-lg border p-2 text-center font-semibold transition-colors ${escalatePriority === "CRITICAL" ? "border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-600" : "border-slate-200 bg-white text-slate-600"}`}
                  >
                    STAT (Immediate Bedside)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Escalation Rationale:</label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. SBP refractory at 178 mmHg, ST depression noted on monitor, patient diaphoretic."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              {escalateSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Escalation dispatched and recorded in audit log.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setEscalateModalOpen(false)} className="text-xs">Cancel</Button>
              <Button variant="default" size="sm" onClick={handleSubmitEscalation}
                disabled={escalateSubmitting || !escalateReason.trim()}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold"
              >
                {escalateSubmitting ? "Dispatching Alert…" : "Dispatch Escalation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
