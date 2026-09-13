"use client";

import { Activity, AlertTriangle, Users, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardMetrics() {
  const stats = [
    {
      title: "Active Clinical Patients",
      value: "1,284",
      change: "+12% this week",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "High Risk Alerts",
      value: "28",
      change: "4 critical cases flagged",
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      title: "Live ML Predictions",
      value: "99.4%",
      change: "Ensemble AUC-ROC",
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Cloud Infrastructure",
      value: "Neon + Upstash",
      change: "Ohio us-east-2 / TLS",
      icon: Database,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="hover:border-zinc-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-zinc-100">
                {stat.value}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
