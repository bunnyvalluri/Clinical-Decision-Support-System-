"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  Info,
  CheckCircle2,
  CheckCheck,
  Flame,
  Radio,
  Clock,
  User,
  HeartPulse,
  Activity,
  Bed,
  Stethoscope,
  Search,
  Filter,
  Plus,
  Zap,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  Pill,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Send,
  Layers,
  FileCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export type NurseNotificationType = "ESCALATION_RESPONSE" | "TELEMETRY_ALARM" | "MEDICATION_BCMA" | "LAB_ALERT" | "SHIFT_ADMIN";
export type NotificationPriority = "STAT" | "HIGH" | "MEDIUM" | "INFO";

export interface NurseNotificationItem {
  id: string;
  patientId?: string;
  patientName?: string;
  mrn?: string;
  room?: string;
  unit?: string;
  type: NurseNotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionLink?: string;
  actionLabel?: string;
}

const INITIAL_NOTIFICATIONS: NurseNotificationItem[] = [
  {
    id: "notif-001",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    type: "ESCALATION_RESPONSE",
    priority: "STAT",
    title: "SBAR Escalation Acknowledged by Dr. Gregory Vance, MD",
    body: "Attending critical care physician acknowledged the MAP < 65 deterioration alert. Bedside ETA: 3 minutes. Norepinephrine titration order entered.",
    timestamp: "2 mins ago",
    read: false,
    actionLink: "/nurse/escalations",
    actionLabel: "View Escalation Tracker",
  },
  {
    id: "notif-002",
    patientId: "pat-tele-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-67210",
    room: "3B-212",
    unit: "Telemetry",
    type: "TELEMETRY_ALARM",
    priority: "HIGH",
    title: "Telemetry Monitor Alarm: 6-Beat V-Tach Run",
    body: "Continuous Lead II monitor detected self-terminating ventricular tachycardia burst. Current HR 112 bpm. Stat 12-lead ECG recommended.",
    timestamp: "6 mins ago",
    read: false,
    actionLink: "/nurse/alerts",
    actionLabel: "Inspect Alarm Strip",
  },
  {
    id: "notif-003",
    patientId: "pat-icu-01",
    patientName: "Elena Rostova",
    mrn: "MRN-89421",
    room: "ICU-04",
    unit: "ICU",
    type: "LAB_ALERT",
    priority: "STAT",
    title: "Critical Lab Result: Serum Lactate Elevated (4.2 mmol/L)",
    body: "Stat lactate draw resulted above 4.0 threshold. Sepsis resuscitation bundle hour-3 compliance required. Repeat draw due at 10:00.",
    timestamp: "14 mins ago",
    read: false,
    actionLink: "/nurse/tasks",
    actionLabel: "View Sepsis Tasks",
  },
  {
    id: "notif-004",
    patientId: "pat-tele-02",
    patientName: "Arthur Pendleton",
    mrn: "MRN-67210",
    room: "3B-212",
    unit: "Telemetry",
    type: "MEDICATION_BCMA",
    priority: "HIGH",
    title: "High-Alert Medication Due: Ticagrelor 90mg PO",
    body: "Post-PCI dual antiplatelet scheduled for 10:00. Barcode verification required prior to administration.",
    timestamp: "22 mins ago",
    read: true,
    actionLink: "/nurse/tasks",
    actionLabel: "Open Med Schedule",
  },
  {
    id: "notif-005",
    patientId: "pat-er-04",
    patientName: "Clara Zhang",
    mrn: "MRN-31849",
    room: "SD-108",
    unit: "Step-Down",
    type: "ESCALATION_RESPONSE",
    priority: "HIGH",
    title: "BiPAP Non-Invasive Ventilation Order Placed",
    body: "Dr. Vance signed order for BiPAP 12/5 cmH2O on 40% FiO2. Respiratory therapy dispatched to Room SD-108.",
    timestamp: "35 mins ago",
    read: true,
    actionLink: "/nurse/patients/pat-er-04",
    actionLabel: "Open Patient Chart",
  },
  {
    id: "notif-006",
    unit: "Ward 3 & 4",
    type: "SHIFT_ADMIN",
    priority: "INFO",
    title: "Charge Nurse Handover Reminder — 14:00 Mid-Shift Audit",
    body: "Please verify all Q1H vitals, strict I&O outputs, and pending lab requisitions are signed off prior to 14:00.",
    timestamp: "45 mins ago",
    read: true,
    actionLink: "/nurse/whiteboards",
    actionLabel: "Open Handover Board",
  },
];

export default function NurseNotificationsPage() {
  const { status: wsStatus } = useUserWebSocket();
  const [notifications, setNotifications] = React.useState<NurseNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [isSimulatingSpike, setIsSimulatingSpike] = React.useState(false);

  // Telemetry Sweep Canvas
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [focusedNotifId, setFocusedNotifId] = React.useState<string>("notif-001");
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const activeNotif = React.useMemo(() => {
    return notifications.find((n) => n.id === focusedNotifId) || notifications[0];
  }, [notifications, focusedNotifId]);

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
    const isStat = activeNotif?.priority === "STAT" || isSimulatingSpike;
    const hr = isStat ? 120 : 76;

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
      ctx.strokeStyle = isStat ? "#f43f5e" : activeNotif?.priority === "HIGH" ? "#f59e0b" : "#10b981";
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
  }, [activeNotif, isSimulatingSpike]);

  // Handlers
  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setToastMsg("All notifications marked as read.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Real-Time Simulation
  const handleSimulateNewNotification = () => {
    setIsSimulatingSpike(true);
    setTimeout(() => setIsSimulatingSpike(false), 5000);

    const newNotif: NurseNotificationItem = {
      id: `notif-${Date.now()}`,
      patientId: "pat-icu-01",
      patientName: "Elena Rostova",
      mrn: "MRN-89421",
      room: "ICU-04",
      unit: "ICU",
      type: "ESCALATION_RESPONSE",
      priority: "STAT",
      title: "Physician Arrived at Bedside (Dr. Gregory Vance, MD)",
      body: "Attending critical care physician has initiated central venous catheterization and Norepinephrine infusion.",
      timestamp: "Just now",
      read: false,
      actionLink: "/nurse/patients/pat-icu-01",
      actionLabel: "View Bedside Chart",
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setFocusedNotifId(newNotif.id);
    setToastMsg("🚨 Live Notification Received: Dr. Vance arrived at Bedside (ICU-04)");
    setTimeout(() => setToastMsg(null), 6000);
  };

  // Filtered List
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      if (selectedType !== "ALL" && n.type !== selectedType) return false;
      if (selectedPriority !== "ALL" && n.priority !== selectedPriority) return false;
      if (showUnreadOnly && n.read) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchBody = n.body.toLowerCase().includes(q);
        const matchPatient = n.patientName?.toLowerCase().includes(q);
        const matchRoom = n.room?.toLowerCase().includes(q);
        if (!matchTitle && !matchBody && !matchPatient && !matchRoom) return false;
      }
      return true;
    });
  }, [notifications, selectedType, selectedPriority, showUnreadOnly, search]);

  const counts = React.useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const statUnread = notifications.filter((n) => !n.read && n.priority === "STAT").length;
    const highUnread = notifications.filter((n) => !n.read && n.priority === "HIGH").length;
    return { total, unread, statUnread, highUnread };
  }, [notifications]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-sky-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md sticky top-0 z-50 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="hover:opacity-80">
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
                <BellRing className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Nursing Clinical Notifications &amp; Broadcasts
                  <span className="h-6 px-2.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {counts.unread} Unread
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time physician escalation callbacks, critical lab alerts, telemetry spikes, and shift broadcasts.
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
              <span>{wsStatus === "connected" ? "Broadcast Stream Live" : "Socket Synchronized"}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="border-slate-200 text-slate-700 text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              Mark All Read
            </Button>

            <Button
              size="sm"
              onClick={handleSimulateNewNotification}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              Simulate Live Event
            </Button>
          </div>
        </div>

        {/* Lead II Monitor for Active Notification Focus */}
        {activeNotif && (
          <Card className="bg-[#090d16] border-slate-800 text-white shadow-lg overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                  Signal Focus: {activeNotif.patientName ? `${activeNotif.patientName} (${activeNotif.room})` : activeNotif.title}
                </div>
                <Badge
                  className={`text-[10px] font-mono border ${
                    activeNotif.priority === "STAT"
                      ? "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                      : "bg-emerald-950 text-emerald-300 border-emerald-800"
                  }`}
                >
                  {activeNotif.priority} PRIORITY
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="text-emerald-400">TYPE: {activeNotif.type.replace("_", " ")}</span>
                <span className="text-cyan-400">STATE: {activeNotif.read ? "READ" : "UNREAD"}</span>
                <span className="text-amber-400">TIME: {activeNotif.timestamp}</span>
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
                Real-Time Clinical Broadcast Stream | Notch 60Hz Filter Active
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">STAT Unread</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-600">{counts.statUnread}</span>
                <span className="text-xs text-rose-500 font-medium">Critical Callbacks</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">High Urgency</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-600">{counts.highUnread}</span>
                <span className="text-xs text-amber-500 font-medium">Telemetry/Meds</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-sky-600 uppercase tracking-wider">Total Unread</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-sky-600">{counts.unread}</span>
                <span className="text-xs text-sky-500 font-medium">Pending Review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Total Handled Today</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600">{counts.total - counts.unread}</span>
                <span className="text-xs text-emerald-500 font-medium">Acknowledged</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Filter:
            </span>
            {[
              { id: "ALL", label: "All Broadcasts" },
              { id: "ESCALATION_RESPONSE", label: "Physician Callbacks" },
              { id: "TELEMETRY_ALARM", label: "Telemetry Alarms" },
              { id: "LAB_ALERT", label: "Critical Labs" },
              { id: "MEDICATION_BCMA", label: "Medication Passes" },
              { id: "SHIFT_ADMIN", label: "Shift Admin" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedType === tab.id
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
                placeholder="Search notifications, patients, rooms…"
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
                <option value="INFO">Informational</option>
              </select>

              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`h-9 text-xs rounded-lg ${
                  showUnreadOnly ? "bg-sky-600 hover:bg-sky-700 text-white" : "border-slate-200 text-slate-700"
                }`}
              >
                {showUnreadOnly ? "Showing Unread Only" : "Show All"}
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">All Notifications Clear</h3>
              <p className="text-xs text-slate-400 mt-1">No broadcasts matched the selected filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedType("ALL");
                  setSelectedPriority("ALL");
                  setShowUnreadOnly(false);
                  setSearch("");
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isStat = notif.priority === "STAT";
              const isFocused = notif.id === focusedNotifId;

              return (
                <div
                  key={notif.id}
                  onClick={() => setFocusedNotifId(notif.id)}
                  className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer shadow-sm ${
                    isFocused
                      ? "ring-2 ring-sky-500 border-sky-300"
                      : isStat && !notif.read
                      ? "border-rose-300 bg-rose-50/25"
                      : !notif.read
                      ? "border-sky-200 bg-sky-50/20"
                      : "border-slate-200 hover:border-slate-300 opacity-80"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Icon & Content */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isStat
                            ? "bg-rose-100 text-rose-700 animate-pulse"
                            : notif.priority === "HIGH"
                            ? "bg-amber-100 text-amber-700"
                            : notif.type === "MEDICATION_BCMA"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {isStat ? (
                          <Flame className="h-5 w-5" />
                        ) : notif.type === "TELEMETRY_ALARM" ? (
                          <HeartPulse className="h-5 w-5" />
                        ) : notif.type === "MEDICATION_BCMA" ? (
                          <Pill className="h-5 w-5" />
                        ) : notif.type === "LAB_ALERT" ? (
                          <Activity className="h-5 w-5" />
                        ) : (
                          <Bell className="h-5 w-5" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] font-bold border ${
                              isStat
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : notif.priority === "HIGH"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {notif.priority}
                          </Badge>

                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                            {notif.type.replace("_", " ")}
                          </Badge>

                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                          )}

                          {notif.patientName && (
                            <>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="font-bold text-slate-900 text-xs">{notif.patientName}</span>
                              <span className="text-xs text-slate-500 font-medium">
                                ({notif.unit} · Room {notif.room})
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 pt-0.5">{notif.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
                      </div>
                    </div>

                    {/* Right Time & Action Buttons */}
                    <div className="flex flex-wrap items-center lg:flex-col lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {notif.timestamp}
                      </span>

                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(notif.id);
                          }}
                          className="h-8 text-xs text-slate-500 hover:text-slate-800"
                        >
                          {notif.read ? "Mark Unread" : "Mark Read"}
                        </Button>

                        {notif.actionLink && (
                          <Link href={notif.actionLink} onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white gap-1">
                              {notif.actionLabel || "View Details"}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
