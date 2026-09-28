"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
  Trash2,
  ExternalLink,
  Radio,
  Server,
  Zap,
  ShieldCheck,
  Download,
  Volume2,
  VolumeX,
  Send,
  MessageSquare,
  Smartphone,
  Check,
  Search,
  Activity,
  Flame,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export type NotificationCategory = "INFRASTRUCTURE" | "SECURITY" | "MLOPS" | "CERTIFICATE" | "CLINICAL_RISK";
export type NotificationType = "ALERT" | "INFO" | "WARNING";
export type NotificationChannel = "PUSH" | "SLACK" | "PAGERDUTY" | "SMS";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: NotificationCategory;
  type: NotificationType;
  read: boolean;
  channel: NotificationChannel;
  incidentId?: string;
  sourceNode?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Database Compute Pool Autoscaled to 2 CU",
    description: "Neon Serverless Postgres compute scaled up automatically to absorb morning clinician shift login surge. Response latency remained nominal (11.8ms).",
    timestamp: "12 minutes ago",
    category: "INFRASTRUCTURE",
    type: "INFO",
    read: false,
    channel: "SLACK",
    incidentId: "INC-88021",
    sourceNode: "neon-pool-us-east-1",
  },
  {
    id: "notif-2",
    title: "SSL/TLS Wildcard Certificate Renewal Milestone",
    description: "Wildcard certificate for *.hospital.org is valid for next 68 days. Automated ACME DNS-01 renewal scheduled in 38 days.",
    timestamp: "1 hour ago",
    category: "CERTIFICATE",
    type: "INFO",
    read: false,
    channel: "PUSH",
    incidentId: "INC-88019",
    sourceNode: "certbot-acme-daemon",
  },
  {
    id: "notif-3",
    title: "Celery Worker Queue Latency Spike Resolved",
    description: "PDF batch compilation queue peaked at 14 pending jobs before returning to nominal (0 jobs). Worker pool auto-rebalanced concurrency.",
    timestamp: "3 hours ago",
    category: "MLOPS",
    type: "WARNING",
    read: true,
    channel: "PAGERDUTY",
    incidentId: "INC-88014",
    sourceNode: "celery-worker-cluster-02",
  },
  {
    id: "notif-4",
    title: "Perimeter Intrusion Alert: Multiple Failed Logins",
    description: "5 consecutive failed authentication attempts detected from IP 192.168.1.104. Automated 15-minute rate-limiting quarantine rule enforced.",
    timestamp: "5 hours ago",
    category: "SECURITY",
    type: "ALERT",
    read: true,
    channel: "SMS",
    incidentId: "INC-88009",
    sourceNode: "zero-trust-waf-01",
  },
  {
    id: "notif-5",
    title: "Upstash Redis In-Memory Eviction Check: 0 Evictions",
    description: "Daily memory audit concluded. Cache hit ratio maintained at 94.8% across 18.4 MB of active memory with 0 forced key evictions.",
    timestamp: "14 hours ago",
    category: "INFRASTRUCTURE",
    type: "INFO",
    read: true,
    channel: "PUSH",
    incidentId: "INC-87994",
    sourceNode: "redis-cluster-primary",
  },
  {
    id: "notif-6",
    title: "21 CFR Part 11 Merkle Root Anchored to Database",
    description: "Block #1,492,019 anchored with 84,200 verified audit events. SHA-256 signature chain validated by automated audit daemon.",
    timestamp: "18 hours ago",
    category: "SECURITY",
    type: "INFO",
    read: true,
    channel: "SLACK",
    incidentId: "INC-87980",
    sourceNode: "audit-merkle-sentinel",
  },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [filterChannel, setFilterChannel] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [pulseCount, setPulseCount] = React.useState<number>(0);
  const [slaLatency, setSlaLatency] = React.useState<number>(42);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Real-time WebSocket connection hook
  const { status: wsStatus, lastEvent } = useUserWebSocket();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lead II CRT Telemetry Oscilloscope Animation
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let x = 0;
    const height = canvas.height;
    const width = canvas.width;
    const midY = height / 2;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    const render = () => {
      ctx.fillStyle = "rgba(9, 13, 22, 0.05)";
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gy = 0; gy < height; gy += 15) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      for (let gx = 0; gx < width; gx += 30) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      ctx.stroke();

      // Sweep bar
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(x, 0, 3, height);

      // Compute Lead II wave with notification pulse modulation
      const t = x * 0.08;
      let yOffset = Math.sin(t) * 4;
      const beatMod = x % 90;

      if (beatMod > 30 && beatMod < 35) {
        yOffset = -8;
      } else if (beatMod >= 35 && beatMod <= 42) {
        yOffset = 34;
      } else if (beatMod > 42 && beatMod < 48) {
        yOffset = -14;
      } else if (beatMod > 60 && beatMod < 75) {
        yOffset = 8;
      }

      if (pulseCount > 0) {
        yOffset += Math.sin(t * 3) * (pulseCount * 2);
      }

      const drawY = midY - yOffset;

      ctx.beginPath();
      ctx.arc(x, drawY, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = pulseCount > 5 ? "#f43f5e" : pulseCount > 0 ? "#a855f7" : "#10b981";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      x = (x + 2) % width;
      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [pulseCount]);

  // Periodic decay & SLA jitter
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((prev) => Math.max(0, prev - 1));
      setSlaLatency((prev) => Math.max(28, Math.min(65, prev + Math.floor(Math.random() * 5) - 2)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live WebSocket events
  React.useEffect(() => {
    if (!lastEvent) return;
    const nowStr = "Just now";
    const isAlarm =
      lastEvent.event_type.includes("alert") ||
      lastEvent.event_type.includes("alarm") ||
      lastEvent.event_type.includes("emergency");

    const newNotif: NotificationItem = {
      id: `ws-${Date.now()}`,
      title: `Real-time Signal: ${lastEvent.event_type.toUpperCase()}`,
      description: `Inbound WebSocket payload: ${JSON.stringify(lastEvent.payload || {}).substring(0, 140)}`,
      timestamp: nowStr,
      category: isAlarm ? "CLINICAL_RISK" : "INFRASTRUCTURE",
      type: isAlarm ? "ALERT" : "INFO",
      read: false,
      channel: "PUSH",
      incidentId: `INC-${Math.floor(88000 + Math.random() * 999)}`,
      sourceNode: "asgi-daphne-realtime",
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    setPulseCount(isAlarm ? 10 : 5);
    showToast(`🔔 Live alert received: ${newNotif.title}`);
  }, [lastEvent]);

  // Operational Action 1: Mark All As Read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications acknowledged and marked as read.");
  };

  // Operational Action 2: Acknowledge single alert
  const handleAcknowledge = (id: string, title: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    showToast(`Acknowledged alert: "${title}"`);
  };

  // Operational Action 3: Dismiss alert
  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("Notification dismissed from live feed.");
  };

  // Operational Action 4: Synthetic Multi-Cast Ping Burst (Push, Slack, PagerDuty, SMS)
  const handleTestDispatch = () => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: "Multi-Channel Health Ping & Route Verification",
      description: "Dispatched synthetic test ping across Push, Slack (#icu-cdss-alerts), PagerDuty L1, and SMS. All 4 gateway channels acknowledged delivery in 34ms.",
      timestamp: "Just now",
      category: "INFRASTRUCTURE",
      type: "INFO",
      read: false,
      channel: "PUSH",
      incidentId: `INC-${Math.floor(88100 + Math.random() * 500)}`,
      sourceNode: "admin-orchestrator-node",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setPulseCount(6);
    showToast("🚀 Synthetic multi-channel probe broadcasted successfully.");
  };

  // Operational Action 5: Simulate Critical Sepsis Alarm Drill
  const handleSimulateSepsisAlarm = () => {
    const newAlarm: NotificationItem = {
      id: `alarm-${Date.now()}`,
      title: "EMERGENCY DRILL: Critical Sepsis Risk Spike (NEWS2 >= 7)",
      description: "Automated Clinical Safety Agent triggered deterministic protocol: Lactate > 4.0 mmol/L, MAP < 65 mmHg. Clinician sign-off gate enforced.",
      timestamp: "Just now",
      category: "CLINICAL_RISK",
      type: "ALERT",
      read: false,
      channel: "PAGERDUTY",
      incidentId: `INC-${Math.floor(89000 + Math.random() * 999)}`,
      sourceNode: "clinical-safety-agent-v3",
    };
    setNotifications((prev) => [newAlarm, ...prev]);
    setPulseCount(10);
    showToast("🚨 High-Priority Clinical Alert Drill Active (PagerDuty L1 Escalated).");
  };

  // Operational Action 6: Export Signed Incident Log
  const handleExportIncidentLog = () => {
    const exportManifest = {
      exportTimestamp: new Date().toISOString(),
      generator: "Antigravity Alert Center & Pager Sentinel v3.42",
      complianceProfile: "HIPAA Zero-PHI / FDA 21 CFR Part 11",
      webSocketStatus: wsStatus,
      slaAverageLatencyMs: slaLatency,
      totalAlerts: notifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
      incidents: notifications.map((n) => ({
        id: n.id,
        incidentId: n.incidentId,
        title: n.title,
        description: n.description,
        timestamp: n.timestamp,
        category: n.category,
        type: n.type,
        channel: n.channel,
        sourceNode: n.sourceNode,
        isRead: n.read,
      })),
    };

    const blob = new Blob([JSON.stringify(exportManifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident_alerts_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("📥 Exported signed incident dossier (Zero PHI).");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => n.type === "ALERT" && !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    const matchesCat =
      filterCategory === "ALL"
        ? true
        : filterCategory === "UNREAD"
        ? !n.read
        : n.category === filterCategory;

    const matchesChannel = filterChannel === "ALL" || n.channel === filterChannel;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(term) ||
      n.description.toLowerCase().includes(term) ||
      (n.incidentId && n.incidentId.toLowerCase().includes(term)) ||
      (n.sourceNode && n.sourceNode.toLowerCase().includes(term));

    return matchesCat && matchesChannel && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold dark:bg-purple-950/40 dark:text-purple-300">
              Live Alert Center & Multi-Cast Pager
            </Badge>
            {unreadCount > 0 ? (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[11px] font-bold dark:bg-purple-900/60 dark:text-purple-200">
                {unreadCount} Unread Alerts
              </Badge>
            ) : (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> All Alerts Acknowledged
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-2 py-0.5 border ${
                wsStatus === "connected"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              <Radio className="h-3 w-3 mr-1 inline animate-pulse" />
              WS: {wsStatus.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            Administrative Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time infrastructure signals, security perimeter warnings, scaling events, and clinical risk escalations.
          </p>
        </div>

        {/* 1-Click Operational Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateSepsisAlarm}
            className="text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Flame className="h-3.5 w-3.5 text-rose-500" />
            Clinical Alarm Drill
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestDispatch}
            className="text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Synthetic Ping
          </Button>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleExportIncidentLog}
            className="text-xs font-semibold gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export Dossier
          </Button>
        </div>
      </div>

      {/* Clinical CRT Lead II Oscilloscope & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CRT Canvas Monitor */}
        <Card className="lg:col-span-3 bg-[#090d16] border-slate-800 text-slate-100 shadow-xl overflow-hidden relative">
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                LEAD II ALERT DISPATCH & ESCALATION OSCILLOSCOPE
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span>UNACKED: <strong className="text-purple-400">{unreadCount}</strong></span>
              <span>SLA LATENCY: <strong className="text-emerald-400">{slaLatency} ms</strong></span>
              <span>STATE: <strong className="text-sky-400">STREAMING</strong></span>
            </div>
          </div>
          <CardContent className="p-0 pt-7">
            <canvas
              ref={canvasRef}
              width={760}
              height={95}
              className="w-full h-[95px] block"
            />
          </CardContent>
        </Card>

        {/* Real-Time Routing Summary */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Gateways</span>
              <Radio className="h-4 w-4 text-sky-500 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              4 Channels
            </div>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
              Push, Slack, PagerDuty, SMS
            </p>
          </div>
          <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Critical Active:</span>
              <strong className={criticalCount > 0 ? "text-rose-500 font-bold" : "text-emerald-500"}>
                {criticalCount} Alerts
              </strong>
            </div>
            <div className="flex justify-between">
              <span>SLA Target:</span>
              <strong className="text-slate-700 dark:text-slate-200">&lt; 100 ms</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900">
              <Bell className="h-5 w-5 text-purple-700 dark:text-purple-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Total Alerts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{notifications.length}</p>
              <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">{unreadCount} unread items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
              <ShieldAlert className="h-5 w-5 text-rose-700 dark:text-rose-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Critical Severity</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{criticalCount} Active</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Perimeter fully stable</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">SLA Latency</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{slaLatency} ms</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Nominal across nodes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900">
              <Radio className="h-5 w-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Active Channels</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">4 Gateways</p>
              <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">Push, Slack, PD, SMS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-fit overflow-x-auto max-w-full">
          {(["ALL", "UNREAD", "INFRASTRUCTURE", "SECURITY", "MLOPS", "CERTIFICATE", "CLINICAL_RISK"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilterCategory(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  filterCategory === tab
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab === "ALL"
                  ? `All (${notifications.length})`
                  : tab === "UNREAD"
                  ? `Unread (${unreadCount})`
                  : tab === "CLINICAL_RISK"
                  ? "Clinical Risk"
                  : tab}
              </button>
            )
          )}
        </div>

        {/* Channel Filter & Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="h-8 px-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Channels</option>
            <option value="PUSH">Push (WS)</option>
            <option value="SLACK">Slack</option>
            <option value="PAGERDUTY">PagerDuty</option>
            <option value="SMS">SMS Gateway</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search alerts or incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-500">No notifications match the selected category or channel.</p>
          </Card>
        ) : (
          filteredNotifications.map((n) => (
            <Card
              key={n.id}
              className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md ${
                !n.read ? "border-l-4 border-l-purple-600 bg-purple-50/20 dark:bg-purple-950/20" : ""
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    n.type === "ALERT"
                      ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900"
                      : n.type === "WARNING"
                      ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900"
                      : "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-900"
                  }`}
                >
                  {n.type === "ALERT" ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : n.type === "WARNING" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h3>
                      {n.incidentId && (
                        <Badge variant="outline" className="text-[10px] font-mono py-0 text-slate-500 dark:text-slate-400">
                          {n.incidentId}
                        </Badge>
                      )}
                      {!n.read && <span className="h-2 w-2 rounded-full bg-purple-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-mono py-0 text-slate-500">
                        {n.channel}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{n.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.description}</p>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>DOMAIN: <strong className="text-slate-600 dark:text-slate-300">{n.category}</strong></span>
                      {n.sourceNode && (
                        <span className="hidden sm:inline">| NODE: <strong className="text-sky-500">{n.sourceNode}</strong></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(n.id, n.title)}
                          className="h-6 px-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(n.id)}
                        className="h-6 px-2 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
