"use client";

import { Navbar } from "@/components/common/navbar";
import { DashboardMetrics } from "@/features/dashboard/dashboardMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  HeartPulse,
  PlusCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/60 to-zinc-950 p-6 sm:p-8 backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>BPY-CSE-2666 Clinical Decision Support System</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Patient Risk Level Prediction
              </h1>
              <p className="text-sm sm:text-base text-zinc-400">
                Real-time, intelligent clinical risk assessment powered by ensemble machine learning,
                Neon Serverless PostgreSQL, and Upstash Redis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default" className="gap-2 shadow-lg shadow-emerald-950">
                <PlusCircle className="h-4 w-4" />
                New Admission
              </Button>
              <Button variant="outline" className="gap-2">
                <HeartPulse className="h-4 w-4 text-emerald-400" />
                Run Risk Assessment
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-200">
              Clinical Overview
            </h2>
            <Badge variant="outline" className="text-xs">
              Live Telemetry
            </Badge>
          </div>
          <DashboardMetrics />
        </section>

        {/* Architecture & Live Backing Services */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-emerald-400" />
                Live Cloud Backing Services
              </CardTitle>
              <CardDescription>
                Zero-cold-start serverless primitives connected over TLS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Neon PostgreSQL 18.6</p>
                    <p className="text-xs text-zinc-500">
                      ep-divine-credit-a589ua8g • aws-us-east-2
                    </p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Upstash Serverless Redis</p>
                    <p className="text-xs text-zinc-500">
                      stirring-racer-156393 • TLS Channel Layer
                    </p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Django 5 + Channels ASGI</p>
                    <p className="text-xs text-zinc-500">
                      Health probes: /api/v1/health/ & /ready/
                    </p>
                  </div>
                </div>
                <Badge variant="success">Ready (200 OK)</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                Active Clinical Roles & RBAC
              </CardTitle>
              <CardDescription>
                Strict role-based segregation of patient sensitive data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Physicians & Cardiologists</p>
                  <p className="text-xs text-zinc-500">Full EHR read/write, ML risk predictions, clinical overrides</p>
                </div>
                <Badge variant="secondary">DOCTOR</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Nursing & Triage Staff</p>
                  <p className="text-xs text-zinc-500">Patient admission, vitals recording, real-time alert triage</p>
                </div>
                <Badge variant="secondary">NURSE</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Hospital Administration</p>
                  <p className="text-xs text-zinc-500">HIPAA audit review, staff provisioning, system configuration</p>
                </div>
                <Badge variant="secondary">ADMIN</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
