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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: "INFRASTRUCTURE" | "SECURITY" | "MLOPS" | "CERTIFICATE";
  type: "ALERT" | "INFO" | "WARNING";
  read: boolean;
  channel: "PUSH" | "SLACK" | "PAGERDUTY" | "SMS";
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
  },
  {
    id: "notif-6",
    title: "21 CFR Part 11 Merkle Root Anchored to Blockchain",
    description: "Block #1,492,019 anchored with 84,200 verified audit events. SHA-256 signature chain validated by automated audit daemon.",
    timestamp: "18 hours ago",
    category: "SECURITY",
    type: "INFO",
    read: true,
    channel: "SLACK",
  },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filterType, setFilterType] = React.useState<string>("ALL");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications marked as read.");
  };

  const handleAcknowledge = (id: string, title: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    showToast(`Acknowledged alert: "${title}"`);
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("Notification dismissed.");
  };

  const handleTestDispatch = () => {
    const newNotif: NotificationItem = {
      id: `notif-${Math.random().toString(36).substring(2, 7)}`,
      title: "Manual Infrastructure Health Probe Test",
      description: "Dispatched synthetic test ping across all channel layers (Push, Slack, SMS). All delivery endpoints acknowledged receipt.",
      timestamp: "Just now",
      category: "INFRASTRUCTURE",
      type: "INFO",
      read: false,
      channel: "PUSH",
    };
    setNotifications([newNotif, ...notifications]);
    showToast("Test notification dispatched to alert center.");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "ALL") return true;
    if (filterType === "UNREAD") return !n.read;
    return n.category === filterType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              Live Alert Center & Pager Routing
            </Badge>
            {unreadCount > 0 ? (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[11px] font-bold">
                {unreadCount} Unread Notifications
              </Badge>
            ) : (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All Alerts Caught Up
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-purple-600" />
            Administrative Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time infrastructure signals, security perimeter warnings, scaling events, and compliance milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestDispatch}
            className="text-xs font-semibold gap-1.5 border-slate-200"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Test Dispatch
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Bell className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Total Alerts</p>
              <p className="text-xl font-bold text-slate-900">{notifications.length}</p>
              <p className="text-[11px] text-purple-700 font-medium">{unreadCount} unread items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
              <ShieldAlert className="h-5 w-5 text-rose-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Critical Severity</p>
              <p className="text-xl font-bold text-slate-900">0 Active</p>
              <p className="text-[11px] text-emerald-700 font-medium">Perimeter fully stable</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">SLA Latency</p>
              <p className="text-xl font-bold text-slate-900">48 ms</p>
              <p className="text-[11px] text-emerald-700 font-medium">Nominal across nodes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Radio className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Active Pagers</p>
              <p className="text-xl font-bold text-slate-900">4 Channels</p>
              <p className="text-[11px] text-sky-700 font-medium">Push, Slack, PagerDuty, SMS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit overflow-x-auto max-w-full">
        {(["ALL", "UNREAD", "INFRASTRUCTURE", "SECURITY", "MLOPS", "CERTIFICATE"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              filterType === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab === "ALL" ? `All (${notifications.length})` : tab === "UNREAD" ? `Unread (${unreadCount})` : tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-white border-slate-200 p-8 text-center">
            <p className="text-xs text-slate-500">No notifications match the selected category.</p>
          </Card>
        ) : (
          filteredNotifications.map((n) => (
            <Card
              key={n.id}
              className={`bg-white border-slate-200 shadow-sm transition-all hover:shadow-md ${
                !n.read ? "border-l-4 border-l-purple-600 bg-purple-50/20" : ""
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    n.type === "ALERT"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : n.type === "WARNING"
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "bg-purple-50 text-purple-700 border border-purple-200"
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-purple-600 shrink-0" />
                      )}
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

                  <p className="text-xs text-slate-600 leading-relaxed">{n.description}</p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Domain: {n.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(n.id, n.title)}
                          className="h-6 px-2 text-[11px] font-semibold text-purple-700 hover:bg-purple-50"
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(n.id)}
                        className="h-6 px-2 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
