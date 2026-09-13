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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-01",
    title: "AI Health Risk Assessment Completed",
    description: "Your recent assessment has been processed. Estimated risk probability: 42.0% (Moderate).",
    category: "ASSESSMENT",
    timestamp: "10 minutes ago",
    read: false,
    href: "/user/predictions",
  },
  {
    id: "notif-02",
    title: "Upcoming Appointment Reminder",
    description: "You have an outpatient consultation with Dr. Elena Vance scheduled for Wednesday at 10:30 AM.",
    category: "APPOINTMENT",
    timestamp: "2 hours ago",
    read: false,
    href: "/user/appointments",
  },
  {
    id: "notif-03",
    title: "New Care Team Message",
    description: "Dr. Elena Vance sent a message regarding your latest 30-day vitals trends.",
    category: "MESSAGE",
    timestamp: "Yesterday",
    read: true,
    href: "/user/messages",
  },
];

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useUserWebSocket((evt) => {
    if (evt.event_type === "user.notification.created") {
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: evt.payload?.title || "Clinical Alert",
        description: evt.payload?.message || "New notification from your care team.",
        category: "CLINICAL",
        timestamp: "Just now",
        read: false,
        href: evt.payload?.action_url || "/user/dashboard",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-teal-600" />
            Patient Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time clinical alerts, assessment updates, and appointment reminders.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="text-xs gap-1.5 border-slate-200"
          >
            <CheckCheck className="h-3.5 w-3.5 text-slate-600" /> Mark All as Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Link key={n.id} href={n.href} className="block">
            <Card
              className={`bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all ${
                !n.read ? "border-l-4 border-l-teal-600 bg-teal-50/20" : ""
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    n.category === "ASSESSMENT"
                      ? "bg-teal-50 text-teal-700"
                      : n.category === "APPOINTMENT"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {n.category === "ASSESSMENT" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : n.category === "APPOINTMENT" ? (
                    <Calendar className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" /> {n.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.description}</p>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 self-center" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
