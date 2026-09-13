"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  HeartPulse,
  Lock,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/authStore";

export default function LandingPage() {
  const router = useRouter();
  const { loginAsRole } = useAuthStore();

  const handleQuickDemo = (role: "DOCTOR" | "NURSE" | "ADMIN") => {
    loginAsRole(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm p-0.5">
              <Image
                src="/logo.png"
                alt="PatientRisk Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                PatientRisk
              </span>
              <span className="text-[10px] uppercase font-mono font-semibold text-sky-600 tracking-wider">
                Predict • Prevent • Support
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Clinical Features
            </a>
            <a href="#xai" className="hover:text-slate-900 transition-colors">
              Explainable AI (SHAP)
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">
              Cloud Architecture
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              HIPAA & RBAC
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Clinician Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="text-xs gap-1.5 shadow-sm">
                Launch Portal
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 sm:pt-24 sm:pb-24 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-8">
          <div className="flex justify-center pb-2">
            <div className="relative group">
              <div className="relative flex items-center gap-3.5 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-lg">
                <Image
                  src="/logo.png"
                  alt="PatientRisk Logo"
                  width={52}
                  height={52}
                  className="rounded-xl"
                  priority
                />
                <div className="text-left">
                  <span className="block text-lg font-extrabold tracking-tight text-slate-900 leading-tight">PatientRisk</span>
                  <span className="block text-[11px] font-mono font-bold text-sky-600">Predict • Prevent • Support</span>
                </div>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Next-Generation Intelligent Clinical Decision Support</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Real-Time Clinical <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600">
              Decision Support System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Empowering hospital cardiologists, triage teams, and ICU physicians with instant ensemble
            ML risk assessments, transparent SHAP factor explanations, and zero-page-reload WebSocket telemetry.
          </p>

          {/* Quick 1-Click Persona Demos */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-mono font-semibold">
              Instant 1-Click Clinician Evaluation:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="default"
                onClick={() => handleQuickDemo("DOCTOR")}
                className="gap-2 text-xs shadow-sm"
              >
                <HeartPulse className="h-4 w-4" />
                Sign In as Doctor (Cardiologist)
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleQuickDemo("NURSE")}
                className="gap-2 text-xs border border-slate-200"
              >
                <Activity className="h-4 w-4 text-emerald-600" />
                Sign In as Triage Nurse
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickDemo("ADMIN")}
                className="gap-2 text-xs border-slate-200 bg-white hover:bg-slate-50"
              >
                <Lock className="h-4 w-4 text-slate-600" />
                Sign In as Admin
              </Button>
            </div>
          </div>

          {/* Live Telemetry Snapshot Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Active Model</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-lg font-bold text-slate-900">RandomForest v1.4</p>
              <p className="text-xs text-emerald-600 font-mono font-semibold mt-0.5">92.4% ROC-AUC</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Inference Latency</span>
                <Zap className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-slate-900">22 ms</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Real-time Redis Cache</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Explainability</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">SHAP Attribution</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">13 Clinical Factors</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Telemetry Channel</span>
                <Radio className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              </div>
              <p className="text-lg font-bold text-slate-900">WebSocket ASGI</p>
              <p className="text-xs text-emerald-600 font-mono font-semibold mt-0.5">Zero-reload Push</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-16 border-t border-slate-200 bg-slate-50/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Engineered for Critical Clinical Care
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Designed specifically to reduce diagnostic delay and alert fatigue
              in high-acuity hospital cardiology environments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Live Risk Stratification</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Continuous evaluation into LOW, MEDIUM, HIGH, and CRITICAL risk tiers with instant confidence bounds.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                Aggregates validated physiological markers including resting ECG, ST depression, serum cholesterol,
                and fluoroscopy vessel counts.
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Explainable AI (SHAP)</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Full transparent attribution of positive and negative factors driving each model recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                Physicians review exact feature contributions before acting, with the capability to submit clinical justifications
                and override predictions for the audit log.
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-2">
                  <Cpu className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Celery & Redis Asynchronous Jobs</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Non-blocking background PDF generation, batch inference, and model retraining queues.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                REST requests return immediately with 202 Accepted and a task ID, while workers stream live progress
                over WebSockets to the clinician UI.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cloud Architecture Section */}
      <section id="architecture" className="py-16 border-t border-slate-200 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700 mb-1">
                <Radio className="h-3 w-3" />
                <span>ACTIVE INFRASTRUCTURE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Live Cloud Backing Services
              </h2>
            </div>
            <Badge variant="outline" className="text-xs self-start md:self-auto bg-slate-50 text-slate-700 border-slate-200 shadow-sm">
              Production Verified TLS
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Database className="h-5 w-5 text-emerald-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Neon PostgreSQL 18.6</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">AWS us-east-2</p>
              </div>
              <p className="text-xs text-slate-600">
                Serverless Lakebase Postgres with instant branch replication and automated connection pooling.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Zap className="h-5 w-5 text-amber-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Upstash Serverless Redis</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">rediss:// channel layer</p>
              </div>
              <p className="text-xs text-slate-600">
                Encrypted TLS broker powering Celery background queues and Django Channels WebSocket distribution.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Server className="h-5 w-5 text-blue-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Django 5 + Channels ASGI</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">Daphne 4.1</p>
              </div>
              <p className="text-xs text-slate-600">
                Asynchronous request handling with JWT WebSocket middleware and strict HIPAA audit event logging.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Cpu className="h-5 w-5 text-purple-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Celery Distributed Worker</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">Celery 5.4.0</p>
              </div>
              <p className="text-xs text-slate-600">
                Dedicated asynchronous queues for PDF reports, telemetry notifications, and ML model drift evaluations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & HIPAA Section */}
      <section id="security" className="py-16 border-t border-slate-200 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span>SECURITY & PATIENT PRIVACY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                HIPAA-Aligned Protection for Sensitive Clinical PII
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hospital systems demand the highest standard of data segregation. The CDSS architecture enforces
                medical record masking, audit logging for all prediction inspections, and strict role permissions.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">
                    Encrypted Medical Record Numbers (MRN) with masked display across telemetry feeds.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">
                    Mandatory physician override justifications permanently bound to model decision logs.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">
                    Automatic JWT session expiration with silent refresh and instant local storage purging.
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Role-Based Access Matrix</span>
                <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-700 border-slate-200">RBAC Active</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">Physicians / Cardiologists</span>
                  <span className="text-emerald-700 font-mono font-medium">Full EHR, Predictions, Overrides</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">Triage Nurses</span>
                  <span className="text-blue-700 font-mono font-medium">Vitals Entry, Telemetry Alerts</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">Medical Analysts</span>
                  <span className="text-amber-700 font-mono font-medium">SHAP Analytics, Model Evaluation</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-slate-800">Administrators</span>
                  <span className="text-purple-700 font-mono font-medium">Model Retraining, Audit Logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">BPY-CSE-2666 Clinical Decision Support System © 2026</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Clinician Dashboard
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-900 transition-colors">
              Staff Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
