"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "ALERT" | "INFO" | "WARNING";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Database Connection Pool Scale-Up",
    description: "Neon compute scaled up to 2 CU to absorb morning clinician login rush.",
    timestamp: "12 minutes ago",
    type: "INFO",
    read: false,
  },
  {
    id: "notif-2",
    title: "SSL/TLS Certificate Renewal Notice",
    description: "Wildcard certificate for *.hospital.org valid for next 68 days.",
    timestamp: "1 hour ago",
    type: "INFO",
    read: false,
  },
  {
    id: "notif-3",
    title: "Celery Worker Queue Latency Spike",
    description: "PDF batch compilation queue peaked at 14 pending jobs before returning to nominal.",
    timestamp: "3 hours ago",
    type: "WARNING",
    read: true,
  },
  {
    id: "notif-4",
    title: "Multiple Failed Login Warning",
    description: "5 failed attempts from IP 192.168.1.104; automated throttling applied.",
    timestamp: "5 hours ago",
    type: "ALERT",
    read: true,
  },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-slate-800" />
            Administrative Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System infrastructure alerts, failover signals, and operational maintenance updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-slate-200"
          >
            <CheckCheck className="h-3.5 w-3.5 text-slate-600" /> Mark All as Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`bg-white border-slate-200 shadow-sm transition-all ${
              !n.read ? "border-l-4 border-l-slate-800 bg-slate-50/50" : ""
            }`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  n.type === "ALERT"
                    ? "bg-rose-50 text-rose-600"
                    : n.type === "WARNING"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {n.type === "ALERT" ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : n.type === "WARNING" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{n.timestamp}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
