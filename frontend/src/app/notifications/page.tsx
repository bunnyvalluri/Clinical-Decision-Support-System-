"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  Radio,
  Trash2,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/emptyState";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadAlertsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useClinicalStore();

  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");

  const filteredNotifications = notifications.filter((n) => {
    if (severityFilter === "ALL") return true;
    return n.severity === severityFilter;
  });

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-emerald-600" />
              Clinical Alerts & Notifications Inbox
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time telemetry event stream, critical threshold triggers, and Celery background task updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsAsRead}
              className="text-xs gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              Mark All Read
            </Button>
            <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 shadow-sm">
              <Radio className="h-3 w-3 mr-1 text-emerald-600 animate-pulse" />
              Live WS Active
            </Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {["ALL", "CRITICAL", "WARNING", "INFO"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSeverityFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                severityFilter === tab
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab === "ALL"
                ? `All Alerts (${notifications.length})`
                : `${tab} (${notifications.filter((n) => n.severity === tab).length})`}
            </button>
          ))}
        </div>

        {/* Notifications Stream Card */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-8 w-8 text-slate-400" />}
                title="No notifications"
                description="You are completely caught up on all clinical telemetry alerts."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors hover:bg-slate-50 flex items-start justify-between gap-4 ${
                      !notif.read ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 pt-0.5">
                        {notif.severity === "CRITICAL" ? (
                          <AlertCircle className="h-5 w-5 text-rose-600 animate-pulse" />
                        ) : notif.severity === "WARNING" ? (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.patient_mrn && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 mt-1">
                            Patient MRN: {notif.patient_mrn}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {notif.action_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            router.push(notif.action_url!);
                          }}
                          className="h-7 text-xs border-slate-200 hover:bg-slate-50 text-emerald-700 font-semibold"
                        >
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="h-7 text-xs text-slate-500 hover:text-slate-900"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
