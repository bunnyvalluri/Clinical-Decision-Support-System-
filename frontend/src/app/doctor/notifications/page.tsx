"use client";

import * as React from "react";
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
  Stethoscope,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsivePageContainer } from "@/components/responsive";

type NotifType = "CRITICAL" | "ALERT" | "INFO" | "SUCCESS" | "SYSTEM";
type NotifCategory = "CLINICAL" | "AI_MODEL" | "REVIEW" | "SYSTEM" | "ADMIN";

interface ClinicalNotification {
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
}

const INITIAL_NOTIFICATIONS: ClinicalNotification[] = [
  {
    id: "n-001",
    type: "CRITICAL",
    category: "CLINICAL",
    title: "STAT: Critical Patient Deterioration — ICU Bed 04",
    body: "Patient Arthur Pendleton (MRN-90241) risk score escalated to 88.4%. Nurse Jenkins requests immediate physician review. SBP 178 mmHg, ST Depression 2.4 mm.",
    time: "2 min ago",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    actionLabel: "Review Case",
    actionHref: "/doctor/reviews",
    patientMrn: "MRN-90241",
  },
  {
    id: "n-002",
    type: "ALERT",
    category: "CLINICAL",
    title: "High-Risk Prediction Pending Sign-off",
    body: "Patient Elena Rostova (MRN-84192) scored 73.5% cardiac risk — KDIGO Stage 2 AKI detected. Physician concurrence required before treatment escalation.",
    time: "18 min ago",
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    read: false,
    actionLabel: "Sign Off",
    actionHref: "/doctor/reviews",
    patientMrn: "MRN-84192",
  },
  {
    id: "n-003",
    type: "SUCCESS",
    category: "REVIEW",
    title: "Physician Review Countersigned",
    body: "Your concurrence review for Patient MRN-2291 was successfully recorded and countersigned. Audit trail updated per 21 CFR Part 11.",
    time: "1 hr ago",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    patientMrn: "MRN-2291",
  },
  {
    id: "n-004",
    type: "INFO",
    category: "CLINICAL",
    title: "Clinical Record Updated — New Vitals",
    body: "Patient John Carter's (MRN-78103) record was updated with post-operative vitals. Heart rate normalized to 72 bpm, oxygen saturation 98%.",
    time: "2 hrs ago",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    patientMrn: "MRN-78103",
  },
  {
    id: "n-005",
    type: "ALERT",
    category: "AI_MODEL",
    title: "ML Model Drift Detected — cardiac_risk_v2",
    body: "Informatics reports input distribution drift on the ejection_fraction feature (PSI: 0.32). Model outputs may have reduced calibration. Manual review recommended.",
    time: "3 hrs ago",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    actionLabel: "View Drift Report",
    actionHref: "/doctor/reports",
  },
  {
    id: "n-006",
    type: "SUCCESS",
    category: "REVIEW",
    title: "AHA/ACC Guideline Compliance — 98.1% This Month",
    body: "Your clinical decisions this month achieved 98.1% alignment with SSC-2021 and AHA/ACC guidelines. Outstanding adherence record logged.",
    time: "5 hrs ago",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "n-007",
    type: "INFO",
    category: "AI_MODEL",
    title: "AI Assistant: New Clinical Guidelines Indexed",
    body: "The HealthNova AI knowledge base has been updated with ESC Heart Failure Guidelines 2026. AI Assistant responses now include updated HFrEF treatment pathways.",
    time: "Yesterday",
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
    read: true,
    actionLabel: "Open AI Assistant",
    actionHref: "/doctor/ai-assistant",
  },
  {
    id: "n-008",
    type: "SYSTEM",
    category: "SYSTEM",
    title: "Scheduled Maintenance Window",
    body: "System maintenance: Sunday 02:00–04:00 UTC. HealthNova AI predictions will be temporarily unavailable. Ensure active cases are reviewed prior.",
    time: "Yesterday",
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
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
    border: "border-rose-200",
    unreadBg: "bg-rose-50/40",
    label: "Critical",
    dot: "bg-rose-500",
  },
  ALERT: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    border: "border-amber-200",
    unreadBg: "bg-amber-50/30",
    label: "Alert",
    dot: "bg-amber-500",
  },
  INFO: {
    icon: Info,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    border: "border-blue-200",
    unreadBg: "bg-blue-50/30",
    label: "Info",
    dot: "bg-blue-500",
  },
  SUCCESS: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    border: "border-emerald-200",
    unreadBg: "bg-emerald-50/20",
    label: "Success",
    dot: "bg-emerald-500",
  },
  SYSTEM: {
    icon: Shield,
    iconColor: "text-slate-500",
    iconBg: "bg-slate-100",
    border: "border-slate-200",
    unreadBg: "bg-slate-50/30",
    label: "System",
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

const CATEGORY_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Clinical", value: "CLINICAL" },
  { label: "AI Model", value: "AI_MODEL" },
  { label: "Reviews", value: "REVIEW" },
  { label: "System", value: "SYSTEM" },
];

function NotifCard({
  n,
  onMarkRead,
  onDismiss,
}: {
  n: ClinicalNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[n.type];
  const Icon = cfg.icon;
  const CatIcon = CATEGORY_ICON[n.category];
  return (
    <div
      className={`relative rounded-xl border transition-all group ${
        !n.read
          ? `${cfg.border} ${cfg.unreadBg} hover:shadow-sm`
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      {/* Unread indicator */}
      {!n.read && (
        <span className={`absolute top-4 right-4 h-2 w-2 rounded-full ${cfg.dot}`} />
      )}

      <div className="p-4 flex gap-3">
        {/* Icon */}
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
          <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onMarkRead(n.id)}
              className={`text-left text-sm font-semibold leading-snug hover:underline cursor-pointer ${
                !n.read ? "text-slate-900" : "text-slate-700"
              }`}
            >
              {n.title}
            </button>
            {!n.read && (
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${cfg.iconBg} ${cfg.iconColor} shrink-0`}>
                NEW
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.body}</p>

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {/* Category chip */}
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <CatIcon className="h-3 w-3" />
              {n.category.replace("_", " ")}
            </span>
            {n.patientMrn && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] font-mono text-slate-400">{n.patientMrn}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {n.time}
            </span>

            {/* Action */}
            {n.actionLabel && (
              <a
                href={n.actionHref || "#"}
                onClick={(e) => e.stopPropagation()}
                className={`ml-auto text-[11px] font-semibold flex items-center gap-0.5 ${cfg.iconColor} hover:underline`}
              >
                {n.actionLabel}
                <ChevronRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center focus:opacity-100"
          title="Dismiss"
          aria-label="Dismiss notification"
        >
          <X className="h-3 w-3 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

export default function DoctorNotificationsPage() {
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [referenceTime] = React.useState(() => Date.now());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    const matchCat = categoryFilter === "ALL" || n.category === categoryFilter;
    const matchRead = !showUnreadOnly || !n.read;
    return matchCat && matchRead;
  });

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  // Group by today vs older
  const todayNotifs = filtered.filter((n) => referenceTime - n.timestamp.getTime() < 24 * 60 * 60 * 1000);
  const olderNotifs = filtered.filter((n) => referenceTime - n.timestamp.getTime() >= 24 * 60 * 60 * 1000);

  return (
    <ResponsivePageContainer
      title="Notifications"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} unread clinical alert${unreadCount !== 1 ? "s" : ""} require your attention`
          : "All notifications reviewed — no pending alerts"
      }
      actions={
        unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark All Read
          </Button>
        ) : undefined
      }
    >
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            label: "Unread",
            value: unreadCount,
            icon: Bell,
            bg: unreadCount > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200",
            text: unreadCount > 0 ? "text-rose-700" : "text-slate-600",
            iconBg: unreadCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500",
          },
          {
            label: "Critical Alerts",
            value: notifications.filter((n) => n.type === "CRITICAL" && !n.read).length,
            icon: AlertCircle,
            bg: "bg-rose-50 border-rose-200",
            text: "text-rose-700",
            iconBg: "bg-rose-100 text-rose-600",
          },
          {
            label: "Clinical",
            value: notifications.filter((n) => n.category === "CLINICAL").length,
            icon: HeartPulse,
            bg: "bg-emerald-50 border-emerald-200",
            text: "text-emerald-700",
            iconBg: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "AI / Model",
            value: notifications.filter((n) => n.category === "AI_MODEL").length,
            icon: Bot,
            bg: "bg-purple-50 border-purple-200",
            text: "text-purple-700",
            iconBg: "bg-purple-100 text-purple-600",
          },
        ].map(({ label, value, icon: Icon, bg, text, iconBg }) => (
          <div key={label} className={`rounded-xl border p-3 flex items-center gap-2.5 ${bg}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-lg font-bold leading-none ${text}`}>{value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORY_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                categoryFilter === opt.value
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
            showUnreadOnly
              ? "bg-rose-600 text-white border-rose-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"
          }`}
        >
          <BellOff className="h-3.5 w-3.5" />
          Unread Only
        </button>
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No notifications here</p>
          <p className="text-xs text-slate-400 mt-1">
            {showUnreadOnly ? "No unread notifications." : "Try adjusting your category filter."}
          </p>
          {(categoryFilter !== "ALL" || showUnreadOnly) && (
            <button
              onClick={() => { setCategoryFilter("ALL"); setShowUnreadOnly(false); }}
              className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mx-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {todayNotifs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-500" />
                Today
              </p>
              <div className="space-y-2">
                {todayNotifs.map((n) => (
                  <NotifCard key={n.id} n={n} onMarkRead={markRead} onDismiss={dismiss} />
                ))}
              </div>
            </div>
          )}

          {olderNotifs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Earlier
              </p>
              <div className="space-y-2">
                {olderNotifs.map((n) => (
                  <NotifCard key={n.id} n={n} onMarkRead={markRead} onDismiss={dismiss} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
          Showing {filtered.length} of {notifications.length} notifications
          {notifications.length > filtered.length && " · Dismissed notifications are hidden"}
        </p>
      )}
    </ResponsivePageContainer>
  );
}
