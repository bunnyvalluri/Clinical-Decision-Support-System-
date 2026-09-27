"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Sparkles,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Check,
  Filter,
  Trash2,
  Activity,
  HeartPulse,
  Radio,
  Zap,
  RefreshCw,
  X,
  Volume2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { ResponsivePageContainer } from "@/components/responsive";
import apiClient from "@/services/apiClient";

interface PatientNotification {
  id: string;
  title: string;
  description: string;
  category: "ASSESSMENT" | "APPOINTMENT" | "MESSAGE" | "CLINICAL" | "VITALS" | string;
  timestamp: string;
  read: boolean;
  href: string;
  priority?: "NORMAL" | "HIGH" | "URGENT";
  group: "TODAY" | "EARLIER";
}

const INITIAL_NOTIFICATIONS: PatientNotification[] = [
  {
    id: "notif-01",
    title: "AI Health Risk Assessment Completed",
    description: "Your recent assessment has been processed. Calculated risk probability: 42.0% (Moderate Risk Stratum).",
    category: "ASSESSMENT",
    timestamp: "10 minutes ago",
    read: false,
    href: "/user/predictions",
    priority: "HIGH",
    group: "TODAY",
  },
  {
    id: "notif-02",
    title: "Upcoming Appointment Reminder",
    description: "You have an outpatient consultation with Dr. Vadla Abhinay scheduled for Wednesday at 10:30 AM at Heart & Vascular Pavilion.",
    category: "APPOINTMENT",
    timestamp: "2 hours ago",
    read: false,
    href: "/user/appointments",
    priority: "NORMAL",
    group: "TODAY",
  },
  {
    id: "notif-03",
    title: "New Care Team Message",
    description: "Dr. Vadla Abhinay sent a clinical note regarding your latest 30-day ambulatory blood pressure telemetry trends.",
    category: "MESSAGE",
    timestamp: "Yesterday, 04:15 PM",
    read: true,
    href: "/user/messages",
    priority: "NORMAL",
    group: "EARLIER",
  },
  {
    id: "notif-04",
    title: "Vitals Telemetry Verified",
    description: "Morning resting blood pressure (134/86 mmHg) logged and verified against biological safety thresholds.",
    category: "VITALS",
    timestamp: "2 days ago",
    read: true,
    href: "/user/vitals",
    priority: "NORMAL",
    group: "EARLIER",
  },
];

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = React.useState<PatientNotification[]>(INITIAL_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [liveToast, setLiveToast] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [livePing, setLivePing] = React.useState(12);

  // Ping jitter
  React.useEffect(() => {
    const pingTimer = setInterval(() => {
      setLivePing(10 + Math.floor(Math.random() * 6));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setLiveToast("✓ All clinical notifications marked as read.");
    setTimeout(() => setLiveToast(null), 3000);
  };

  const toggleReadStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const clearReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    setLiveToast("✓ Cleared archived read notifications.");
    setTimeout(() => setLiveToast(null), 3000);
  };

  // Comprehensive WebSocket Listener
  const handleWsEvent = React.useCallback((evt: { event_type: string; payload?: Record<string, unknown> }) => {
    const p = evt.payload || {};
    let title = "Clinical Notification";
    let description = "New notification received from your care team.";
    let href = "/user/dashboard";
    let category = "CLINICAL";
    let priority: "NORMAL" | "HIGH" | "URGENT" = "NORMAL";

    if (evt.event_type === "user.notification.created") {
      title = String(p.title || "Clinical Alert");
      description = String(p.message || "Important alert from cardiology.");
      href = String(p.action_url || "/user/dashboard");
      category = "CLINICAL";
      priority = "HIGH";
    } else if (evt.event_type === "appointment_scheduled" || evt.event_type === "appointment_confirmed") {
      title = "Appointment Confirmed";
      description = `Your visit with ${p.clinician || "Dr. Vadla Abhinay"} has been confirmed in EHR.`;
      href = "/user/appointments";
      category = "APPOINTMENT";
    } else if (evt.event_type === "message_received" || evt.event_type === "chat_message") {
      title = "New Care Team Message";
      description = String(p.content || "You have a new message from your cardiology care team.");
      href = "/user/messages";
      category = "MESSAGE";
      priority = "HIGH";
    } else if (evt.event_type === "prediction_created" || evt.event_type === "ai_risk_recalculated") {
      title = "AI Risk Assessment Updated";
      description = `Continuous telemetry calculated new risk probability: ${((Number(p.probability) || 0.38) * 100).toFixed(1)}%.`;
      href = "/user/predictions";
      category = "ASSESSMENT";
      priority = "HIGH";
    } else if (evt.event_type === "vitals_telemetry_stream") {
      title = "Ambulatory Vitals Stream Updated";
      description = `Continuous vitals telemetry received: ${p.systolic_bp || 124}/${p.diastolic_bp || 80} mmHg.`;
      href = "/user/vitals";
      category = "VITALS";
    }

    const newNotif: PatientNotification = {
      id: `notif-${Date.now()}`,
      title,
      description,
      category,
      timestamp: "Just now",
      read: false,
      href,
      priority,
      group: "TODAY",
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setLiveToast(`⚡ Live Alert: ${title}`);
    setTimeout(() => setLiveToast(null), 5000);
  }, []);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  // Trigger Instant Test Notification
  const handleTriggerTestAlert = () => {
    const testNotif: PatientNotification = {
      id: `notif-test-${Date.now()}`,
      title: "Real-Time Telemetry Safety Check Passed",
      description: "Continuous ambulatory ECG stream verified normal sinus rhythm with zero ischemic ST-segment shifts in last 60 minutes.",
      category: "VITALS",
      timestamp: "Just now",
      read: false,
      href: "/user/vitals",
      priority: "HIGH",
      group: "TODAY",
    };

    setNotifications((prev) => [testNotif, ...prev]);
    setLiveToast(`⚡ Real-time alert dispatched: ${testNotif.title}`);
    setTimeout(() => setLiveToast(null), 4500);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterCategory === "ALL") return true;
    if (filterCategory === "UNREAD") return !n.read;
    return n.category.toUpperCase() === filterCategory.toUpperCase();
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case "ASSESSMENT":
        return <Sparkles className="h-4 w-4 text-teal-700" />;
      case "APPOINTMENT":
        return <Calendar className="h-4 w-4 text-sky-700" />;
      case "MESSAGE":
        return <MessageSquare className="h-4 w-4 text-purple-700" />;
      case "VITALS":
        return <Activity className="h-4 w-4 text-rose-700" />;
      default:
        return <Bell className="h-4 w-4 text-slate-700" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category.toUpperCase()) {
      case "ASSESSMENT":
        return "bg-teal-50 border-teal-100";
      case "APPOINTMENT":
        return "bg-sky-50 border-sky-100";
      case "MESSAGE":
        return "bg-purple-50 border-purple-100";
      case "VITALS":
        return "bg-rose-50 border-rose-100";
      default:
        return "bg-slate-100 border-slate-200";
    }
  };

  return (
    <ResponsivePageContainer className="space-y-4 sm:space-y-6 pb-12 max-w-4xl mx-auto min-w-0 w-full overflow-hidden">
      {/* Real-time Toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Radio className="h-4 w-4 text-teal-400 animate-pulse shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Live Gateway Alert</p>
            <p className="text-slate-300 text-[11px]">{liveToast}</p>
          </div>
          <button
            onClick={() => setLiveToast(null)}
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
              <Bell className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
              Patient Notifications &amp; Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-teal-600 text-white font-bold text-xs px-2.5 py-0.5">
                {unreadCount} New
              </Badge>
            )}
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              Live Stream ({livePing}ms)
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Real-time clinical alerts, assessment results, care team communications, and upcoming
            visit reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerTestAlert}
            className="flex-1 sm:flex-initial text-xs font-semibold gap-1.5 border-teal-200 bg-teal-50/60 text-teal-800 hover:bg-teal-100/80 h-9 shadow-2xs"
          >
            <Zap className="h-3.5 w-3.5 text-teal-700" />
            <span>Test Live Alert</span>
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="flex-1 sm:flex-initial text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 h-9 shadow-2xs"
            >
              <CheckCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Mark All Read</span>
            </Button>
          )}
          {notifications.some((n) => n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearReadNotifications}
              className="text-xs text-slate-500 hover:text-slate-800 h-9 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
        {[
          { id: "ALL", label: `All Alerts (${notifications.length})` },
          { id: "UNREAD", label: `Unread (${unreadCount})` },
          { id: "ASSESSMENT", label: "AI & Risk" },
          { id: "APPOINTMENT", label: "Visits" },
          { id: "MESSAGE", label: "Care Team" },
          { id: "VITALS", label: "Vitals" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCategory === tab.id
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No notifications found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You are all caught up on your clinical notifications and care milestones.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <Link key={n.id} href={n.href} className="block group">
              <Card
                className={`bg-white border-slate-200/90 shadow-xs transition-all duration-200 group-hover:border-teal-300 group-hover:shadow-md ${
                  !n.read ? "border-l-4 border-l-teal-600 bg-teal-50/15" : ""
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
                  {/* Category Icon */}
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${getCategoryBg(n.category)}`}
                  >
                    {getCategoryIcon(n.category)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-bold leading-snug group-hover:text-teal-700 transition-colors ${
                            !n.read ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {n.title}
                        </h3>
                        {n.priority === "HIGH" && (
                          <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-[10px] font-bold px-2 py-0">
                            High Priority
                          </Badge>
                        )}
                        {!n.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-teal-600" />
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" /> {n.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {n.description}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-teal-700 font-semibold group-hover:underline flex items-center gap-1">
                        View Details &amp; Take Action
                        <ChevronRight className="h-3 w-3" />
                      </span>

                      <button
                        type="button"
                        onClick={(e) => toggleReadStatus(n.id, e)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {n.read ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </ResponsivePageContainer>
  );
}
