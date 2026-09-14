"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Info,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InformaticistNotification {
  id: string;
  title: string;
  message: string;
  category: "DRIFT" | "MODEL" | "DATA_QUALITY" | "REGULATORY";
  severity: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const DEFAULT_INFORMATICS_NOTIFICATIONS: InformaticistNotification[] = [
  {
    id: "notif-01",
    title: "Feature Distribution Shift Warning: Lactic Acid",
    message: "Serum lactic acid PSI reached 0.068 (approaching 0.10 warning threshold). Cohort mean increased from 1.45 to 1.58 mmol/L over last 72 hours.",
    category: "DRIFT",
    severity: "WARNING",
    timestamp: "18 mins ago",
    read: false,
    actionUrl: "/informaticist/drift",
    actionLabel: "Inspect Drift Distribution",
  },
  {
    id: "notif-02",
    title: "Champion Model Benchmark Verified: 98.5% ROC-AUC",
    message: "Automated Prompt 18 empirical test suite completed on RandomForestClassifier v1.0.0. Calibrated Brier score maintained at 0.0027 with 0.136ms latency.",
    category: "MODEL",
    severity: "SUCCESS",
    timestamp: "1 hour ago",
    read: false,
    actionUrl: "/informaticist/models",
    actionLabel: "View Registry Benchmark",
  },
  {
    id: "notif-03",
    title: "Quarterly SaMD Dossier Compiled & Signed",
    message: "Q3-2026 21 CFR Part 11 regulatory compliance packet (PDF, 4.8MB) has finished compiling with cryptographic Merkle verification.",
    category: "REGULATORY",
    severity: "INFO",
    timestamp: "3 hours ago",
    read: false,
    actionUrl: "/informaticist/reports",
    actionLabel: "Download SaMD Dossier",
  },
  {
    id: "notif-04",
    title: "Physiological Clamping Event: SBP 310 mmHg",
    message: "Incoming telemetry on patient MRN-90241 exceeded 3σ boundary. Value clamped to safe clinical ceiling (240 mmHg) and flagged for sensor check.",
    category: "DATA_QUALITY",
    severity: "INFO",
    timestamp: "5 hours ago",
    read: true,
    actionUrl: "/informaticist/data-quality",
    actionLabel: "View Quarantine Log",
  },
  {
    id: "notif-05",
    title: "Shadow Candidate Evaluated: XGBoost-SepsisEarly",
    message: "Candidate v1.2.0 processed 1,200 shadow encounters. Achieved 97.2% ROC-AUC. Ready for Lead Informaticist promotion review.",
    category: "MODEL",
    severity: "SUCCESS",
    timestamp: "Yesterday",
    read: true,
    actionUrl: "/informaticist/models",
    actionLabel: "Compare with Champion",
  },
  {
    id: "notif-06",
    title: "AI Safety Suite: 0.0% Hallucinations on 200 Tests",
    message: "Continuous stress test suite verified 100% adherence to Surviving Sepsis Campaign SSC-2021 guidelines with zero prompt injection bypasses.",
    category: "REGULATORY",
    severity: "SUCCESS",
    timestamp: "2 days ago",
    read: true,
    actionUrl: "/informaticist/ai-evaluation",
    actionLabel: "View Safety Benchmark",
  },
];

export default function InformaticistNotificationsPage() {
  const [notifications, setNotifications] = React.useState<InformaticistNotification[]>(DEFAULT_INFORMATICS_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("ALL");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setToastMessage("All alerts marked as read.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clearRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    setToastMessage("Read notifications cleared.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const markOneAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = notifications.filter(n => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "UNREAD") return !n.read;
    return n.category === selectedFilter;
  });

  const getSeverityBadge = (severity: InformaticistNotification["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">CRITICAL</Badge>;
      case "WARNING":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">WARNING</Badge>;
      case "SUCCESS":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">HEALTHY</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">INFO</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Informatics Telemetry Alerts</h1>
            {unreadCount > 0 ? (
              <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-xs">
                {unreadCount} Unread Alerts
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                All Caught Up
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications for population drift warnings, model benchmark sweeps, and data pipeline anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="text-xs h-8 border-slate-200"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark All Read
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={clearRead}
            className="text-xs h-8 border-slate-200 text-slate-600 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear Read
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {toastMessage}
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: `All Alerts (${notifications.length})` },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "DRIFT", label: "Drift Telemetry" },
          { key: "MODEL", label: "Model Registry" },
          { key: "DATA_QUALITY", label: "Data Quality" },
          { key: "REGULATORY", label: "Regulatory & AI Safety" },
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedFilter(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === cat.key
                ? "bg-slate-900 text-white font-semibold"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {filtered.map(item => (
          <Card
            key={item.id}
            className={`bg-white border transition-all ${
              !item.read ? "border-amber-300 ring-1 ring-amber-200/50 shadow-xs" : "border-slate-200"
            }`}
          >
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="mt-1">
                  {!item.read ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    {getSeverityBadge(item.severity)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {item.message}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono pt-1">
                    {item.timestamp}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {item.actionUrl && (
                  <Link href={item.actionUrl}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markOneAsRead(item.id)}
                      className="text-xs h-8 border-slate-200 hover:border-amber-400 hover:text-amber-700"
                    >
                      {item.actionLabel || "Inspect"}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}

                {!item.read && (
                  <button
                    onClick={() => markOneAsRead(item.id)}
                    title="Mark as Read"
                    className="h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
