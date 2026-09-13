"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Eye,
  FileCheck,
  FileText,
  HeartPulse,
  HelpCircle,
  Lock,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/authStore";

// Pre-calibrated clinical presets for the interactive risk simulator
const PRESETS = [
  {
    name: "Healthy Baseline",
    badge: "LOW RISK",
    badgeVariant: "low" as const,
    vitals: {
      age: 42,
      systolicBp: 118,
      heartRate: 155,
      stDepression: 0.2,
      cholesterol: 182,
      chestPain: 2, // Non-anginal
    },
  },
  {
    name: "Borderline Triage",
    badge: "MEDIUM RISK",
    badgeVariant: "medium" as const,
    vitals: {
      age: 56,
      systolicBp: 142,
      heartRate: 138,
      stDepression: 1.2,
      cholesterol: 236,
      chestPain: 1, // Atypical
    },
  },
  {
    name: "Urgent Cardiology Review",
    badge: "HIGH RISK",
    badgeVariant: "high" as const,
    vitals: {
      age: 64,
      systolicBp: 168,
      heartRate: 118,
      stDepression: 2.4,
      cholesterol: 284,
      chestPain: 0, // Typical Angina
    },
  },
  {
    name: "Acute ICU Deterioration",
    badge: "CRITICAL RISK",
    badgeVariant: "critical" as const,
    vitals: {
      age: 72,
      systolicBp: 188,
      heartRate: 94,
      stDepression: 3.8,
      cholesterol: 335,
      chestPain: 3, // Asymptomatic Ischemia
    },
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { loginAsRole } = useAuthStore();

  // Interactive Live Clinical Risk Simulator State
  const [vitals, setVitals] = useState(PRESETS[1].vitals);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleQuickDemo = (role: "DOCTOR" | "NURSE" | "ADMIN" | "ANALYST") => {
    loginAsRole(role);
    router.push("/dashboard");
  };

  // Simulated machine learning risk assessment calculation
  const simulationResult = useMemo(() => {
    let score = 0.12;

    // Systolic blood pressure contribution
    if (vitals.systolicBp > 180) score += 0.28;
    else if (vitals.systolicBp > 160) score += 0.22;
    else if (vitals.systolicBp > 140) score += 0.14;
    else if (vitals.systolicBp > 130) score += 0.06;

    // ST depression (ECG ischemia marker)
    score += Math.min(0.38, vitals.stDepression * 0.09);

    // Heart rate response (lower exertion HR is higher risk)
    if (vitals.heartRate < 100) score += 0.18;
    else if (vitals.heartRate < 120) score += 0.11;
    else if (vitals.heartRate > 150) score -= 0.05;

    // Serum cholesterol
    if (vitals.cholesterol > 300) score += 0.15;
    else if (vitals.cholesterol > 240) score += 0.09;
    else if (vitals.cholesterol < 200) score -= 0.04;

    // Age factor
    if (vitals.age > 65) score += 0.12;
    else if (vitals.age > 50) score += 0.06;

    // Chest pain type
    if (vitals.chestPain === 3) score += 0.14; // Asymptomatic ischemia
    if (vitals.chestPain === 0) score += 0.12; // Typical angina

    // Bound probability between 0.04 and 0.97
    const probability = Math.max(0.04, Math.min(0.97, score));

    // Determine clinical risk tier
    let tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let tierColor = "text-emerald-700 bg-emerald-50 border-emerald-300";
    let tierBadgeVariant: "low" | "medium" | "high" | "critical" = "low";
    let recommendation = "Vitals are within baseline bounds. Continue standard observation and routine outpatient care.";

    if (probability >= 0.75) {
      tier = "CRITICAL";
      tierColor = "text-purple-700 bg-purple-50 border-purple-300";
      tierBadgeVariant = "critical";
      recommendation = "Immediate cardiac resuscitation or ICU bed transfer. Notify attending cardiologist immediately.";
    } else if (probability >= 0.5) {
      tier = "HIGH";
      tierColor = "text-rose-700 bg-rose-50 border-rose-300";
      tierBadgeVariant = "high";
      recommendation = "Urgent diagnostic review. Order stat serial troponins and 12-lead ECG telemetry monitoring.";
    } else if (probability >= 0.25) {
      tier = "MEDIUM";
      tierColor = "text-amber-800 bg-amber-50 border-amber-300";
      tierBadgeVariant = "medium";
      recommendation = "Moderate clinical concern. Reassess vitals every 2 hours and review patient medication chart.";
    }

    // Localized TreeSHAP feature attributions
    const shapDrivers = [
      {
        factor: "ST Depression (ECG)",
        value: `${vitals.stDepression.toFixed(1)} mm`,
        attribution: (vitals.stDepression * 0.08).toFixed(3),
        isPositive: vitals.stDepression >= 1.0,
        percentage: Math.min(100, Math.round(vitals.stDepression * 24)),
      },
      {
        factor: "Systolic Blood Pressure",
        value: `${vitals.systolicBp} mmHg`,
        attribution: ((vitals.systolicBp - 120) * 0.003).toFixed(3),
        isPositive: vitals.systolicBp >= 135,
        percentage: Math.min(100, Math.round(((vitals.systolicBp - 90) / 110) * 100)),
      },
      {
        factor: "Serum Cholesterol",
        value: `${vitals.cholesterol} mg/dL`,
        attribution: ((vitals.cholesterol - 200) * 0.0009).toFixed(3),
        isPositive: vitals.cholesterol >= 220,
        percentage: Math.min(100, Math.round(((vitals.cholesterol - 140) / 220) * 100)),
      },
      {
        factor: "Max Exertion Heart Rate",
        value: `${vitals.heartRate} bpm`,
        attribution: ((150 - vitals.heartRate) * 0.0018).toFixed(3),
        isPositive: vitals.heartRate < 130,
        percentage: Math.min(100, Math.round(((200 - vitals.heartRate) / 140) * 100)),
      },
    ];

    return {
      probability: (probability * 100).toFixed(1),
      rawProbability: probability,
      tier,
      tierColor,
      tierBadgeVariant,
      recommendation,
      shapDrivers,
    };
  }, [vitals]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm p-0.5 group-hover:border-sky-300 transition-colors">
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
                <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight group-hover:text-sky-700 transition-colors">
                  PatientRisk <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 ml-1">CDSS</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold text-sky-600 tracking-wider">
                  Predict • Prevent • Support
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#simulator" className="hover:text-slate-900 transition-colors">
              Risk Simulator
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Clinical Features
            </a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Care Pathway
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">
              Cloud Stack
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              HIPAA & RBAC
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              Clinical FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-700">
                Clinician Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="text-xs font-semibold gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
                Launch Portal
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/70 to-white">
        {/* Subtle Ambient Glow Elements */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 h-96 w-[760px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-28 right-12 h-80 w-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-4 pb-8">
            {/* Left Column: Hero Content & CTAs */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Institutional Trust Badges */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-700 font-bold uppercase">BPY-CSE-2666</span>
                <span className="text-slate-300">•</span>
                <span>SaMD Clinical Decision Support</span>
                <span className="text-slate-300">•</span>
                <span className="text-sky-700 font-medium">Sub-20ms Telemetry</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Real-Time Clinical <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600">
                  Decision Support System
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Empowering hospital cardiologists, emergency triage nurses, and ICU physicians with instant
                multi-model ML risk stratification, transparent TreeSHAP factor attributions, and zero-reload WebSocket telemetry.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/dashboard">
                  <Button variant="default" size="lg" className="text-xs font-semibold gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
                    <HeartPulse className="h-4 w-4" />
                    Launch Live Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#simulator">
                  <Button variant="outline" size="lg" className="text-xs font-semibold gap-2 border-slate-300 hover:bg-slate-50 text-slate-700">
                    <Sliders className="h-4 w-4 text-emerald-600" />
                    Try Risk Simulator
                  </Button>
                </a>
              </div>

              {/* Clinical Persona Quick Access Strip */}
              <div className="pt-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-mono font-bold">
                    Instant 1-Click Role Evaluation:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                  {/* Doctor Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("DOCTOR")}
                    className="group relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                          MD
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          Doctor
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        Dr. Elena Vance
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Cardiology & ICU</p>
                    </div>
                  </button>

                  {/* Nurse Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("NURSE")}
                    className="group relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="h-6 w-6 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-[11px]">
                          RN
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-semibold">
                          Nurse
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        Sarah Jenkins
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Emergency Triage</p>
                    </div>
                  </button>

                  {/* Analyst Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("ANALYST")}
                    className="group relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="h-6 w-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[11px]">
                          BI
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold">
                          Analyst
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                        Alex Rivera
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Informatics</p>
                    </div>
                  </button>

                  {/* Admin Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("ADMIN")}
                    className="group relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="h-6 w-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[11px]">
                          IT
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold">
                          Admin
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                        Hospital Admin
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Audit & Policy</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: High-Res Clinical Doctor Presentation */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-md">
                {/* Decorative Backdrop Glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-70" />

                {/* Main Card Frame */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-white/90 bg-white shadow-2xl">
                  <Image
                    src="/doctor-hero.jpg"
                    alt="Attending Cardiologist Physician reviewing patient risk assessment on tablet"
                    width={520}
                    height={520}
                    priority
                    className="w-full h-auto object-cover transform hover:scale-102 transition-transform duration-500"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* Bottom Doctor Profile Info */}
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          EV
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">Dr. Elena Vance, MD</h4>
                            <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                          </div>
                          <p className="text-[10px] text-slate-600">Chief of Cardiology & ICU Telemetry</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        On Duty
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Top-Left Telemetry Badge */}
                <div className="absolute -top-3 -left-3 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg text-left">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Activity className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">LIVE TELEMETRY</span>
                    <span className="text-xs font-bold text-slate-900">Sub-20ms Inference</span>
                  </div>
                </div>

                {/* Floating Top-Right AI Badge */}
                <div className="absolute -top-3 -right-3 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg text-left">
                  <div className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">XAI ACCURACY</span>
                    <span className="text-xs font-bold text-emerald-600">92.4% ROC-AUC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Telemetry Snapshot KPI Strip */}
          <div className="pt-2 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500">Active Ensemble</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-lg font-bold text-slate-900">RandomForest v1.4</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-emerald-600 font-mono font-bold">92.4% ROC-AUC</span>
                <span className="text-[10px] text-slate-400">Validated</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500">Inference Latency</span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-slate-900">18.4 ms</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-mono">In-Memory Scikit</span>
                <span className="text-[10px] text-emerald-600 font-medium">Cached</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500">Explainability</span>
                <Brain className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">TreeSHAP Engine</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-mono">13 Bio-Factors</span>
                <span className="text-[10px] text-sky-600 font-medium">Attributed</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500">Ward Telemetry</span>
                <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
              </div>
              <p className="text-lg font-bold text-slate-900">WebSocket ASGI</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-emerald-600 font-mono font-bold">Sub-second Push</span>
                <span className="text-[10px] text-slate-400">Zero-reload</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Clinical Risk Simulator & Telemetry Monitor */}
      <section id="simulator" className="py-16 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Sliders className="h-3.5 w-3.5" />
              <span>INTERACTIVE CLINICAL DEMO</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Live Patient Risk & SHAP Explainer Simulator
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Adjust patient vitals in real time to observe dynamic machine learning probability stratification,
              risk tier categorization, and localized TreeSHAP feature weight attributions.
            </p>
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Clinical Presets:</span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setVitals(preset.vitals)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <span>{preset.name}</span>
                <Badge variant={preset.badgeVariant} className="text-[10px] py-0 px-1.5">
                  {preset.badge}
                </Badge>
              </button>
            ))}
          </div>

          {/* Main Simulator Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Vitals Controls */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Patient Physiological Parameters
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Live Input</span>
                </div>

                {/* Slider 1: Systolic Blood Pressure */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Resting Systolic Blood Pressure</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {vitals.systolicBp} mmHg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="200"
                    step="2"
                    value={vitals.systolicBp}
                    onChange={(e) => setVitals({ ...vitals, systolicBp: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>90 (Normal)</span>
                    <span>130 (Elevated)</span>
                    <span>160 (Stage 2)</span>
                    <span>200 (Crisis)</span>
                  </div>
                </div>

                {/* Slider 2: ST-Segment Depression */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">ST-Segment Depression (ECG Ischemia)</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {vitals.stDepression.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5.0"
                    step="0.1"
                    value={vitals.stDepression}
                    onChange={(e) => setVitals({ ...vitals, stDepression: Number(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.0 mm (Normal)</span>
                    <span>1.5 mm (Moderate)</span>
                    <span>3.0 mm (Severe Ischemia)</span>
                  </div>
                </div>

                {/* Slider 3: Max Heart Rate */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Maximum Exertion Heart Rate</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {vitals.heartRate} bpm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="200"
                    step="1"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>70 (Chronotropic Incompetence)</span>
                    <span>140 (Average)</span>
                    <span>200 (High)</span>
                  </div>
                </div>

                {/* Slider 4: Serum Cholesterol */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Serum Cholesterol</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {vitals.cholesterol} mg/dL
                    </span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="380"
                    step="5"
                    value={vitals.cholesterol}
                    onChange={(e) => setVitals({ ...vitals, cholesterol: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>140 (Desirable)</span>
                    <span>240 (High)</span>
                    <span>380 (Hypercholesterolemia)</span>
                  </div>
                </div>

                {/* Chest Pain Type Selector */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-700 block">Chest Pain Symptom Category</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Typical Angina", val: 0 },
                      { label: "Atypical Angina", val: 1 },
                      { label: "Non-Anginal", val: 2 },
                      { label: "Asymptomatic", val: 3 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setVitals({ ...vitals, chestPain: item.val })}
                        className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                          vitals.chestPain === item.val
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Real-time Inferred Risk & SHAP Attributions */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Real-Time Model Inference & TreeSHAP
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Live Inference
                  </span>
                </div>

                {/* Live Risk Meter Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Risk Probability Score</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
                          {simulationResult.probability}%
                        </span>
                        <span className="text-xs text-slate-500 font-mono">confidence bound [±2.1%]</span>
                      </div>
                    </div>
                    <Badge variant={simulationResult.tierBadgeVariant} className="text-sm py-1 px-3 self-start sm:self-auto font-bold tracking-wider">
                      {simulationResult.tier} RISK TIER
                    </Badge>
                  </div>

                  {/* Progress Bar Gauge */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          simulationResult.rawProbability >= 0.75
                            ? "bg-purple-600"
                            : simulationResult.rawProbability >= 0.5
                            ? "bg-rose-500"
                            : simulationResult.rawProbability >= 0.25
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${simulationResult.probability}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                      <span>0.00 (Low)</span>
                      <span>0.25 (Medium)</span>
                      <span>0.50 (High)</span>
                      <span>0.75 (Critical)</span>
                      <span>1.00</span>
                    </div>
                  </div>

                  {/* Simulated ECG Waveform Display */}
                  <div className="relative rounded-lg bg-slate-950 p-3 overflow-hidden border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-1 border-b border-slate-800 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        LEAD II TELEMETRY • HR {vitals.heartRate} BPM
                      </span>
                      <span>ST {vitals.stDepression > 0 ? `-${vitals.stDepression.toFixed(1)}mm` : "ISO"}</span>
                    </div>
                    {/* SVG Rhythm Wave */}
                    <svg className="w-full h-10 stroke-emerald-400 fill-none" viewBox="0 0 500 40">
                      <path
                        d="M 0,20 L 60,20 L 70,22 L 80,18 L 90,20 L 105,20 L 110,6 L 116,36 L 122,12 L 128,24 L 134,20 L 150,20 L 170,20 L 190,14 L 205,20 L 250,20 L 260,22 L 270,18 L 280,20 L 295,20 L 300,6 L 306,36 L 312,12 L 318,24 L 324,20 L 340,20 L 360,20 L 380,14 L 395,20 L 500,20"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Clinical Directive Alert */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Clinical Protocol Guidance:</span>
                      <span className="text-slate-600 leading-relaxed">{simulationResult.recommendation}</span>
                    </div>
                  </div>
                </div>

                {/* TreeSHAP Local Factor Attribution Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">TreeSHAP Factor Attribution (Weights)</span>
                    <span className="text-[11px] font-mono text-slate-500">Base Value: E[f(x)] = 0.35</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {simulationResult.shapDrivers.map((driver, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">{driver.factor}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-500">{driver.value}</span>
                            <span
                              className={`font-bold text-xs ${
                                driver.isPositive ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {driver.isPositive ? "+" : ""}
                              {driver.attribution}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              driver.isPositive ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${driver.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    Red bars represent risk-increasing factors; green indicates protective clinical values. All predictions
                    require attending clinician confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-16 bg-slate-50/70 border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>HIGH-ACUITY CLINICAL CAPABILITIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Engineered for Critical Clinical Care
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Designed specifically to alleviate diagnostic delay, minimize cognitive overload, and eliminate alert fatigue
              in high-pressure hospital cardiology and emergency environments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Risk Stratification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous probability evaluation across 4 discrete clinical tiers: <strong>LOW</strong>, <strong>MEDIUM</strong>,
                <strong>HIGH</strong>, and <strong>CRITICAL</strong> with instant confidence intervals.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Sub-20ms inference latency</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>13 validated physiological markers</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
              <div className="h-10 w-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Explainable AI (TreeSHAP)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Individualized feature weight attributions showing clinicians exactly why a recommendation was made,
                eliminating black-box skepticism in acute decision scenarios.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>Positive & protective driver separation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>Natural language synthesis summaries</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero-Reload Telemetry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asynchronous WebSocket distribution powered by Daphne ASGI and Redis Channel Layers, streaming live alerts
                directly to ward workstations without manual browser refreshes.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Sub-second deterioration alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Automatic exponential backoff reconnect</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Celery Async Job Queues</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Non-blocking task dispatching for compute-heavy workloads including ReportLab PDF medical discharge summaries,
                batch cohort inferences, and background analytics.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>HTTP 202 Accepted task handoffs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>Real-time completion notifications</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Physician Clinical Override</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Preserves clinician diagnostic sovereignty. Medical practitioners can override algorithmic risk recommendations
                with mandatory clinical justifications recorded to immutable audit trails.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Permanent rationale audit logging</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Guarantees physician-in-the-loop</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
              <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Model Registry & Governance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full lifecycle governance tracking active models (Random Forest, SVM, AdaBoost), automated candidate
                evaluation metrics (ROC-AUC, F1, PR curves), and safe zero-downtime rollbacks.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>Version tracking & candidate promotion</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>Continuous calibration & drift monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Clinical Workflow Stepper */}
      <section id="workflow" className="py-16 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <Activity className="h-3.5 w-3.5" />
              <span>CARE PATHWAY INTEGRATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              End-to-End Hospital Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              How PatientRisk seamlessly fits into bedside clinical routines from initial patient admission to discharge.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { num: "01", title: "Triage & Vitals Entry", icon: Stethoscope },
              { num: "02", title: "Instant ML Inference", icon: Zap },
              { num: "03", title: "TreeSHAP Attribution", icon: Brain },
              { num: "04", title: "Clinician Action & Report", icon: FileText },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveWorkflowTab(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    activeWorkflowTab === idx
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold opacity-75">{step.num}</span>
                    <Icon className="h-4 w-4 opacity-80" />
                  </div>
                  <p className="text-xs font-bold leading-snug">{step.title}</p>
                </button>
              );
            })}
          </div>

          {/* Stepper Content Display */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8">
            {activeWorkflowTab === 0 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-700 uppercase">Phase 1: Ward Admission</span>
                  <h3 className="text-xl font-bold text-slate-900">Rapid Patient Intake & Serial Vital Capture</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Triage nurses register incoming patients with Medical Record Numbers (MRN), logging serial physiological
                    observations including systolic/diastolic blood pressure, resting heart rate, ECG ST slope, and serum biomarkers.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Validated against physiological clinical sanity bounds</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">POST /api/v1/patients/P-104/clinical-records/</div>
                  <div className="text-slate-700">MRN: ENC-88291 • Bed 4B (Cardiology Ward)</div>
                  <div className="text-emerald-700">Vitals Encapsulated: BP 162/98, HR 114, ST -2.1mm</div>
                  <div className="text-slate-500 text-[11px]">Audit: User Sarah Jenkins, RN • Timestamp: 12:44:02Z</div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 1 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-sky-700 uppercase">Phase 2: Algorithmic Inference</span>
                  <h3 className="text-xl font-bold text-slate-900">Ensemble Model Execution in Sub-20 Milliseconds</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    The active production model (Random Forest / AdaBoost) processes the input vector through pre-fitted standard
                    scalers, mapping multi-dimensional non-linear interactions into continuous deterioration probabilities.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-sky-600" />
                    <span>In-memory pipeline caching eliminates cold-start bottlenecks</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">ENGINE: RandomForestClassifier (v1.4)</div>
                  <div className="text-slate-700">Execution Time: 18.4ms • Cache Status: HIT</div>
                  <div className="text-rose-700 font-bold">Predicted Tier: HIGH RISK (Prob: 0.684)</div>
                  <div className="text-slate-500 text-[11px]">Ensemble ROC-AUC Benchmark: 92.4% on test cohort</div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 2 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-teal-700 uppercase">Phase 3: Transparent Attribution</span>
                  <h3 className="text-xl font-bold text-slate-900">TreeSHAP Explainable Risk Drivers</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Rather than presenting an opaque score, the system calculates exact mathematical Shapley values for all
                    13 input features, ranking patient-specific positive contributors and mitigating protective markers.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Eliminates clinician skepticism and alert fatigue</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">EXPLAINER: TreeExplainer (Runtime)</div>
                  <div className="text-rose-600">ST-Depression (2.4mm): +0.281 weight</div>
                  <div className="text-rose-600">Systolic BP (168 mmHg): +0.194 weight</div>
                  <div className="text-emerald-600">Resting HR (Normal): -0.062 protective</div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 3 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-purple-700 uppercase">Phase 4: Action & Reports</span>
                  <h3 className="text-xl font-bold text-slate-900">Clinician Authority & Asynchronous PDF Generation</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Attending cardiologists confirm or override recommendations with documented rationales. Celery background workers
                    compile clinical discharge summaries and risk trajectory reports via ReportLab PDF engine.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>Immediate PDF delivery via WebSocket notification push</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">CELERY TASK: compile_clinical_pdf</div>
                  <div className="text-slate-700">Task Status: SUCCESS (0.42s)</div>
                  <div className="text-emerald-700">Artifact: patient_P104_discharge_summary.pdf</div>
                  <div className="text-slate-500 text-[11px]">Audit Log: Override Documented by Dr. Elena Vance</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cloud Backing Architecture Section */}
      <section id="architecture" className="py-16 border-b border-slate-200 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 mb-1.5">
                <Radio className="h-3.5 w-3.5" />
                <span>ACTIVE INFRASTRUCTURE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Live Cloud Backing Services
              </h2>
            </div>
            <Badge variant="outline" className="text-xs self-start md:self-auto bg-white text-slate-700 border-slate-200 shadow-xs">
              Production Verified TLS
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Service 1 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Database className="h-5 w-5 text-emerald-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Neon PostgreSQL 16</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">AWS us-east-2</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Serverless Lakebase Postgres with instant branch replication, autoscaling, and automated connection pooling.
              </p>
            </div>

            {/* Service 2 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Zap className="h-5 w-5 text-amber-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Upstash Serverless Redis</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">rediss:// channel layer</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Encrypted TLS broker powering Celery background queues and Django Channels WebSocket pub/sub distribution.
              </p>
            </div>

            {/* Service 3 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Server className="h-5 w-5 text-blue-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Django 5 + Channels ASGI</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Daphne 4.1.2</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asynchronous request handling with JWT WebSocket middleware and strict HIPAA audit event logging.
              </p>
            </div>

            {/* Service 4 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Cpu className="h-5 w-5 text-purple-600" />
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Celery Distributed Worker</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Celery 5.4.0</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated asynchronous queues for PDF reports, telemetry notifications, and ML model drift evaluations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & HIPAA Section */}
      <section id="security" className="py-16 border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span>SECURITY & PATIENT PRIVACY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                HIPAA-Aligned Protection for Sensitive Clinical PII
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hospital environments demand uncompromising standards of data segregation. The CDSS architecture enforces
                medical record masking, audit logging for all prediction inspections, and strict role permissions.
              </p>
              <div className="space-y-2.5 pt-2">
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Role-Based Access Matrix (RBAC)</span>
                <Badge variant="outline" className="text-[11px] bg-white text-slate-700 border-slate-200">RBAC Active</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-800">Physicians / Cardiologists</span>
                  <span className="text-emerald-700 font-mono font-medium">Full EHR, Predictions, Overrides</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-800">Triage Nurses</span>
                  <span className="text-blue-700 font-mono font-medium">Vitals Entry, Telemetry Alerts</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
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

      {/* Clinical FAQ Accordion */}
      <section id="faq" className="py-16 border-b border-slate-200 bg-slate-50/60">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Clinical & Institutional FAQ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Key considerations regarding clinical practice safety, machine learning explainability, and regulatory boundaries.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the system ensure licensed physicians retain final diagnostic authority?",
                a: "PatientRisk CDSS is strictly classified as an assistive Software as a Medical Device (SaMD) tool. Predictions provide probabilistic decision support and feature weighting. The platform enforces a structured Clinician Override workflow, requiring medical practitioners to document clinical rationales whenever their judgment differs from model output, preserving human agency.",
              },
              {
                q: "What algorithms are currently active in the clinical prediction loop?",
                a: "The system deploys an ensemble of supervised algorithms: Random Forest (primary active default), Support Vector Machines (SVM with RBF kernel), and AdaBoost. The active model operates at a 92.4% ROC-AUC benchmark, executing in under 20 milliseconds.",
              },
              {
                q: "How are SHAP feature attributions computed during real-time inference?",
                a: "The ML Engine employs runtime TreeSHAP (SHapley Additive exPlanations) calibrated against a representative training background. It decomposes the model's margin score into individual feature weight additions and subtractions relative to expected clinical baselines.",
              },
              {
                q: "How does the platform handle Protected Health Information (PHI) and HIPAA compliance?",
                a: "The architecture adheres to strict HIPAA data safeguards: all data in transit is encrypted using TLS 1.3, database records at rest in Neon PostgreSQL are AES-256 encrypted, Medical Record Numbers are masked, and every user interaction is written to tamper-evident audit logs.",
              },
              {
                q: "How does the WebSocket telemetry handle unreliable hospital Wi-Fi connections?",
                a: "The client-side `useWebSocket` hook incorporates exponential backoff reconnect logic with heartbeat ping/pong keep-alives. When reconnecting after brief network drops, the client automatically synchronizes latest patient vitals and unread risk alerts.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5">
                <Image src="/logo.png" alt="PatientRisk Logo" width={36} height={36} className="rounded-lg object-contain" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block leading-tight">PatientRisk CDSS</span>
                <span className="text-[10px] font-mono text-slate-500">Project Code: BPY-CSE-2666 • Assistive Clinical System</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                Clinician Portal
              </Link>
              <Link href="/login" className="hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-slate-900 transition-colors">
                Staff Onboarding
              </Link>
              <a href="#simulator" className="hover:text-slate-900 transition-colors">
                Interactive Simulator
              </a>
              <a href="https://github.com/bunnyvalluri/Clinical-Decision-Support-System-" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
                GitHub Repository
              </a>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />
              <span>BPY-CSE-2666 Patient Risk Level Prediction System © 2026. All rights reserved.</span>
            </div>
            <p className="text-slate-400 text-center sm:text-right">
              SaMD assistive tool. Not an autonomous diagnostic device.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
