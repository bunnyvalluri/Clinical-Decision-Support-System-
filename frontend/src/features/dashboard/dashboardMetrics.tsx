"use client";

import { useState } from "react";
import { Activity, AlertTriangle, Users, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { DashboardStatsPayload, WSEvent } from "@/types";

export function DashboardMetrics() {
  const [liveStats, setLiveStats] = useState<DashboardStatsPayload>({
    total_patients: 1284,
    high_risk_cases: 28,
    critical_risk_cases: 4,
    predictions_today: 96,
    avg_latency_ms: 1.25,
    active_model: "Random Forest v1.0.0",
  });
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  const { isConnected, isConnecting } = useWebSocket({
    path: "dashboard/",
    handlers: {
      DASHBOARD_STATS_UPDATED: (data: WSEvent) => {
        const obj = data as Record<string, unknown>;
        const stats = (obj.stats || obj) as Partial<DashboardStatsPayload>;
        setLiveStats((prev) => ({
          ...prev,
          total_patients: stats.total_patients ?? prev.total_patients,
          high_risk_cases: stats.high_risk_cases ?? prev.high_risk_cases,
          critical_risk_cases: stats.critical_risk_cases ?? prev.critical_risk_cases,
          predictions_today: stats.predictions_today ?? prev.predictions_today,
          avg_latency_ms: stats.avg_latency_ms ?? prev.avg_latency_ms,
          active_model: stats.active_model ?? prev.active_model,
        }));
        setLastEventTime(new Date().toLocaleTimeString());
      },
      dashboard_stats_updated: (data: WSEvent) => {
        const obj = data as Record<string, unknown>;
        const stats = (obj.stats || obj) as Partial<DashboardStatsPayload>;
        setLiveStats((prev) => ({
          ...prev,
          total_patients: stats.total_patients ?? prev.total_patients,
          high_risk_cases: stats.high_risk_cases ?? prev.high_risk_cases,
          critical_risk_cases: stats.critical_risk_cases ?? prev.critical_risk_cases,
          predictions_today: stats.predictions_today ?? prev.predictions_today,
          avg_latency_ms: stats.avg_latency_ms ?? prev.avg_latency_ms,
          active_model: stats.active_model ?? prev.active_model,
        }));
        setLastEventTime(new Date().toLocaleTimeString());
      },
      PREDICTION_CREATED: (data: WSEvent) => {
        const pred = (data.payload || data) as Record<string, unknown>;
        const isHigh = pred.risk_level === "HIGH";
        const isCrit = pred.risk_level === "CRITICAL";
        setLiveStats((prev) => ({
          ...prev,
          predictions_today: prev.predictions_today + 1,
          high_risk_cases: isHigh ? prev.high_risk_cases + 1 : prev.high_risk_cases,
          critical_risk_cases: isCrit ? prev.critical_risk_cases + 1 : prev.critical_risk_cases,
        }));
        setLastEventTime(new Date().toLocaleTimeString());
      },
      prediction_created: (data: WSEvent) => {
        const pred = (data.payload || data) as Record<string, unknown>;
        const isHigh = pred.risk_level === "HIGH";
        const isCrit = pred.risk_level === "CRITICAL";
        setLiveStats((prev) => ({
          ...prev,
          predictions_today: prev.predictions_today + 1,
          high_risk_cases: isHigh ? prev.high_risk_cases + 1 : prev.high_risk_cases,
          critical_risk_cases: isCrit ? prev.critical_risk_cases + 1 : prev.critical_risk_cases,
        }));
        setLastEventTime(new Date().toLocaleTimeString());
      },
    },
  });

  const stats = [
    {
      title: "Active Clinical Patients",
      value: liveStats.total_patients.toLocaleString(),
      change: lastEventTime ? `Live sync: ${lastEventTime}` : "+12% this week",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "High Risk Alerts",
      value: (liveStats.high_risk_cases + liveStats.critical_risk_cases).toString(),
      change: `${liveStats.critical_risk_cases} critical flagged`,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "Live ML Assessments",
      value: liveStats.predictions_today.toLocaleString(),
      change: `${liveStats.avg_latency_ms.toFixed(1)}ms inference avg`,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Model Telemetry",
      value: liveStats.active_model.split(" ")[0] || "Ensemble",
      change: isConnected ? "Real-time Redis WS Connected" : "Connecting WS...",
      icon: Database,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Connected
              {lastEventTime && <span className="text-slate-400 ml-1">({lastEventTime})</span>}
            </Badge>
          ) : isConnecting ? (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Connecting to Channels...
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Telemetry Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:border-slate-300 transition-all duration-200 shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
