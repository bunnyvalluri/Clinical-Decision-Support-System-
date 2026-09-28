"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Zap,
  AlertTriangle,
  Flame,
  Shield,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
  HeartPulse,
  Activity,
  Volume2,
  VolumeX,
  Plus,
  RefreshCw,
  Search,
  Filter,
  User,
  Bed,
  Check,
  X,
  Stethoscope,
  ChevronRight,
  Send,
  AlertOctagon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface NurseAlertItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  room: string;
  unit: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: "CARDIAC" | "RESPIRATORY" | "SEPSIS" | "MEDICATION" | "EQUIPMENT" | "FALL_RISK";
  title: string;
  message: string;
  timestamp: string;
  vitalsSnapshot: {
    hr: number;
    bpSys: number;
    bpDia: number;
    spo2: number;
    rr: number;
    temp: number;
  };
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolutionNote?: string;
}

const INITIAL_ALERTS: NurseAlertItem[] = [
  {
    id: "alt-01",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    severity: "CRITICAL",
    status: "ACTIVE",
    category: "SEPSIS",
    title: "Critical MAP Deterioration & SpO2 Drop",
    message: "MAP dropped to 62 mmHg (< 65 threshold) with SpO2 at 89%. Sustained sinus tachycardia at 124 bpm. Sepsis bundle protocol check required.",
    timestamp: "1 min ago",
    vitalsSnapshot: { hr: 124, bpSys: 84, bpDia: 51, spo2: 89, rr: 28, temp: 39.1 },
  },
  {
    id: "alt-02",
    patientId: "pat-tele-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-67210",
    room: "3B-212",
    unit: "Telemetry",
    severity: "HIGH",
    status: "ACTIVE",
    category: "CARDIAC",
    title: "Telemetry Alarm: Non-Sustained V-Tach Run",
    message: "6-beat run of Ventricular Tachycardia detected on Lead II strip. Current heart rate resting at 112 bpm. Check electrolytes & 12-lead ECG.",
    timestamp: "4 mins ago",
    vitalsSnapshot: { hr: 112, bpSys: 146, bpDia: 92, spo2: 95, rr: 20, temp: 37.2 },
  },
  {
    id: "alt-03",
    patientId: "pat-er-04",
    patientName: "Clara Zhang",
    mrn: "MRN-31849",
    room: "SD-108",
    unit: "Step-Down",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    category: "RESPIRATORY",
    title: "Severe Dyspnea & Desaturation",
    message: "SpO2 decreased from 94% to 90% on 3L nasal cannula. Resp rate elevated to 26/min. Respiratory therapy contacted.",
    timestamp: "12 mins ago",
    vitalsSnapshot: { hr: 106, bpSys: 138, bpDia: 86, spo2: 90, rr: 26, temp: 37.9 },
    acknowledgedBy: "Sarah Jenkins, RN",
    acknowledgedAt: "8 mins ago",
  },
  {
    id: "alt-04",
    patientId: "pat-surg-03",
    patientName: "Marcus Holloway",
    mrn: "MRN-43901",
    room: "4W-405",
    unit: "Med-Surg",
    severity: "MEDIUM",
    status: "ACTIVE",
    category: "FALL_RISK",
    title: "Bed Exit Alarm Triggered",
    message: "Pressure sensor detects unassisted egress attempt. Patient is high fall risk post-laparoscopic surgery.",
    timestamp: "18 mins ago",
    vitalsSnapshot: { hr: 82, bpSys: 128, bpDia: 80, spo2: 98, rr: 16, temp: 37.1 },
  },
  {
    id: "alt-05",
    patientId: "pat-med-05",
    patientName: "David Kim",
    mrn: "MRN-19402",
    room: "4W-412",
    unit: "Med-Surg",
    severity: "INFO",
    status: "RESOLVED",
    category: "MEDICATION",
    title: "IV Ceftriaxone Infusion Complete",
    message: "100 mL IVPB Ceftriaxone completed infusion cycle via Baxter pump. Line flushed with 20 mL Normal Saline.",
    timestamp: "32 mins ago",
    vitalsSnapshot: { hr: 74, bpSys: 120, bpDia: 76, spo2: 99, rr: 15, temp: 36.8 },
    acknowledgedBy: "Alex Rivera, RN",
    acknowledgedAt: "30 mins ago",
    resolutionNote: "Line flushed, patient resting comfortably in chair.",
  },
];

export default function NurseAlertsPage() {
  const { status: wsStatus } = useUserWebSocket();
  const [alerts, setAlerts] = React.useState<NurseAlertItem[]>(INITIAL_ALERTS);
  const [search, setSearch] = React.useState("");
  const [selectedSeverity, setSelectedSeverity] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [selectedUnit, setSelectedUnit] = React.useState<string>("ALL");
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // Active Alert for Telemetry Strip Focus
  const [focusedAlertId, setFocusedAlertId] = React.useState<string>("alt-01");

  // Telemetry Canvas Ref
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Quick Action Modal / Drawer States
  const [escalateModalOpen, setEscalateModalOpen] = React.useState(false);
  const [targetAlert, setTargetAlert] = React.useState<NurseAlertItem | null>(null);
  const [escalationForm, setEscalationForm] = React.useState({
    physician: "Dr. Gregory Vance, MD (Attending)",
    priority: "STAT",
    sbarText: "Patient exhibiting acute decompensation. Immediate bedside evaluation requested.",
  });
  const [actionSuccessMsg, setActionSuccessMsg] = React.useState<string | null>(null);

  // Resolve Intervention Modal
  const [resolveModalOpen, setResolveModalOpen] = React.useState(false);
  const [resolutionText, setResolutionText] = React.useState("Bedside assessment completed. Interventions applied.");

  const activeAlert = React.useMemo(() => {
    return alerts.find((a) => a.id === focusedAlertId) || alerts[0];
  }, [alerts, focusedAlertId]);

  // Lead II ECG Canvas Animation for Alerts
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
    const isCritical = activeAlert?.severity === "CRITICAL";
    const hr = activeAlert ? activeAlert.vitalsSnapshot.hr : 110;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(x, 0, 10, height);

      ctx.strokeStyle = isCritical ? "rgba(244, 63, 94, 0.12)" : "rgba(16, 185, 129, 0.12)";
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
        dy = -Math.sin(((beat - 0.15) / 0.07) * Math.PI) * 8;
      } else if (beat >= 0.22 && beat < 0.26) {
        dy = 5;
      } else if (beat >= 0.26 && beat < 0.32) {
        const spike = isCritical ? 42 : 30;
        dy = -Math.sin(((beat - 0.26) / 0.06) * Math.PI) * spike;
      } else if (beat >= 0.32 && beat < 0.36) {
        dy = 9;
      } else if (beat >= 0.36 && beat < 0.44) {
        dy = isCritical ? -7 : 0;
      } else if (beat >= 0.44 && beat < 0.6) {
        dy = -Math.sin(((beat - 0.44) / 0.16) * Math.PI) * 14;
      } else {
        dy = (Math.random() - 0.5) * 2;
      }

      ctx.beginPath();
      ctx.strokeStyle = isCritical ? "#f43f5e" : activeAlert?.severity === "HIGH" ? "#f59e0b" : "#10b981";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = isCritical ? "rgba(244, 63, 94, 0.8)" : "#10b981";
      ctx.shadowBlur = 7;
      ctx.moveTo(prevX, midY + dy);
      ctx.lineTo(x, midY + dy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeAlert]);

  // Real-time simulated new alarm generator
  const handleSimulateNewAlarm = () => {
    const newAlarm: NurseAlertItem = {
      id: `alt-${Date.now()}`,
      patientId: "pat-icu-01",
      patientName: "Elena Rostova",
      mrn: "MRN-89421",
      room: "ICU-04",
      unit: "ICU",
      severity: "CRITICAL",
      status: "ACTIVE",
      category: "CARDIAC",
      title: "Sudden Bradycardia / ST Elevation Alert",
      message: "Lead II ST segment elevation +2.8mm detected. Heart rate dropped rapidly from 116 to 48 bpm. Immediate crash cart & provider notification recommended.",
      timestamp: "Just now",
      vitalsSnapshot: { hr: 48, bpSys: 78, bpDia: 46, spo2: 88, rr: 28, temp: 38.6 },
    };

    setAlerts((prev) => [newAlarm, ...prev]);
    setFocusedAlertId(newAlarm.id);
    setActionSuccessMsg("🚨 New Real-Time Critical Alarm Received: Elena Rostova (ICU-04)");
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Filtered Alerts
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((a) => {
      if (selectedSeverity !== "ALL" && a.severity !== selectedSeverity) return false;
      if (selectedStatus !== "ALL" && a.status !== selectedStatus) return false;
      if (selectedUnit !== "ALL" && a.unit.toLowerCase() !== selectedUnit.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = a.patientName.toLowerCase().includes(q);
        const matchMrn = a.mrn.toLowerCase().includes(q);
        const matchRoom = a.room.toLowerCase().includes(q);
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchMsg = a.message.toLowerCase().includes(q);
        if (!matchName && !matchMrn && !matchRoom && !matchTitle && !matchMsg) return false;
      }
      return true;
    });
  }, [alerts, selectedSeverity, selectedStatus, selectedUnit, search]);

  // Counts
  const counts = React.useMemo(() => {
    const totalActive = alerts.filter((a) => a.status === "ACTIVE").length;
    const criticalActive = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "ACTIVE").length;
    const highActive = alerts.filter((a) => a.severity === "HIGH" && a.status === "ACTIVE").length;
    const acknowledged = alerts.filter((a) => a.status === "ACKNOWLEDGED").length;
    return { totalActive, criticalActive, highActive, acknowledged };
  }, [alerts]);

  // Handlers
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: "ACKNOWLEDGED",
              acknowledgedBy: "Sarah Jenkins, RN",
              acknowledgedAt: "Just now",
            }
          : a
      )
    );
    setActionSuccessMsg("Alert acknowledged & audible tone silenced for 5 minutes.");
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleOpenEscalateModal = (alert: NurseAlertItem) => {
    setTargetAlert(alert);
    setEscalationForm({
      physician: "Dr. Gregory Vance, MD (Attending)",
      priority: alert.severity === "CRITICAL" ? "STAT" : "URGENT",
      sbarText: `Patient ${alert.patientName} (${alert.room}) - Alarm: ${alert.title}. Current HR ${alert.vitalsSnapshot.hr}, BP ${alert.vitalsSnapshot.bpSys}/${alert.vitalsSnapshot.bpDia}, SpO2 ${alert.vitalsSnapshot.spo2}%. Immediate physician review needed.`,
    });
    setEscalateModalOpen(true);
  };

  const handleSendEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAlert) return;
    setEscalateModalOpen(false);
    setActionSuccessMsg(`🚨 STAT SBAR Escalation dispatched to ${escalationForm.physician} for ${targetAlert.patientName}.`);
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const handleOpenResolveModal = (alert: NurseAlertItem) => {
    setTargetAlert(alert);
    setResolutionText("Patient reassessed at bedside. Oxygen titrated, vitals normalized, and physician notified.");
    setResolveModalOpen(true);
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAlert) return;

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === targetAlert.id
          ? {
              ...a,
              status: "RESOLVED",
              resolutionNote: resolutionText,
              acknowledgedBy: a.acknowledgedBy || "Sarah Jenkins, RN",
              acknowledgedAt: a.acknowledgedAt || "Just now",
            }
          : a
      )
    );
    setResolveModalOpen(false);
    setActionSuccessMsg(`Alert resolved and logged in audit history for ${targetAlert.patientName}.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Dynamic Action Notification */}
      {actionSuccessMsg && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Alert Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <BellRing className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Bedside Alerts &amp; Alarm Hub
                  <span className="h-6 px-2.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {counts.totalActive} Active
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time physiological alarm telemetry, silence protocols, SBAR physician escalation, and audit trail.
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
              <span>{wsStatus === "connected" ? "Live Telemetry Feed" : "Socket Synchronized"}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border-slate-200 text-slate-700 text-xs gap-1.5"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600" /> Sound ON
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" /> Sound Muted
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleSimulateNewAlarm}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              Simulate Live Alarm
            </Button>
          </div>
        </div>

        {/* Live CRT Lead II Strip for Active Focused Alert */}
        {activeAlert && (
          <Card className="bg-[#090d16] border-slate-800 text-white shadow-lg overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Radio className="h-4 w-4 animate-pulse text-rose-400" />
                  Telemetry Focus: {activeAlert.patientName} ({activeAlert.room}) — {activeAlert.title}
                </div>
                <Badge
                  className={`text-[10px] font-mono border ${
                    activeAlert.severity === "CRITICAL"
                      ? "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {activeAlert.severity} ALARM
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="text-rose-400 font-bold">HR: {activeAlert.vitalsSnapshot.hr} bpm</span>
                <span className="text-cyan-400">SpO2: {activeAlert.vitalsSnapshot.spo2}%</span>
                <span className="text-amber-400">
                  BP: {activeAlert.vitalsSnapshot.bpSys}/{activeAlert.vitalsSnapshot.bpDia}
                </span>
                <span className="text-indigo-400">RR: {activeAlert.vitalsSnapshot.rr}/min</span>
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
                Continuous Alarm Monitor | Sweep: 25 mm/s | Gain: 10 mm/mV
              </div>
            </CardContent>
          </Card>
        )}

        {/* Severity Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">Critical (STAT)</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-600">{counts.criticalActive}</span>
                <span className="text-xs text-rose-500 font-medium">Life-Threat Alerts</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">High Urgency</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-600">{counts.highActive}</span>
                <span className="text-xs text-amber-600 font-medium">Urgent Check</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">Acknowledged</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-blue-600">{counts.acknowledged}</span>
                <span className="text-xs text-blue-500 font-medium">Under Nurse Review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Resolved Today</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600">
                  {alerts.filter((a) => a.status === "RESOLVED").length}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Audited &amp; Signed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Navigation Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, room, alarm text…"
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 rounded-lg"
              />
            </div>

            {/* Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical (STAT)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Warning</option>
                <option value="INFO">Informational</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Unacknowledged</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved / History</option>
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

        {/* Alerts Feed */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">All Alarms Clear</h3>
              <p className="text-xs text-slate-400 mt-1">No active alerts matched your current filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSeverity("ALL");
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
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === "CRITICAL";
              const isFocused = alert.id === focusedAlertId;

              return (
                <div
                  key={alert.id}
                  onClick={() => setFocusedAlertId(alert.id)}
                  className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer shadow-sm ${
                    isFocused
                      ? "ring-2 ring-rose-400 border-rose-300"
                      : isCritical && alert.status === "ACTIVE"
                      ? "border-rose-300 bg-rose-50/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Icon & Information */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isCritical
                            ? "bg-rose-100 text-rose-700 animate-pulse"
                            : alert.severity === "HIGH"
                            ? "bg-amber-100 text-amber-700"
                            : alert.severity === "MEDIUM"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isCritical ? (
                          <AlertOctagon className="h-5 w-5" />
                        ) : alert.severity === "HIGH" ? (
                          <Zap className="h-5 w-5" />
                        ) : (
                          <Bell className="h-5 w-5" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] font-bold border ${
                              isCritical
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : alert.severity === "HIGH"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {alert.severity}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              alert.status === "ACTIVE"
                                ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                                : alert.status === "ACKNOWLEDGED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {alert.status}
                          </Badge>

                          <span className="font-bold text-slate-900 text-sm">{alert.patientName}</span>
                          <span className="text-xs text-slate-400">({alert.mrn})</span>
                          <span className="text-xs text-slate-500 font-medium">
                            Room: {alert.room} · {alert.unit}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-900 text-sm">{alert.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>

                        {/* Snapshot Vitals */}
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[11px] font-medium text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            HR: <strong>{alert.vitalsSnapshot.hr} bpm</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            BP: <strong>{alert.vitalsSnapshot.bpSys}/{alert.vitalsSnapshot.bpDia}</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            SpO2: <strong>{alert.vitalsSnapshot.spo2}%</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            RR: <strong>{alert.vitalsSnapshot.rr}/min</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            Temp: <strong>{alert.vitalsSnapshot.temp}°C</strong>
                          </span>
                        </div>

                        {/* Acknowledgement / Resolution Note */}
                        {alert.acknowledgedBy && (
                          <p className="text-[11px] text-slate-500 italic pt-1">
                            Acknowledged by {alert.acknowledgedBy} ({alert.acknowledgedAt})
                            {alert.resolutionNote && ` · Resolution: "${alert.resolutionNote}"`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap items-center lg:flex-col lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {alert.timestamp}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {alert.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledgeAlert(alert.id);
                            }}
                            className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Acknowledge
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEscalateModal(alert);
                          }}
                          className={`h-8 text-xs gap-1 ${
                            isCritical
                              ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50"
                          }`}
                        >
                          <Flame className="h-3.5 w-3.5 text-rose-500" />
                          SBAR Escalate
                        </Button>

                        {alert.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResolveModal(alert);
                            }}
                            className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Resolve
                          </Button>
                        )}

                        <Link
                          href={`/nurse/patients/${alert.patientId}`}
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

      {/* STAT SBAR Physician Escalation Modal */}
      {escalateModalOpen && targetAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Dispatch STAT SBAR Physician Alert
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Patient: {targetAlert.patientName} · Room: {targetAlert.room} · MRN: {targetAlert.mrn}
                </p>
              </div>
              <button onClick={() => setEscalateModalOpen(false)} className="text-rose-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendEscalation} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">On-Call Attending Physician</label>
                <Input
                  value={escalationForm.physician}
                  onChange={(e) => setEscalationForm({ ...escalationForm, physician: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Escalation Priority</label>
                <select
                  value={escalationForm.priority}
                  onChange={(e) => setEscalationForm({ ...escalationForm, priority: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
                >
                  <option value="STAT">STAT (Immediate Bedside Response Required)</option>
                  <option value="URGENT">URGENT (Response within 15 mins)</option>
                  <option value="ROUTINE">Routine Callback</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">SBAR Structured Narrative</label>
                <textarea
                  value={escalationForm.sbarText}
                  onChange={(e) => setEscalationForm({ ...escalationForm, sbarText: e.target.value })}
                  rows={4}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Escalation immediately activates physician pagers and posts an immutable entry in the electronic audit log.
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
                  <Send className="h-4 w-4" />
                  Dispatch Physician STAT
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Alarm Modal */}
      {resolveModalOpen && targetAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolve Bedside Alarm
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Patient: {targetAlert.patientName} · {targetAlert.title}
                </p>
              </div>
              <button onClick={() => setResolveModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Action / Resolution Narrative
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolveModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                  <Check className="h-4 w-4" />
                  Sign &amp; Resolve Alarm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
