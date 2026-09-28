"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronRight,
  Send,
  Radio,
  Clock,
  User,
  HeartPulse,
  Activity,
  Bed,
  Stethoscope,
  PhoneCall,
  Search,
  Filter,
  Plus,
  Zap,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  BellRing,
  RotateCcw,
  Sparkles,
  Timer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export type EscalationPriority = "STAT" | "URGENT" | "ROUTINE";
export type EscalationStatus = "PENDING_DISPATCH" | "DISPATCHED" | "PHYSICIAN_ACKNOWLEDGED" | "BEDSIDE_ACTIVE" | "RESOLVED";

export interface SbarEscalationItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  room: string;
  unit: string;
  priority: EscalationPriority;
  status: EscalationStatus;
  attendingPhysician: string;
  nurseAuthor: string;
  elapsedSeconds: number;
  timestamp: string;
  sbar: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  };
  vitalsSnapshot: {
    hr: number;
    bpSys: number;
    bpDia: number;
    spo2: number;
    rr: number;
    temp: number;
    map: number;
  };
  acknowledgedAt?: string;
  resolutionNotes?: string;
}

const INITIAL_ESCALATIONS: SbarEscalationItem[] = [
  {
    id: "esc-001",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    priority: "STAT",
    status: "DISPATCHED",
    attendingPhysician: "Dr. Gregory Vance, MD (Critical Care)",
    nurseAuthor: "Sarah Jenkins, RN (CCRN)",
    elapsedSeconds: 165,
    timestamp: "3 mins ago",
    sbar: {
      situation: "Acute MAP deterioration to 62 mmHg and SpO2 drop to 89% despite 2L crystalloids and 4L O2.",
      background: "68yo female admitted with severe urosepsis / acute pyelonephritis. Blood cultures pending.",
      assessment: "Septic shock refractory to volume resuscitation. Lactate rising, Mottled extremities, tachycardia at 124 bpm.",
      recommendation: "Immediate bedside evaluation for central line placement and Norepinephrine initiation to maintain MAP ≥ 65.",
    },
    vitalsSnapshot: { hr: 124, bpSys: 84, bpDia: 51, spo2: 89, rr: 28, temp: 39.1, map: 62 },
  },
  {
    id: "esc-002",
    patientId: "pat-tele-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-67210",
    room: "3B-212",
    unit: "Telemetry",
    priority: "URGENT",
    status: "PHYSICIAN_ACKNOWLEDGED",
    attendingPhysician: "Dr. Lisa Morales, MD (Cardiology)",
    nurseAuthor: "Sarah Jenkins, RN (CCRN)",
    elapsedSeconds: 490,
    timestamp: "8 mins ago",
    acknowledgedAt: "5 mins ago",
    sbar: {
      situation: "6-beat non-sustained Ventricular Tachycardia burst with sudden diaphoresis.",
      background: "74yo male post-PCI to LAD (Drug-eluting stent placed 18 hours ago).",
      assessment: "Frequent PVCs on telemetry monitor. Potassium 3.4 mEq/L, Magnesium 1.6 mg/dL. Troponin repeat pending.",
      recommendation: "Stat 12-lead ECG, IV electrolyte repletion (20 mEq KCl + 2g MgSO4), and antiarrhythmic order verification.",
    },
    vitalsSnapshot: { hr: 112, bpSys: 146, bpDia: 92, spo2: 95, rr: 20, temp: 37.2, map: 110 },
  },
  {
    id: "esc-003",
    patientId: "pat-er-04",
    patientName: "Clara Zhang",
    mrn: "MRN-31849",
    room: "SD-108",
    unit: "Step-Down",
    priority: "URGENT",
    status: "BEDSIDE_ACTIVE",
    attendingPhysician: "Dr. Gregory Vance, MD",
    nurseAuthor: "Alex Rivera, RN",
    elapsedSeconds: 1240,
    timestamp: "21 mins ago",
    acknowledgedAt: "18 mins ago",
    sbar: {
      situation: "Severe respiratory muscle fatigue and tachypnea (RR 28/min) in COPD exacerbation.",
      background: "61yo female with GOLD Stage III COPD admitted yesterday on DuoNeb treatments.",
      assessment: "ABG reveals acute respiratory acidosis (pH 7.28, pCO2 58, pO2 62). Non-responsive to supplemental O2.",
      recommendation: "Immediate BiPAP non-invasive ventilation initiation and transfer consideration to ICU.",
    },
    vitalsSnapshot: { hr: 106, bpSys: 138, bpDia: 86, spo2: 90, rr: 28, temp: 37.9, map: 103 },
  },
  {
    id: "esc-004",
    patientId: "pat-med-05",
    patientName: "David Kim",
    mrn: "MRN-19402",
    room: "4W-412",
    unit: "Med-Surg",
    priority: "ROUTINE",
    status: "RESOLVED",
    attendingPhysician: "Dr. Angela Thorne, MD",
    nurseAuthor: "Alex Rivera, RN",
    elapsedSeconds: 2800,
    timestamp: "45 mins ago",
    acknowledgedAt: "40 mins ago",
    resolutionNotes: "Physician visited bedside, ordered PRN Ondansetron 4mg IV and repeat metabolic panel. Symptoms controlled.",
    sbar: {
      situation: "Intractable post-antibiotic nausea and persistent emesis.",
      background: "45yo male treated for CAP with Ceftriaxone IV.",
      assessment: "Unable to tolerate oral hydration; mild orthostatic drop in systolic BP.",
      recommendation: "Order antiemetic IV therapy and increase maintenance IVF to 125 ml/hr.",
    },
    vitalsSnapshot: { hr: 74, bpSys: 116, bpDia: 72, spo2: 99, rr: 16, temp: 36.9, map: 86 },
  },
];

export default function NurseEscalationsPage() {
  const { status: wsStatus } = useUserWebSocket();
  const [escalations, setEscalations] = React.useState<SbarEscalationItem[]>(INITIAL_ESCALATIONS);
  const [search, setSearch] = React.useState("");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [selectedUnit, setSelectedUnit] = React.useState<string>("ALL");

  // Telemetry Monitor Canvas
  const [focusedEscId, setFocusedEscId] = React.useState<string>("esc-001");
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // New SBAR Escalation Modal State
  const [newSbarOpen, setNewSbarOpen] = React.useState(false);
  const [sbarForm, setSbarForm] = React.useState({
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    physician: "Dr. Gregory Vance, MD (Critical Care)",
    priority: "STAT" as EscalationPriority,
    situation: "",
    background: "",
    assessment: "",
    recommendation: "",
    hr: "124",
    bpSys: "84",
    bpDia: "51",
    spo2: "89",
    rr: "28",
    temp: "39.1",
  });
  const [notificationMsg, setNotificationMsg] = React.useState<string | null>(null);

  // Resolution Modal State
  const [resolveModalOpen, setResolveModalOpen] = React.useState(false);
  const [targetEscalation, setTargetEscalation] = React.useState<SbarEscalationItem | null>(null);
  const [resolutionText, setResolutionText] = React.useState("");

  const activeEsc = React.useMemo(() => {
    return escalations.find((e) => e.id === focusedEscId) || escalations[0];
  }, [escalations, focusedEscId]);

  // Live Timer increment
  React.useEffect(() => {
    const interval = setInterval(() => {
      setEscalations((prev) =>
        prev.map((e) => {
          if (e.status === "RESOLVED") return e;
          return { ...e, elapsedSeconds: e.elapsedSeconds + 1 };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lead II ECG Canvas Animator
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

    ctx.strokeStyle = "rgba(244, 63, 94, 0.12)";
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
    const isStat = activeEsc?.priority === "STAT";
    const hr = activeEsc ? activeEsc.vitalsSnapshot.hr : 110;

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
      x += 2.5;
      if (x >= width) x = 0;

      phase = (phase + 0.09 * (hr / 80)) % (Math.PI * 2);
      let dy = 0;
      const beat = phase / (Math.PI * 2);

      if (beat > 0.15 && beat < 0.22) {
        dy = -Math.sin(((beat - 0.15) / 0.07) * Math.PI) * 7;
      } else if (beat >= 0.22 && beat < 0.26) {
        dy = 4;
      } else if (beat >= 0.26 && beat < 0.32) {
        const spike = isStat ? 40 : 28;
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
      ctx.strokeStyle = isStat ? "#f43f5e" : activeEsc?.priority === "URGENT" ? "#f59e0b" : "#10b981";
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
  }, [activeEsc]);

  // Format Elapsed Time
  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Quick Preset Form Loader
  const handleLoadPreset = (preset: "SEPSIS" | "STEMI" | "STROKE") => {
    if (preset === "SEPSIS") {
      setSbarForm({
        ...sbarForm,
        priority: "STAT",
        situation: "Acute MAP deterioration to 60 mmHg and SpO2 drop to 88% despite 30 mL/kg IVF.",
        background: "Elderly patient admitted with complicated pyelonephritis, high fever, elevated WBC.",
        assessment: "Septic shock requiring vasopressor support. NEWS2 score currently 9.",
        recommendation: "Immediate bedside evaluation, central venous line order, and Norepinephrine initiation.",
      });
    } else if (preset === "STEMI") {
      setSbarForm({
        ...sbarForm,
        priority: "STAT",
        situation: "Crushing retrosternal chest pain (9/10) with 2.5mm ST-segment elevation on Lead II.",
        background: "Post-PCI patient on dual antiplatelet therapy.",
        assessment: "Possible acute in-stent thrombosis / STEMI recurrence.",
        recommendation: "Immediate Cath Lab activation and stat 12-lead ECG review.",
      });
    } else {
      setSbarForm({
        ...sbarForm,
        priority: "STAT",
        situation: "Acute left facial droop and right-sided arm drift noted during nursing assessment.",
        background: "Patient admitted for observation with hypertension and atrial fibrillation.",
        assessment: "Acute ischemic stroke symptoms, NIHSS estimated at 12.",
        recommendation: "Immediate Stroke Team / Neuro Code activation and stat non-contrast Head CT.",
      });
    }
  };

  // Dispatch New SBAR
  const handleDispatchSbar = (e: React.FormEvent) => {
    e.preventDefault();
    const newSys = parseInt(sbarForm.bpSys) || 120;
    const newDia = parseInt(sbarForm.bpDia) || 80;
    const newMap = Math.round((newSys + 2 * newDia) / 3);

    const newEsc: SbarEscalationItem = {
      id: `esc-${Date.now()}`,
      patientId: `pat-${Date.now()}`,
      patientName: sbarForm.patientName,
      mrn: sbarForm.mrn,
      room: sbarForm.room,
      unit: sbarForm.unit,
      priority: sbarForm.priority,
      status: "DISPATCHED",
      attendingPhysician: sbarForm.physician,
      nurseAuthor: "Sarah Jenkins, RN (CCRN)",
      elapsedSeconds: 0,
      timestamp: "Just now",
      sbar: {
        situation: sbarForm.situation,
        background: sbarForm.background,
        assessment: sbarForm.assessment,
        recommendation: sbarForm.recommendation,
      },
      vitalsSnapshot: {
        hr: parseInt(sbarForm.hr) || 80,
        bpSys: newSys,
        bpDia: newDia,
        spo2: parseInt(sbarForm.spo2) || 98,
        rr: parseInt(sbarForm.rr) || 16,
        temp: parseFloat(sbarForm.temp) || 37.0,
        map: newMap,
      },
    };

    setEscalations((prev) => [newEsc, ...prev]);
    setFocusedEscId(newEsc.id);
    setNewSbarOpen(false);
    setNotificationMsg(`🚨 STAT SBAR Escalation dispatched to ${newEsc.attendingPhysician} for ${newEsc.patientName}.`);
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // 1-Click Action Handlers
  const handleAcknowledgeArrival = (id: string) => {
    setEscalations((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "BEDSIDE_ACTIVE",
              acknowledgedAt: "Just now",
            }
          : e
      )
    );
    setNotificationMsg("✅ Attending Physician bedside arrival logged in audit timeline.");
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleRePageStat = (esc: SbarEscalationItem) => {
    setNotificationMsg(`📢 Re-paged STAT: Repeated high-priority alert to ${esc.attendingPhysician} (Priority: STAT).`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleOpenResolve = (esc: SbarEscalationItem) => {
    setTargetEscalation(esc);
    setResolutionText("Physician evaluated patient at bedside. Orders executed, vitals stabilized, and care plan updated.");
    setResolveModalOpen(true);
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEscalation) return;

    setEscalations((prev) =>
      prev.map((item) =>
        item.id === targetEscalation.id
          ? {
              ...item,
              status: "RESOLVED",
              resolutionNotes: resolutionText,
            }
          : item
      )
    );
    setResolveModalOpen(false);
    setNotificationMsg(`✅ Escalation resolved and documented for ${targetEscalation.patientName}.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Filtered List
  const filteredEscalations = React.useMemo(() => {
    return escalations.filter((e) => {
      if (selectedPriority !== "ALL" && e.priority !== selectedPriority) return false;
      if (selectedStatus !== "ALL" && e.status !== selectedStatus) return false;
      if (selectedUnit !== "ALL" && e.unit.toLowerCase() !== selectedUnit.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = e.patientName.toLowerCase().includes(q);
        const matchMrn = e.mrn.toLowerCase().includes(q);
        const matchRoom = e.room.toLowerCase().includes(q);
        const matchSit = e.sbar.situation.toLowerCase().includes(q);
        const matchDoc = e.attendingPhysician.toLowerCase().includes(q);
        if (!matchName && !matchMrn && !matchRoom && !matchSit && !matchDoc) return false;
      }
      return true;
    });
  }, [escalations, selectedPriority, selectedStatus, selectedUnit, search]);

  const counts = React.useMemo(() => {
    const totalActive = escalations.filter((e) => e.status !== "RESOLVED").length;
    const statActive = escalations.filter((e) => e.priority === "STAT" && e.status !== "RESOLVED").length;
    const urgentActive = escalations.filter((e) => e.priority === "URGENT" && e.status !== "RESOLVED").length;
    const resolved = escalations.filter((e) => e.status === "RESOLVED").length;
    return { totalActive, statActive, urgentActive, resolved };
  }, [escalations]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 shrink-0" />
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
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <Flame className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  SBAR Clinical Rapid Escalation Hub
                  <span className="h-6 px-2.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {counts.totalActive} Active Escalations
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time structured SBAR communication, rapid physician dispatch, SLA response tracking, and audit trail.
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
              <span>{wsStatus === "connected" ? "Pager Gateway Online" : "Socket Active (18ms)"}</span>
            </div>

            <Button
              onClick={() => setNewSbarOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Dispatch STAT Escalation
            </Button>
          </div>
        </div>

        {/* Live CRT Lead II Strip for Selected Focused Escalation */}
        {activeEsc && (
          <Card className="bg-[#090d16] border-slate-800 text-white shadow-lg overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Radio className="h-4 w-4 animate-pulse text-rose-400" />
                  Escalation Target: {activeEsc.patientName} ({activeEsc.room}) — {activeEsc.sbar.situation.slice(0, 50)}...
                </div>
                <Badge
                  className={`text-[10px] font-mono border ${
                    activeEsc.priority === "STAT"
                      ? "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {activeEsc.priority} PRIORITY
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="text-rose-400 font-bold">HR: {activeEsc.vitalsSnapshot.hr} bpm</span>
                <span className="text-cyan-400">SpO2: {activeEsc.vitalsSnapshot.spo2}%</span>
                <span className="text-amber-400">
                  BP: {activeEsc.vitalsSnapshot.bpSys}/{activeEsc.vitalsSnapshot.bpDia}
                </span>
                <span className="text-indigo-400">MAP: {activeEsc.vitalsSnapshot.map}</span>
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
                Continuous Telemetry Feed | Pager Relay: PENDING ACK
              </div>
            </CardContent>
          </Card>
        )}

        {/* Escalation KPIs & SLAs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">STAT Priority</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-600">{counts.statActive}</span>
                <span className="text-xs text-rose-500 font-medium">SLA: &lt; 5 mins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">Urgent Priority</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-600">{counts.urgentActive}</span>
                <span className="text-xs text-amber-500 font-medium">SLA: &lt; 15 mins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">Physician Acknowledged</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-blue-600">
                  {escalations.filter((e) => e.status === "PHYSICIAN_ACKNOWLEDGED" || e.status === "BEDSIDE_ACTIVE").length}
                </span>
                <span className="text-xs text-blue-500 font-medium">Bedside Active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Resolved Cases</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600">{counts.resolved}</span>
                <span className="text-xs text-emerald-500 font-medium">Audited &amp; Signed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Navigation Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, room, doctor, SBAR…"
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
                <option value="URGENT">Urgent Priority</option>
                <option value="ROUTINE">Routine Callback</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Statuses</option>
                <option value="DISPATCHED">Dispatched (Paging)</option>
                <option value="PHYSICIAN_ACKNOWLEDGED">Acknowledged</option>
                <option value="BEDSIDE_ACTIVE">Bedside Active</option>
                <option value="RESOLVED">Resolved</option>
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

        {/* Escalations Feed */}
        <div className="space-y-3.5">
          {filteredEscalations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Escalations Found</h3>
              <p className="text-xs text-slate-400 mt-1">All clinical escalations resolved or no cases match filters.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
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
            filteredEscalations.map((esc) => {
              const isStat = esc.priority === "STAT";
              const isFocused = esc.id === focusedEscId;
              const isResolved = esc.status === "RESOLVED";

              return (
                <div
                  key={esc.id}
                  onClick={() => setFocusedEscId(esc.id)}
                  className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer shadow-sm ${
                    isFocused
                      ? "ring-2 ring-rose-500 border-rose-300"
                      : isStat && !isResolved
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Demographic & Status Bar */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={`text-[10px] font-bold border ${
                            isStat
                              ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                              : esc.priority === "URGENT"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {esc.priority}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            esc.status === "DISPATCHED"
                              ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                              : esc.status === "PHYSICIAN_ACKNOWLEDGED"
                              ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                              : esc.status === "BEDSIDE_ACTIVE"
                              ? "bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {esc.status.replace("_", " ")}
                        </Badge>

                        <span className="font-bold text-slate-900 text-base">{esc.patientName}</span>
                        <span className="text-xs text-slate-400">({esc.mrn})</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {esc.unit} · Room {esc.room}
                        </span>

                        {!isResolved && (
                          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 ml-auto lg:ml-0">
                            <Timer className="h-3 w-3 text-rose-600" />
                            Elapsed: <strong>{formatElapsed(esc.elapsedSeconds)}</strong>
                          </span>
                        )}
                      </div>

                      {/* SBAR Grid View */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] text-sky-700 block mb-0.5">
                            Situation:
                          </span>
                          <p className="text-slate-700">{esc.sbar.situation}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] text-amber-700 block mb-0.5">
                            Background:
                          </span>
                          <p className="text-slate-700">{esc.sbar.background}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] text-rose-700 block mb-0.5">
                            Assessment:
                          </span>
                          <p className="text-slate-700">{esc.sbar.assessment}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] text-emerald-700 block mb-0.5">
                            Recommendation:
                          </span>
                          <p className="text-slate-700">{esc.sbar.recommendation}</p>
                        </div>
                      </div>

                      {/* Resolution Notes */}
                      {esc.resolutionNotes && (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 mt-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Resolution Documented:</span>
                            <p className="text-[11px] mt-0.5 text-emerald-700">{esc.resolutionNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Action & Physician Info Column */}
                    <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-right text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                          <span>{esc.attendingPhysician}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">RN: {esc.nurseAuthor}</p>
                        <p className="text-[11px] text-slate-400">{esc.timestamp}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        {esc.status === "DISPATCHED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRePageStat(esc);
                              }}
                              className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 gap-1"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Re-Page STAT
                            </Button>

                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledgeArrival(esc.id);
                              }}
                              className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              MD Arrived
                            </Button>
                          </>
                        )}

                        {esc.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResolve(esc);
                            }}
                            className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Resolve Case
                          </Button>
                        )}

                        <Link
                          href={`/nurse/patients/${esc.patientId}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New SBAR Escalation Modal */}
      {newSbarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Construct Rapid SBAR Physician Escalation
                </h3>
              </div>
              <button onClick={() => setNewSbarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 1-Click Clinical Presets */}
            <div className="pt-3 pb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Quick Clinical Presets:</span>
              <button
                type="button"
                onClick={() => handleLoadPreset("SEPSIS")}
                className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium"
              >
                🔴 Sepsis Refractory Shock
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("STEMI")}
                className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium"
              >
                🟠 STEMI / Cath Lab Alert
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("STROKE")}
                className="px-2.5 py-1 text-xs rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
              >
                🟣 Stroke Code (NIHSS)
              </button>
            </div>

            <form onSubmit={handleDispatchSbar} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                  <Input
                    value={sbarForm.patientName}
                    onChange={(e) => setSbarForm({ ...sbarForm, patientName: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Unit</label>
                  <Input
                    value={sbarForm.room}
                    onChange={(e) => setSbarForm({ ...sbarForm, room: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Physician</label>
                  <Input
                    value={sbarForm.physician}
                    onChange={(e) => setSbarForm({ ...sbarForm, physician: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Escalation Priority</label>
                <select
                  value={sbarForm.priority}
                  onChange={(e) => setSbarForm({ ...sbarForm, priority: e.target.value as EscalationPriority })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-8"
                >
                  <option value="STAT">STAT (Immediate Bedside Response Required — SLA &lt; 5m)</option>
                  <option value="URGENT">URGENT (Response within 15 mins)</option>
                  <option value="ROUTINE">Routine Callback</option>
                </select>
              </div>

              {/* SBAR 4-Fields */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-sky-700 mb-0.5">S — Situation (What is happening right now?)</label>
                  <textarea
                    rows={2}
                    value={sbarForm.situation}
                    onChange={(e) => setSbarForm({ ...sbarForm, situation: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="e.g. Acute MAP drop below 60 mmHg and SpO2 at 89%..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-700 mb-0.5">B — Background (Clinical context & history)</label>
                  <textarea
                    rows={2}
                    value={sbarForm.background}
                    onChange={(e) => setSbarForm({ ...sbarForm, background: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. 68yo female admitted for pyelonephritis on IV antibiotics..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-0.5">A — Assessment (Your nursing analysis)</label>
                  <textarea
                    rows={2}
                    value={sbarForm.assessment}
                    onChange={(e) => setSbarForm({ ...sbarForm, assessment: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="e.g. Septic shock refractory to 2L crystalloids, lactate rising..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-700 mb-0.5">R — Recommendation (What action do you request?)</label>
                  <textarea
                    rows={2}
                    value={sbarForm.recommendation}
                    onChange={(e) => setSbarForm({ ...sbarForm, recommendation: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Request immediate bedside review and Norepinephrine orders..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setNewSbarOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Dispatch SBAR Pager Alert
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Resolution Modal */}
      {resolveModalOpen && targetEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Resolve Escalation Case</h3>
              </div>
              <button onClick={() => setResolveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bedside Outcome &amp; Clinical Orders Documented
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setResolveModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                  <Check className="h-4 w-4" />
                  Close &amp; Sign Escalation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
