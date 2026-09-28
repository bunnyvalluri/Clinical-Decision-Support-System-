"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  Bot,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  Clock,
  Filter,
  HeartPulse,
  Info,
  RotateCcw,
  Shield,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Search,
  X,
  Zap,
  Radio,
  RefreshCw,
  Sparkles,
  User,
  Layers,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";

import { BedsideTelemetryBadge } from "@/components/clinical";


type NotifType = "CRITICAL" | "ALERT" | "INFO" | "SUCCESS" | "SYSTEM";
type NotifCategory = "CLINICAL" | "AI_MODEL" | "REVIEW" | "SYSTEM" | "ADMIN";

export interface ClinicalNotification {
  id: string;
  type: NotifType;
  category: NotifCategory;
  title: string;
  body: string;
  time: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
  patientMrn?: string;
  patientName?: string;
}

const INITIAL_NOTIFICATIONS: ClinicalNotification[] = [
  {
    id: "n-001",
    type: "CRITICAL",
    category: "CLINICAL",
    title: "STAT: Critical Patient Deterioration — ICU Bed 04",
    body: "Patient Arthur Pendleton (MRN-91204) risk score escalated to 88.4%. Nurse Jenkins requests immediate physician review. SBP 178 mmHg, ST Depression 2.4 mm.",
    time: "Just now",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    actionLabel: "Review Case",
    actionHref: "/doctor/reviews",
    patientMrn: "MRN-91204",
    patientName: "Arthur Pendleton",
  },
  {
    id: "n-002",
    type: "CRITICAL",
    category: "CLINICAL",
    title: "Septic Shock Alert: Serum Lactate 4.8 mmol/L",
    body: "Patient Elena Rostova (MRN-78429) triggered Surviving Sepsis 1-Hour Bundle. MAP 58 mmHg, heart rate 118 BPM. Clinical intervention required.",
    time: "8 min ago",
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    read: false,
    actionLabel: "Launch Care Plan",
    actionHref: "/doctor/whiteboards",
    patientMrn: "MRN-78429",
    patientName: "Elena Rostova",
  },
  {
    id: "n-003",
    type: "ALERT",
    category: "CLINICAL",
    title: "Acute Stroke Pathway: NIHSS Score 14",
    body: "Patient Clara Oswald (MRN-33019) non-contrast CT completed. Symptom onset 2.5 hrs. Physician concurrence required for IV thrombolytic administration.",
    time: "18 min ago",
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    read: false,
    actionLabel: "Sign Off",
    actionHref: "/doctor/reviews",
    patientMrn: "MRN-33019",
    patientName: "Clara Oswald",
  },
  {
    id: "n-004",
    type: "SUCCESS",
    category: "REVIEW",
    title: "Physician Review Countersigned & Attested",
    body: "Your concurrence review for Patient MRN-55210 was successfully recorded and archived to Neon PostgreSQL per 21 CFR Part 11.",
    time: "1 hr ago",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    patientMrn: "MRN-55210",
    patientName: "Maya Lin",
  },
  {
    id: "n-005",
    type: "INFO",
    category: "CLINICAL",
    title: "Continuous Vitals Telemetry Synced",
    body: "Patient Gregory House (MRN-64012) ARDS lung protective ventilation parameters recorded. PaO2/FiO2 ratio 210, plateau pressure 24 cmH2O.",
    time: "2 hrs ago",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    patientMrn: "MRN-64012",
    patientName: "Gregory House",
  },
  {
    id: "n-006",
    type: "ALERT",
    category: "AI_MODEL",
    title: "TreeSHAP Model Feature Drift Audit — cardiac_risk_v3",
    body: "Informatics telemetry reports input distribution drift on ejection_fraction (KS-test p < 0.01). Human clinician gate enforced for all high-risk strata.",
    time: "3 hrs ago",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    actionLabel: "Inspect Inferences",
    actionHref: "/doctor/data-workspace",
  },
  {
    id: "n-007",
    type: "SUCCESS",
    category: "REVIEW",
    title: "Clinical Guideline Adherence — 98.4% This Week",
    body: "Your medical decisions achieved 98.4% alignment with Surviving Sepsis Campaign 2021 and AHA/ACC guidelines. Exemplary clinical compliance score logged.",
    time: "5 hrs ago",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "n-008",
    type: "SYSTEM",
    category: "SYSTEM",
    title: "Neon PostgreSQL Lakebase Backup Verified",
    body: "Point-in-time recovery checkpoint completed with zero unredacted PHI vector leaks. Database sync latency 11ms.",
    time: "Yesterday",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
];

const TYPE_CONFIG: Record<NotifType, {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  border: string;
  unreadBg: string;
  label: string;
  dot: string;
}> = {
  CRITICAL: {
    icon: AlertCircle,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-100",
    border: "border-rose-300",
    unreadBg: "bg-rose-50/60",
    label: "CRITICAL",
    dot: "bg-rose-600 animate-ping",
  },
  ALERT: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    border: "border-amber-300",
    unreadBg: "bg-amber-50/50",
    label: "ALERT",
    dot: "bg-amber-500",
  },
  INFO: {
    icon: Info,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    border: "border-blue-200",
    unreadBg: "bg-blue-50/40",
    label: "INFO",
    dot: "bg-blue-500",
  },
  SUCCESS: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    border: "border-emerald-200",
    unreadBg: "bg-emerald-50/30",
    label: "SUCCESS",
    dot: "bg-emerald-500",
  },
  SYSTEM: {
    icon: Shield,
    iconColor: "text-slate-500",
    iconBg: "bg-slate-100",
    border: "border-slate-200",
    unreadBg: "bg-slate-50/40",
    label: "SYSTEM",
    dot: "bg-slate-400",
  },
};

const CATEGORY_ICON: Record<NotifCategory, React.ElementType> = {
  CLINICAL: HeartPulse,
  AI_MODEL: Bot,
  REVIEW: Stethoscope,
  SYSTEM: Shield,
  ADMIN: Activity,
};

export default function DoctorNotificationsPage() {
  const [notifications, setNotifications] = React.useState<ClinicalNotification[]>(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);

  // Live WebSocket Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Handle Real-time WebSocket Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "NEW_PREDICTION" ||
      lastEvent.event_type === "vitals_updated" ||
      lastEvent.event_type === "review_submitted" ||
      lastEvent.event_type === "CRITICAL_ALERT"
    ) {
      const payload = (lastEvent.payload || {}) as Record<string, any>;
      const isCrit = String(payload.risk_level || "").toUpperCase() === "CRITICAL";

      const newNotif: ClinicalNotification = {
        id: `live-n-${Date.now()}`,
        type: isCrit ? "CRITICAL" : "ALERT",
        category: "CLINICAL",
        title: isCrit
          ? `STAT: Real-Time Deterioration Alert (${payload.patient_mrn || "Patient"})`
          : `New Risk Stratum Ingestion (${payload.patient_mrn || "Patient"})`,
        body: `Continuous telemetry detected probability ${(Number(payload.probability || 0.85) * 100).toFixed(1)}%. Top driver: ${payload.top_driver || "Vital Instability"}.`,
        time: "Just now",
        timestamp: new Date(),
        read: false,
        actionLabel: "Review Case",
        actionHref: "/doctor/reviews",
        patientMrn: payload.patient_mrn || "MRN-LIVE",
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setLastLiveEvent({
        message: `Real-time Alert received for ${newNotif.patientMrn} (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });
    }
  }, [lastEvent]);

  // Simulate Live Test Alert
  const handleTriggerSimulatedAlert = () => {
    const testNotif: ClinicalNotification = {
      id: `test-n-${Date.now()}`,
      type: "CRITICAL",
      category: "CLINICAL",
      title: "STAT: Simulated Acute Decompensation Alert",
      body: "Patient Arthur Pendleton (MRN-91204) SBP 82/48 mmHg, lactate elevated to 4.2 mmol/L. ICU rapid response team notified.",
      time: "Just now",
      timestamp: new Date(),
      read: false,
      actionLabel: "Open Telemetry",
      actionHref: "/doctor/data-workspace",
      patientMrn: "MRN-91204",
      patientName: "Arthur Pendleton",
    };

    setNotifications((prev) => [testNotif, ...prev]);
    setLastLiveEvent({
      message: `Simulated STAT alert received via real-time WebSocket channel`,
      timestamp: new Date(),
    });
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const dismiss = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => n.type === "CRITICAL" && !n.read).length;

  const filtered = notifications.filter((n) => {
    const matchCat =
      categoryFilter === "ALL" ||
      (categoryFilter === "CRITICAL" ? n.type === "CRITICAL" : n.category === categoryFilter);

    const matchRead = !showUnreadOnly || !n.read;

    const matchSearch =
      searchQuery.trim() === "" ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.patientMrn && n.patientMrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.patientName && n.patientName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchCat && matchRead && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-md shadow-rose-500/20">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Clinical Notifications & Early Warning Alerts
                </h1>
                {unreadCount > 0 && (
                  <Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 animate-pulse">
                    {unreadCount} Unread
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time multi-agent alert dispatch, critical vital deteriorations, and physician review requests
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <BedsideTelemetryBadge label="ALERT STREAM" bpm={criticalCount > 0 ? 98 : 74} isSpike={criticalCount > 0} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-rose-600" />
              <span>LIVE ALERTS ACTIVE</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerSimulatedAlert}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Test Alert
            </Button>

            {unreadCount > 0 && (
              <Button
                size="sm"
                onClick={markAllRead}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 shadow-2xs"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Live Event Notification Strip ─── */}
      {lastLiveEvent && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-xs text-rose-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-rose-600 animate-bounce" />
            <span className="font-semibold">{lastLiveEvent.message}</span>
          </div>
          <span className="text-[10px] text-rose-700 font-mono">
            {lastLiveEvent.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ─── Summary Stat Cards Row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className={`border shadow-2xs rounded-2xl ${unreadCount > 0 ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unread Alerts</p>
              <p className={`mt-1 text-2xl font-black ${unreadCount > 0 ? "text-rose-700" : "text-slate-900"}`}>{unreadCount}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Real-time Influx</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${unreadCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
              <Bell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/80 bg-rose-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Critical Deterioration</p>
              <p className="mt-1 text-2xl font-black text-rose-950">{criticalCount}</p>
              <p className="text-[10px] text-rose-600 font-medium mt-0.5">STAT Physician Review</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Clinical Telemetry</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {notifications.filter((n) => n.category === "CLINICAL").length}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">ICU & Step-Down</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HeartPulse className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 bg-purple-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">AI / Model Ops</p>
              <p className="mt-1 text-2xl font-black text-purple-950">
                {notifications.filter((n) => n.category === "AI_MODEL" || n.category === "REVIEW").length}
              </p>
              <p className="text-[10px] text-purple-600 font-medium mt-0.5">TreeSHAP Calibration</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Bot className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search, Tabs & Filter Toolbar ─── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { key: "ALL", label: "All Alerts", count: notifications.length },
            { key: "CRITICAL", label: "STAT Critical", count: notifications.filter((n) => n.type === "CRITICAL").length },
            { key: "CLINICAL", label: "Clinical", count: notifications.filter((n) => n.category === "CLINICAL").length },
            { key: "AI_MODEL", label: "AI Model", count: notifications.filter((n) => n.category === "AI_MODEL").length },
            { key: "REVIEW", label: "Reviews", count: notifications.filter((n) => n.category === "REVIEW").length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategoryFilter(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors shrink-0 ${
                categoryFilter === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  categoryFilter === tab.key ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors shrink-0 ${
              showUnreadOnly
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <BellOff className="h-3.5 w-3.5" />
            <span>Unread Only</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notifications by patient MRN, condition, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* ─── Notifications List ─── */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = cfg.icon;
            const CatIcon = CATEGORY_ICON[n.category] || Activity;

            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`group relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                  !n.read
                    ? `${cfg.border} ${cfg.unreadBg} shadow-xs hover:border-rose-400`
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                }`}
              >
                {/* Unread Glowing Dot */}
                {!n.read && (
                  <span className={`absolute top-4 right-4 h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.iconBg} border ${cfg.border}`}>
                    <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.iconBg} ${cfg.iconColor}`}>
                        {cfg.label}
                      </span>

                      {!n.read && (
                        <span className="rounded-md bg-rose-600 px-1.5 py-0.2 text-[9px] font-black text-white">
                          NEW
                        </span>
                      )}

                      {n.patientMrn && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {n.patientName ? `${n.patientName} (${n.patientMrn})` : n.patientMrn}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm font-bold leading-snug ${!n.read ? "text-slate-900" : "text-slate-800"}`}>
                      {n.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <CatIcon className="h-3.5 w-3.5 text-slate-400" />
                        {n.category.replace("_", " ")}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="h-3 w-3" />
                        {n.time}
                      </span>

                      {/* Action Link */}
                      {n.actionLabel && (
                        <Link
                          href={n.actionHref || "#"}
                          onClick={(e) => e.stopPropagation()}
                          className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${cfg.iconColor} bg-white border ${cfg.border} shadow-2xs hover:bg-slate-50 transition-colors`}
                        >
                          <span>{n.actionLabel}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id);
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
                    title="Dismiss alert"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">All Notifications Clear</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              {showUnreadOnly
                ? "No unread clinical notifications. All early warning alerts have been reviewed."
                : "No notifications matched your search criteria."}
            </p>
            {showUnreadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnreadOnly(false)}
                className="mt-3 rounded-xl text-xs font-semibold"
              >
                Show All Notifications
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Footer summary ─── */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Multi-agent clinical decision support early warning stream active.</span>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Showing {filtered.length} of {notifications.length}
        </span>
      </div>
    </div>
  );
}
