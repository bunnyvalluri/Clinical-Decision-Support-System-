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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { ResponsivePageContainer } from "@/components/responsive";

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

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
  };

  useUserWebSocket((evt) => {
    if (evt.event_type === "user.notification.created") {
      const payload = evt.payload;
      const title = typeof payload?.title === "string" ? payload.title : "Clinical Alert";
      const description =
        typeof payload?.message === "string"
          ? payload.message
          : "New notification received from your care team.";
      const href = typeof payload?.action_url === "string" ? payload.action_url : "/user/dashboard";

      const newNotif: PatientNotification = {
        id: `notif-${Date.now()}`,
        title,
        description,
        category: "CLINICAL",
        timestamp: "Just now",
        read: false,
        href,
        priority: "HIGH",
        group: "TODAY",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  });

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
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <Bell className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Patient Notifications &amp; Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-teal-600 text-white font-bold text-xs ml-1 px-2.5 py-0.5">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Real-time clinical alerts, assessment results, care team communications, and upcoming
            visit reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 h-9"
            >
              <CheckCheck className="h-3.5 w-3.5 text-teal-600" />
              Mark All as Read
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
              Clear Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
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
                className={`bg-white border-slate-200/90 shadow-sm transition-all duration-200 group-hover:border-teal-300 group-hover:shadow-md ${
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
