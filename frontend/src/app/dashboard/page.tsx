"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  HeartPulse,
  Plus,
  Radio,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PredictionActivityChart, RiskDistributionChart } from "@/components/ui/chart";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useAuthStore } from "@/features/auth/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    stats,
    patients,
    predictions,
    notifications,
    activityTimeline,
    models,
    handleWebSocketPrediction,
  } = useClinicalStore();

  const activeModel = models.find((m) => m.status === "ACTIVE") || models[0];

  // Quick helper to simulate a real-time WebSocket telemetry packet
  const handleSimulateInboundTelemetry = () => {
    const randomRiskLevels: Array<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];
    const pickedRisk = randomRiskLevels[Math.floor(Math.random() * randomRiskLevels.length)];
    const probability =
      pickedRisk === "CRITICAL"
        ? 0.88 + Math.random() * 0.08
        : pickedRisk === "HIGH"
        ? 0.7 + Math.random() * 0.12
        : pickedRisk === "MEDIUM"
        ? 0.42 + Math.random() * 0.15
        : 0.12 + Math.random() * 0.18;

    const testMRN = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
    const testNames = ["Sarah Connor", "James Wilson", "Maya Lin", "Arthur Pendelton", "Fatima Zahra"];
    const pickedName = testNames[Math.floor(Math.random() * testNames.length)];

    handleWebSocketPrediction({
      prediction_id: `pred-live-${Date.now()}`,
      patient_mrn: testMRN,
      patient_name: pickedName,
      risk_level: pickedRisk,
      probability: Math.round(probability * 1000) / 1000,
      model_name: activeModel.name,
      timestamp: new Date().toLocaleTimeString(),
      chief_complaint: "Simulated Telemetry Heart Monitor Signal",
    });
  };

  const riskDistributionData = [
    { risk: "Low", count: stats.lowRiskCount, color: "#10b981" },
    { risk: "Medium", count: stats.mediumRiskCount, color: "#f59e0b" },
    { risk: "High", count: stats.highRiskCount, color: "#f97316" },
    { risk: "Critical", count: stats.criticalRiskCount, color: "#f43f5e" },
  ];

  return (
    <Shell>
      <div className="space-y-6">
        {/* Welcome Header & Action Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Clinical Decision Center
              </h1>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                Real-Time Telemetry
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Clinician: <span className="text-slate-800 font-semibold">{user?.full_name || "Dr. Elena Vance, MD"}</span> •{" "}
              {user?.department || "Cardiology"} • Workstation Online
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live simulation button for instantaneous evaluation without waiting */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateInboundTelemetry}
              className="text-xs gap-1.5 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50"
              title="Test real-time WebSocket ingestion without refreshing page"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
              <span>Simulate Inbound Event</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/predictions/new")}
              className="text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Risk Assessment</span>
            </Button>
          </div>
        </div>

        {/* Top Metric Cards: Total Patients, Low, Medium, High, Critical */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Patients */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total Patients</span>
                <Users className="h-4 w-4 text-slate-400" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {stats.totalPatients}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span>Active Hospital Census</span>
              </div>
            </CardContent>
          </Card>

          {/* Low Risk */}
          <Card className="bg-emerald-50/40 border-emerald-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Low Risk</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-700">
                {stats.lowRiskCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-emerald-800/80 font-medium">Normal hemodynamic state</p>
            </CardContent>
          </Card>

          {/* Medium Risk */}
          <Card className="bg-amber-50/40 border-amber-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-semibold text-amber-800">
                <span>Medium Risk</span>
                <Activity className="h-4 w-4 text-amber-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700">
                {stats.mediumRiskCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-amber-800/80 font-medium">Standard observation tier</p>
            </CardContent>
          </Card>

          {/* High Risk */}
          <Card className="bg-orange-50/40 border-orange-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-semibold text-orange-800">
                <span>High Risk</span>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-700">
                {stats.highRiskCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-orange-800/80 font-medium">Close telemetry monitoring</p>
            </CardContent>
          </Card>

          {/* Critical Risk */}
          <Card className="bg-rose-50/60 border-rose-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span>Critical Risk</span>
                <AlertCircle className="h-4 w-4 text-rose-600 animate-pulse" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-rose-700">
                {stats.criticalRiskCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>Stat Bedside Review</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section: Prediction Activity Timeline & Risk Distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Prediction Activity Chart (2 Columns) */}
          <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Real-Time Prediction Activity
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Inference volume and critical telemetry alerts by hour.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono bg-slate-50 text-slate-600 border-slate-200">
                LIVE TELEMETRY
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <PredictionActivityChart data={activityTimeline} />
            </CardContent>
          </Card>

          {/* Risk Distribution Bar Chart (1 Column) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Risk Stratification
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Patient population breakdown by risk tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <RiskDistributionChart data={riskDistributionData} />
            </CardContent>
          </Card>
        </div>

        {/* Lower Grid: Recent Predictions Table & Side Panels */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Predictions Live Feed (2 Columns) */}
          <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-emerald-600" />
                  Recent Risk Predictions
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Streaming predictions feed (updates automatically via WebSockets without page reload).
                </CardDescription>
              </div>
              <Link href="/predictions" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1">
                View all ({predictions.length})
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient / MRN</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.slice(0, 5).map((pred) => (
                    <TableRow key={pred.id}>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {pred.timestamp.split(" ")[1] || pred.timestamp}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{pred.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{pred.patient_mrn}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pred.risk_level === "CRITICAL"
                              ? "critical"
                              : pred.risk_level === "HIGH"
                              ? "high"
                              : pred.risk_level === "MEDIUM"
                              ? "medium"
                              : "low"
                          }
                        >
                          {pred.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-slate-800">
                        {(pred.probability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {pred.model_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/predictions/${pred.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                            Explain XAI
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right Side Column: Active Model Metadata & Recent Alerts */}
          <div className="space-y-6">
            {/* Active Model Information */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-purple-600" />
                    Model Metadata
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">
                    ACTIVE
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Primary production ML algorithm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs pt-4">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Model Name:</span>
                  <span className="font-bold text-slate-900">{activeModel.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Architecture:</span>
                  <span className="text-slate-800 font-mono font-medium">{activeModel.algorithm}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Accuracy (ROC-AUC):</span>
                  <span className="text-emerald-700 font-mono font-bold">
                    {(activeModel.roc_auc * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Mean Inference Latency:</span>
                  <span className="text-slate-800 font-mono font-medium">{activeModel.avg_latency_ms} ms</span>
                </div>
                <div className="pt-2">
                  <Link href="/admin/models">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-200 bg-white hover:bg-slate-50">
                      Manage Model Registry
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts Feed */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Recent Alerts
                  </CardTitle>
                  <Link href="/notifications" className="text-[11px] font-semibold text-slate-500 hover:text-slate-800">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs pt-4">
                {notifications.slice(0, 3).map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold text-[11px] ${
                          n.severity === "CRITICAL"
                            ? "text-rose-600"
                            : n.severity === "WARNING"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{n.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
