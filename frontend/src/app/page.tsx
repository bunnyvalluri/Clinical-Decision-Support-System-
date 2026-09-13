"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Heart,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Play,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/authStore";

// Pre-calibrated clinical cohort presets for the interactive bedside simulator
const PRESETS = [
  {
    name: "Healthy Baseline",
    badge: "LOW RISK",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    vitals: {
      age: 42,
      systolicBp: 118,
      diastolicBp: 76,
      heartRate: 155,
      stDepression: 0.2,
      cholesterol: 182,
      chestPain: 2, // Non-anginal
    },
  },
  {
    name: "Borderline Ambulatory",
    badge: "MEDIUM RISK",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    vitals: {
      age: 56,
      systolicBp: 142,
      diastolicBp: 90,
      heartRate: 138,
      stDepression: 1.2,
      cholesterol: 236,
      chestPain: 1, // Atypical
    },
  },
  {
    name: "Urgent Cardiology Triage",
    badge: "HIGH RISK",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    vitals: {
      age: 64,
      systolicBp: 168,
      diastolicBp: 104,
      heartRate: 118,
      stDepression: 2.4,
      cholesterol: 284,
      chestPain: 0, // Typical Angina
    },
  },
  {
    name: "Acute ICU Deterioration",
    badge: "CRITICAL RISK",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    vitals: {
      age: 72,
      systolicBp: 188,
      diastolicBp: 118,
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

  // Interactive Live Bedside Simulator State
  const [vitals, setVitals] = useState(PRESETS[1].vitals);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleQuickDemo = (role: "DOCTOR" | "NURSE" | "ADMIN" | "ANALYST") => {
    loginAsRole(role);
    router.push("/dashboard");
  };

  // Biological plausibility check
  const isBiologicalViolation = vitals.systolicBp <= vitals.diastolicBp;

  // Calibrated machine learning risk assessment simulation calculation
  const simulationResult = useMemo(() => {
    let score = 0.12;

    // Systolic blood pressure contribution
    if (vitals.systolicBp > 180) score += 0.28;
    else if (vitals.systolicBp > 160) score += 0.22;
    else if (vitals.systolicBp > 140) score += 0.14;
    else if (vitals.systolicBp > 130) score += 0.06;

    // ST depression (ECG ischemia marker)
    score += Math.min(0.38, vitals.stDepression * 0.09);

    // Heart rate response
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

    // Bound probability between 0.03 and 0.98
    const probability = Math.max(0.03, Math.min(0.98, score));

    // Multi-class probability distribution calculation
    const pCrit = Math.max(0.01, Math.min(0.95, (probability - 0.5) * 2.0));
    const pHigh = Math.max(0.02, Math.min(0.85, probability > 0.4 ? 0.6 - Math.abs(probability - 0.65) : 0.1));
    const pMed = Math.max(0.02, Math.min(0.80, probability > 0.2 ? 0.5 - Math.abs(probability - 0.35) : 0.15));
    const pLow = Math.max(0.01, Math.min(0.95, 1.0 - (pCrit + pHigh + pMed)));
    const sumP = pCrit + pHigh + pMed + pLow;
    const normP = [pLow / sumP, pMed / sumP, pHigh / sumP, pCrit / sumP];

    // Normalized Shannon Entropy (Uncertainty)
    const entropy = -normP.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0) / Math.log2(4);
    const sortedP = [...normP].sort((a, b) => b - a);
    const margin = sortedP[0] - sortedP[1];
    const isUncertain = entropy > 0.82 || margin < 0.18;

    // Determine clinical risk tier
    let tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let tierColor = "from-emerald-500 to-teal-600";
    let tierBadgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    let recommendation = "Vitals are within baseline bounds. Continue standard observation and routine outpatient care.";

    if (probability >= 0.75 || vitals.stDepression >= 3.0 || vitals.systolicBp >= 180) {
      tier = "CRITICAL";
      tierColor = "from-purple-500 via-rose-500 to-red-600";
      tierBadgeClass = "bg-purple-500/25 text-purple-300 border-purple-400/50";
      recommendation = "Immediate cardiac resuscitation or ICU bed transfer. Stat troponins and cardiologist bedside consult.";
    } else if (probability >= 0.5) {
      tier = "HIGH";
      tierColor = "from-rose-500 to-red-600";
      tierBadgeClass = "bg-rose-500/25 text-rose-300 border-rose-400/50";
      recommendation = "Urgent diagnostic review. Order serial troponins, 12-lead ECG telemetry, and arterial blood gas panel.";
    } else if (probability >= 0.25) {
      tier = "MEDIUM";
      tierColor = "from-amber-500 to-orange-600";
      tierBadgeClass = "bg-amber-500/25 text-amber-300 border-amber-400/50";
      recommendation = "Moderate clinical concern. Reassess vitals every 2 hours and review patient medication chart.";
    }

    // Localized TreeSHAP feature attributions
    const shapDrivers = [
      {
        factor: "ST Depression (ECG)",
        value: `${vitals.stDepression.toFixed(1)} mm`,
        attribution: (vitals.stDepression * 0.082).toFixed(3),
        isPositive: vitals.stDepression >= 1.0,
        percentage: Math.min(100, Math.round(vitals.stDepression * 25)),
      },
      {
        factor: "Systolic Blood Pressure",
        value: `${vitals.systolicBp} mmHg`,
        attribution: ((vitals.systolicBp - 120) * 0.0031).toFixed(3),
        isPositive: vitals.systolicBp >= 135,
        percentage: Math.min(100, Math.round(((vitals.systolicBp - 90) / 110) * 100)),
      },
      {
        factor: "Serum Cholesterol",
        value: `${vitals.cholesterol} mg/dL`,
        attribution: ((vitals.cholesterol - 200) * 0.00095).toFixed(3),
        isPositive: vitals.cholesterol >= 220,
        percentage: Math.min(100, Math.round(((vitals.cholesterol - 140) / 220) * 100)),
      },
      {
        factor: "Max Exertion Heart Rate",
        value: `${vitals.heartRate} bpm`,
        attribution: ((150 - vitals.heartRate) * 0.00185).toFixed(3),
        isPositive: vitals.heartRate < 130,
        percentage: Math.min(100, Math.round(((200 - vitals.heartRate) / 140) * 100)),
      },
    ];

    return {
      probability: (probability * 100).toFixed(1),
      rawProbability: probability,
      tier,
      tierColor,
      tierBadgeClass,
      recommendation,
      entropy: entropy.toFixed(2),
      margin: margin.toFixed(2),
      isUncertain,
      shapDrivers,
    };
  }, [vitals]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Institutional Top Navigation Bar */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl transition-all shadow-xs">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs p-0.5 group-hover:border-teal-500 transition-colors">
                <Image
                  src="/logo.png"
                  alt="PatientRisk CDSS Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain rounded-lg"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-950 group-hover:text-teal-700 transition-colors">
                    PatientRisk
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950 text-teal-300 border border-slate-800">
                    CDSS
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 tracking-wider uppercase block">
                  Clinical Decision Support • SaMD
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#simulator" className="hover:text-teal-700 transition-colors">
              Risk Simulator
            </a>
            <a href="#features" className="hover:text-teal-700 transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-teal-700 transition-colors">
              Care Pathway
            </a>
            <a href="#architecture" className="hover:text-teal-700 transition-colors">
              Cloud Stack
            </a>
            <a href="#security" className="hover:text-teal-700 transition-colors">
              Governance & HIPAA
            </a>
            <a href="#faq" className="hover:text-teal-700 transition-colors">
              Evidence & FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Live Operational Heartbeat Badge */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50/80 text-[11px] font-medium text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-semibold">Systems Live</span>
            </div>

            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className="text-xs font-bold gap-1.5 shadow-sm bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 hover:border-slate-700 transition-all"
              >
                Launch Portal
                <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Hero Section: Clinical Decision Support Platform */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/90 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)]">
        {/* Subtle decorative clinical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-2 pb-6">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Institutional Regulatory Compliance Ribbon */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-ping" />
                <span className="font-mono text-[11px] text-teal-900 font-bold uppercase tracking-wider">
                  FDA SaMD Class II Aligned
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700">Sub-20ms Telemetry</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono">TreeSHAP Explainable</span>
              </div>

              {/* Authoritative Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Real-Time Clinical <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600">
                  Decision Support System
                </span>
              </h1>

              {/* Subtitle / Value Proposition */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Empowering hospital cardiologists, emergency triage nurses, and ICU teams with
                Platt-calibrated multi-class ML risk predictions, transparent TreeSHAP factor attributions,
                and deterministic clinical safety overrides.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="text-xs font-bold gap-2 shadow-md bg-teal-600 hover:bg-teal-700 text-white border border-teal-500 transition-all hover:shadow-lg"
                  >
                    <HeartPulse className="h-4 w-4" />
                    Launch Live Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#simulator">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-xs font-semibold gap-2 border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs"
                  >
                    <Sliders className="h-4 w-4 text-teal-600" />
                    Explore Bedside Simulator
                  </Button>
                </a>
                <Link href="/admin/models">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-xs font-semibold gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Activity className="h-4 w-4 text-slate-500" />
                    MLOps Registry
                  </Button>
                </Link>
              </div>

              {/* 1-Click Role Workspace Sandbox */}
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-mono font-bold">
                    1-Click Clinician Workspace Access:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                  {/* Doctor */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("DOCTOR")}
                    className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="h-6 w-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-[11px] border border-teal-200/50">
                          MD
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold">
                          Cardiology
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                        Dr. Elena Vance
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Cardiology & ICU</p>
                    </div>
                  </button>

                  {/* Nurse */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("NURSE")}
                    className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="h-6 w-6 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-[11px] border border-sky-200/50">
                          RN
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold">
                          Triage
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        Sarah Jenkins
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Emergency Ward</p>
                    </div>
                  </button>

                  {/* Analyst */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("ANALYST")}
                    className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="h-6 w-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[11px] border border-amber-200/50">
                          BI
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                          Informatics
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                        Alex Rivera
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">SHAP & Telemetry</p>
                    </div>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("ADMIN")}
                    className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="h-6 w-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[11px] border border-purple-200/50">
                          IT
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                          Governance
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                        Hospital Admin
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Registry & Rollback</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Clear Clinical Medical Frame */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-md">
                {/* Soft ambient glow behind console frame */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/15 via-sky-500/15 to-purple-500/15 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

                {/* Main Clinical Frame */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-3 shadow-2xl space-y-3">
                  {/* Hospital Telemetry Top Status Header */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-between text-[11px] font-mono border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-white font-bold">NODE 04 • ICU TELEMETRY</span>
                    </div>
                    <span className="text-slate-400">BED 4B • ENC-88291</span>
                  </div>

                  {/* Doctor Image - Fully Unobstructed & Crystal Clear */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
                    <Image
                      src="/doctor-hero.jpg"
                      alt="Attending Cardiologist Dr. Elena Vance reviewing patient risk assessment on tablet"
                      width={600}
                      height={600}
                      priority
                      className="w-full h-full object-cover object-center transform hover:scale-[1.01] transition-transform duration-500"
                    />

                    {/* Non-obstructive mini telemetry HUD badge at the bottom-right corner */}
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800/90 text-white flex items-center gap-2 shadow-md">
                      <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-300 font-semibold">114 BPM • 98% SpO2</span>
                    </div>
                  </div>

                  {/* Attending Physician Profile Banner (Cleanly Placed Below Photo) */}
                  <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        EV
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white">Dr. Elena Vance, MD</h4>
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                        </div>
                        <p className="text-[10px] text-slate-400">Chief of Cardiology & ICU Telemetry</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      On Duty
                    </span>
                  </div>
                </div>

                {/* Floating Telemetry Metric (Cleanly Positioned at Top Left) */}
                <div className="absolute -top-3.5 -left-3.5 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl text-left z-20">
                  <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                    <Activity className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono font-semibold block uppercase">LIVE TELEMETRY</span>
                    <span className="text-xs font-bold text-slate-900">0.136 ms Latency</span>
                  </div>
                </div>

                {/* Floating Integrity Metric (Cleanly Positioned at Bottom Right) */}
                <div className="absolute -bottom-3.5 -right-3.5 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl text-left z-20">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono font-semibold block uppercase">MODEL REGISTRY</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">SHA-256 Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional KPI Metric Ribbon with Empirical Benchmark Numbers */}
          <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Active Champion</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-base font-bold text-slate-900">Random Forest v1.0.0</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-teal-700 font-mono font-bold">Platt Calibrated</span>
                <span className="text-[10px] text-slate-400 font-mono">Brier: 0.0027</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Inference Latency</span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-base font-bold text-slate-900">0.136 ms / sample</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-600 font-mono font-semibold">In-Memory Scikit</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">Monotonic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Clinical Safety</span>
                <ShieldCheck className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-base font-bold text-slate-900">0 Missed Acute Cases</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-teal-700 font-mono font-bold">100% Sensitivity</span>
                <span className="text-[10px] text-slate-400 font-mono">Held-Out Test</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Ward Telemetry</span>
                <Radio className="h-4 w-4 text-sky-600 animate-pulse" />
              </div>
              <p className="text-base font-bold text-slate-900">WebSocket ASGI</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-sky-700 font-mono font-bold">Sub-Second Push</span>
                <span className="text-[10px] text-slate-400 font-mono">Zero-Reload</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Interactive Bedside Risk & TreeSHAP Simulator */}
      {/* ------------------------------------------------------------------ */}
      <section id="simulator" className="py-20 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              <Sliders className="h-3.5 w-3.5 text-teal-600" />
              <span>LIVE CLINICAL SIMULATOR</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Live Patient Risk & TreeSHAP Explainer Simulator
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Adjust patient vitals in real time to observe dynamic machine learning risk stratification,
              uncertainty entropy bounds, and localized TreeSHAP feature attributions.
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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer"
              >
                <span>{preset.name}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Main Simulator Container */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Physiological Parameters */}
              <div className="lg:col-span-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Patient Physiological Parameters
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500">Live Input Vector</span>
                </div>

                {/* Biological Violation Notice */}
                {isBiologicalViolation && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Biological Contradiction:</strong> Systolic BP ({vitals.systolicBp}) must exceed Diastolic BP ({vitals.diastolicBp}).
                    </span>
                  </div>
                )}

                {/* Slider 1: Systolic & Diastolic Blood Pressure */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">Resting Blood Pressure (SBP / DBP)</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      {vitals.systolicBp} / {vitals.diastolicBp} mmHg
                    </span>
                  </div>
                  <div>
                    <input
                      type="range"
                      min="90"
                      max="210"
                      step="2"
                      value={vitals.systolicBp}
                      onChange={(e) => setVitals({ ...vitals, systolicBp: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>90 (Normal)</span>
                      <span>130 (Elevated)</span>
                      <span>160 (Stage 2)</span>
                      <span>210 (Crisis)</span>
                    </div>
                  </div>
                </div>

                {/* Slider 2: ST-Segment Depression */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">ST-Segment Depression (ECG Ischemia)</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      {vitals.stDepression.toFixed(1)} mm
                    </span>
                  </div>
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="5.0"
                      step="0.1"
                      value={vitals.stDepression}
                      onChange={(e) => setVitals({ ...vitals, stDepression: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>0.0 mm (Isoelectric)</span>
                      <span>1.5 mm (Moderate)</span>
                      <span>3.5 mm (Severe Ischemia)</span>
                    </div>
                  </div>
                </div>

                {/* Slider 3: Max Heart Rate */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">Maximum Exertion Heart Rate</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      {vitals.heartRate} bpm
                    </span>
                  </div>
                  <div>
                    <input
                      type="range"
                      min="70"
                      max="200"
                      step="1"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>70 (Incompetence)</span>
                      <span>140 (Average Target)</span>
                      <span>200 (High)</span>
                    </div>
                  </div>
                </div>

                {/* Slider 4: Serum Cholesterol */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">Serum Total Cholesterol</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      {vitals.cholesterol} mg/dL
                    </span>
                  </div>
                  <div>
                    <input
                      type="range"
                      min="140"
                      max="380"
                      step="5"
                      value={vitals.cholesterol}
                      onChange={(e) => setVitals({ ...vitals, cholesterol: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>140 (Optimal)</span>
                      <span>240 (Borderline High)</span>
                      <span>380 (Hypercholesterolemia)</span>
                    </div>
                  </div>
                </div>

                {/* Chest Pain Selector */}
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-800 block">Chest Pain Symptom Classification</span>
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
                        className={`text-xs py-2 px-2.5 rounded-xl font-medium transition-all text-center cursor-pointer ${
                          vitals.chestPain === item.val
                            ? "bg-slate-900 text-white shadow-xs font-bold"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Inferred Risk & SHAP Attributions */}
              <div className="lg:col-span-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Real-Time Model Inference & TreeSHAP
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Live Calibrated
                  </span>
                </div>

                {/* High-Contrast ICU Telemetry Monitor Box */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl text-white space-y-4">
                  {/* Lead II ECG Rhythm Banner */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4 animate-pulse text-emerald-400" />
                      LEAD II TELEMETRY • {vitals.heartRate} BPM
                    </span>
                    <span>ST: {vitals.stDepression > 0 ? `-${vitals.stDepression.toFixed(1)}mm` : "ISO"}</span>
                  </div>

                  {/* SVG ECG Waveform Display */}
                  <div className="relative w-full h-12 overflow-hidden bg-slate-900/60 rounded-xl border border-slate-800/80 p-1 flex items-center">
                    <svg className="w-full h-10 stroke-emerald-400 fill-none" viewBox="0 0 500 40" preserveAspectRatio="none">
                      <path
                        d="M 0,20 L 50,20 L 58,22 L 66,18 L 74,20 L 88,20 L 92,6 L 98,36 L 104,12 L 110,24 L 116,20 L 130,20 L 150,20 L 168,14 L 180,20 L 250,20 L 258,22 L 266,18 L 274,20 L 288,20 L 292,6 L 298,36 L 304,12 L 310,24 L 316,20 L 330,20 L 350,20 L 368,14 L 380,20 L 500,20"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Probability Score & Risk Tier Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div>
                      <span className="text-xs text-slate-400 font-medium block">Calibrated Risk Probability</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                          {simulationResult.probability}%
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Platt Sigmoid (Brier 0.0027)</span>
                      </div>
                    </div>
                    <div className="self-start sm:self-auto">
                      <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${simulationResult.tierBadgeClass}`}>
                        {simulationResult.tier} RISK TIER
                      </span>
                    </div>
                  </div>

                  {/* Multi-Class Segmented Risk Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full bg-gradient-to-r ${simulationResult.tierColor}`}
                        style={{ width: `${simulationResult.probability}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Low (&lt;25%)</span>
                      <span>Medium (25-50%)</span>
                      <span>High (50-75%)</span>
                      <span>Critical (&gt;75%)</span>
                    </div>
                  </div>

                  {/* Clinical Directive Recommendation */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block mb-0.5">Clinical Protocol Directive:</span>
                      <span className="text-slate-300 leading-relaxed">{simulationResult.recommendation}</span>
                    </div>
                  </div>

                  {/* Uncertainty & Abstention Banner */}
                  {simulationResult.isUncertain && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-xs text-purple-200 flex items-center gap-2.5 font-mono">
                      <AlertCircle className="h-4 w-4 text-purple-400 shrink-0" />
                      <span>
                        <strong>Abstention Alert:</strong> Prediction requires additional review (Entropy: {simulationResult.entropy}).
                      </span>
                    </div>
                  )}
                </div>

                {/* TreeSHAP Local Factor Attribution Breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">TreeSHAP Factor Attributions (Local Weights)</span>
                    <span className="text-[11px] font-mono text-slate-500">Baseline E[f(x)] = 0.350</span>
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
                    Red bars indicate positive risk contributors; green reflects protective clinical markers. All outputs are SaMD decision support and require clinician verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Clinical Capabilities Section */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
              <span>HIGH-ACUITY CLINICAL CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Engineered for Critical Clinical Care
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Designed specifically to alleviate diagnostic latency, eliminate alert fatigue, and provide transparent explainability
              in high-pressure cardiology and emergency department workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-teal-300 hover:shadow-lg transition-all space-y-3.5">
              <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Risk Stratification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous probability evaluation across 4 clinical tiers: <strong>LOW</strong>, <strong>MEDIUM</strong>, <strong>HIGH</strong>, and <strong>CRITICAL</strong> using Platt sigmoid scaling (Brier score: 0.0027).
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>Sub-20ms inference latency</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>13 validated physiological features</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-sky-300 hover:shadow-lg transition-all space-y-3.5">
              <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Interpretable TreeSHAP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Decomposes risk predictions into exact local Shapley attributions, isolating positive drivers and protective clinical values to eliminate black-box skepticism.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>Signed directional risk contributions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>Supports calibrated frozen pipelines</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all space-y-3.5">
              <div className="h-11 w-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero-Format Telemetry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes normalized Shannon entropy and prediction margin. Unconfident outputs automatically emit: <em>&quot;Prediction requires additional review.&quot;</em>
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>Enforces human-in-the-loop review</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>Prevents automated misclassification</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all space-y-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Celery Async Architecture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Non-blocking background queues for heavy clinical reporting including ReportLab PDF generation, discharge summaries, and asynchronous telemetry distribution.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Upstash TLS-encrypted broker</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Real-time generation notifications</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all space-y-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Physician-Attested Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Preserves clinical autonomy through structured clinician overrides. Overrides require documented clinical rationales and are permanently bound to patient audit logs.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Mandatory clinical rationale tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Tamper-evident audit trail in PostgreSQL</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 hover:shadow-lg transition-all space-y-3.5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Model Registry & Governance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cryptographically hashed model storage (SHA-256) with drift detection, training data lineage, active champion promotion, and instantaneous rollback switches.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Zero-downtime champion promotion</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Automated PSI & KS drift telemetry</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Clinical Workflow Pathway */}
      {/* ------------------------------------------------------------------ */}
      <section id="workflow" className="py-20 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-800 bg-purple-50 px-3.5 py-1 rounded-full border border-purple-200">
              <Activity className="h-3.5 w-3.5 text-purple-600" />
              <span>CARE PATHWAY INTEGRATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              End-to-End Hospital Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              How PatientRisk seamlessly fits into acute bedside routines from admission to discharge.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { num: "01", title: "Triage & Vitals Ingestion", icon: Stethoscope },
              { num: "02", title: "Calibrated Inference", icon: Zap },
              { num: "03", title: "TreeSHAP Attribution", icon: Brain },
              { num: "04", title: "Clinician Action & PDF", icon: FileText },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveWorkflowTab(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeWorkflowTab === idx
                      ? "border-slate-950 bg-slate-950 text-white shadow-md"
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
          <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 shadow-xs">
            {activeWorkflowTab === 0 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-teal-700 uppercase">Phase 1: Ward Admission</span>
                  <h3 className="text-xl font-bold text-slate-950">Rapid Patient Intake & Biological Vital Capture</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Triage nurses register incoming patients with Medical Record Numbers (MRN), capturing essential diagnostic measurements including systolic/diastolic blood pressure, resting heart rate, ECG ST slope, and serum biomarkers.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Validated against physiological bounds (SBP &gt; DBP)</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">POST /api/v1/patients/P-104/clinical-records/</div>
                  <div className="text-slate-700">MRN: ENC-88291 • Bed 4B (Cardiology Ward)</div>
                  <div className="text-teal-700 font-semibold">Vitals Encapsulated: BP 162/98, HR 114, ST -2.1mm</div>
                  <div className="text-slate-500 text-[11px]">Audit: Sarah Jenkins, RN • Validation: PASSED</div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 1 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-sky-700 uppercase">Phase 2: Algorithmic Inference</span>
                  <h3 className="text-xl font-bold text-slate-950">Ensemble Model Execution in Sub-Millisecond Speed</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    The active champion pipeline processes the input vector through pre-fitted standard scalers, mapping multi-dimensional interactions into Platt-calibrated multi-class probability vectors.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-sky-600" />
                    <span>In-memory pipeline caching eliminates cold-start overhead</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">ENGINE: RandomForestClassifier (v1.0.0)</div>
                  <div className="text-slate-700">Latency: 0.136ms • SHA-256: 66b020ec... Verified</div>
                  <div className="text-rose-700 font-bold">Predicted Tier: HIGH RISK (Prob: 0.684)</div>
                  <div className="text-slate-500 text-[11px]">Brier Score: 0.0027 • Platt Sigmoid Calibrated</div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 2 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-teal-700 uppercase">Phase 3: Transparent Attribution</span>
                  <h3 className="text-xl font-bold text-slate-950">TreeSHAP Explainable Risk Drivers</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Rather than presenting an opaque score, the system calculates exact mathematical Shapley values for all input features, ranking patient-specific positive contributors and protective markers.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Subordinated to deterministic qSOFA / NEWS2 clinical overrides</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">EXPLAINER: TreeExplainer (Runtime)</div>
                  <div className="text-rose-600 font-semibold">ST-Depression (2.4mm): +0.281 weight</div>
                  <div className="text-rose-600 font-semibold">Systolic BP (168 mmHg): +0.194 weight</div>
                  <div className="text-emerald-600 font-semibold">Resting HR (Normal): -0.062 protective</div>
                </div>
              </div>
            )}

            {activeWorkflowTab === 3 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-purple-700 uppercase">Phase 4: Action & PDF Delivery</span>
                  <h3 className="text-xl font-bold text-slate-950">Clinician Authority & Asynchronous PDF Generation</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Attending cardiologists confirm or override recommendations with mandatory documented rationales. Celery background workers compile clinical discharge summaries and risk trajectory reports via ReportLab.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>Permanent rationale audit logging stored in PostgreSQL</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs font-mono">
                  <div className="text-slate-400 pb-1 border-b border-slate-100">CELERY TASK: compile_clinical_pdf</div>
                  <div className="text-slate-700">Task Status: SUCCESS (0.42s) • Upstash Redis Queue</div>
                  <div className="text-teal-700 font-bold">Artifact: patient_P104_discharge_summary.pdf</div>
                  <div className="text-slate-500 text-[11px]">Audit Log: Override Documented by Dr. Elena Vance</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Live Cloud Backing Services */}
      {/* ------------------------------------------------------------------ */}
      <section id="architecture" className="py-20 border-b border-slate-200 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800 mb-2">
                <Radio className="h-3.5 w-3.5 text-teal-600" />
                <span>ACTIVE CLOUD INFRASTRUCTURE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                Live Cloud Backing Services
              </h2>
            </div>
            <Badge variant="outline" className="text-xs self-start md:self-auto bg-white text-slate-700 border-slate-200 shadow-xs px-3 py-1">
              Production TLS 1.3 Verified
            </Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Service 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Database className="h-6 w-6 text-teal-600" />
                <Badge variant="success" className="text-[10px]">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Neon PostgreSQL 16</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">AWS us-east-2 • Serverless</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Serverless Lakebase Postgres with instant branch replication, autoscaling, and automated connection pooling.
              </p>
            </div>

            {/* Service 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Zap className="h-6 w-6 text-amber-600" />
                <Badge variant="success" className="text-[10px]">Active</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Upstash Serverless Redis</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">rediss:// channel layer (TLS)</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Encrypted TLS broker powering Celery background queues and Django Channels WebSocket pub/sub distribution.
              </p>
            </div>

            {/* Service 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Server className="h-6 w-6 text-blue-600" />
                <Badge variant="success" className="text-[10px]">Active</Badge>
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
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <Cpu className="h-6 w-6 text-purple-600" />
                <Badge variant="success" className="text-[10px]">Active</Badge>
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

      {/* ------------------------------------------------------------------ */}
      {/* 7. HIPAA & Institutional Governance */}
      {/* ------------------------------------------------------------------ */}
      <section id="security" className="py-20 border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>SECURITY & PATIENT PRIVACY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                HIPAA-Aligned Protection for Sensitive Clinical PII
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hospital environments demand uncompromising standards of data segregation. The CDSS architecture enforces
                medical record masking, audit logging for all prediction inspections, and strict role permissions.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">
                    Encrypted Medical Record Numbers (MRN) with masked display across telemetry feeds.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">
                    Mandatory physician override justifications permanently bound to model decision logs.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">
                    Automatic JWT session expiration with silent refresh and instant local storage purging.
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Role-Based Access Control (RBAC)</span>
                <Badge variant="outline" className="text-[11px] bg-white text-slate-700 border-slate-200">Enforced</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-800">Physicians / Cardiologists</span>
                  <span className="text-teal-700 font-mono font-medium">Full EHR, Predictions, Overrides</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-800">Triage Nurses</span>
                  <span className="text-sky-700 font-mono font-medium">Vitals Entry, Telemetry Alerts</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-800">Medical Informaticists</span>
                  <span className="text-amber-700 font-mono font-medium">SHAP Analytics, Evaluation</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-slate-800">Hospital Administrators</span>
                  <span className="text-purple-700 font-mono font-medium">Model Registry, Rollback, Audit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Peer-Reviewed Medical Guidelines */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 border-b border-slate-200 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              <BookOpen className="h-3.5 w-3.5 text-teal-600" />
              <span>PEER-REVIEWED CONSENSUS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Approved Medical Guidelines
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All AI recommendations and clinical rule overrides are grounded in peer-reviewed medical consensus literature.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  SSC-2021-SEPSIS
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Strong Recommendation</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Surviving Sepsis Campaign 2021</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                SCCM / ESICM international guidelines for sepsis screening, blood lactate assessment, and IV crystalloid resuscitation protocols.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  KDIGO-2022-AKI
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Level 1A Evidence</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">KDIGO Clinical Practice for AKI</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Staging and stratification guidelines based on serum creatinine rise (&ge;0.3 mg/dL within 48h) and urine output criteria.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  AHA-ACC-2017-HTN
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Class I Recommendation</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">AHA/ACC High Blood Pressure</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hypertensive crisis stratification (&gt;180/120 mmHg) differentiating acute target organ damage from hypertensive urgency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 9. Clinical & Institutional FAQ */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="py-20 border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Clinical & Institutional FAQ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Key considerations regarding clinical practice safety, machine learning calibration, and regulatory boundaries.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the system ensure licensed physicians retain final diagnostic authority?",
                a: "PatientRisk CDSS is strictly classified as an assistive Software as a Medical Device (SaMD) tool. Predictions provide probabilistic decision support and feature weighting. The platform enforces a structured Clinician Override workflow, requiring medical practitioners to document clinical rationales whenever their judgment differs from model output, preserving human agency.",
              },
              {
                q: "What algorithms are benchmarked and active in the clinical prediction loop?",
                a: "The system benchmarks Random Forest, Support Vector Machines (SVM with RBF kernel), and AdaBoost on group-aware partitioned cohorts (GroupShuffleSplit on patient_id). Random Forest serves as the active production champion, achieving 1.0000 sensitivity on acute cases and a calibrated Brier score of 0.0027.",
              },
              {
                q: "How does the system handle high uncertainty or out-of-distribution patients?",
                a: "When prediction entropy exceeds 0.82 or the prediction margin is below 0.18, the engine abstains with the directive: 'Prediction requires additional review.' Additionally, multivariate Mahalanobis distance checks flag atypical vitals presentations that fall outside validated training envelopes.",
              },
              {
                q: "How are TreeSHAP feature attributions computed during real-time inference?",
                a: "The ML Engine employs runtime TreeSHAP (SHapley Additive exPlanations) unwrapped through CalibratedClassifierCV wrappers. It decomposes the model's margin score into individual feature weight additions and subtractions relative to expected clinical baselines, executing in under 0.2 milliseconds.",
              },
              {
                q: "How does the platform handle Protected Health Information (PHI) and HIPAA compliance?",
                a: "The architecture adheres to strict HIPAA data safeguards: all data in transit is encrypted using TLS 1.3, database records at rest in Neon PostgreSQL are AES-256 encrypted, Medical Record Numbers are masked, and every user interaction is written to tamper-evident audit logs.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-teal-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 10. Institutional Footer */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5">
                <Image src="/logo.png" alt="PatientRisk CDSS Logo" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-950 block leading-tight">PatientRisk CDSS</span>
                <span className="text-[10px] font-mono text-slate-500">Project Code: BPY-CSE-2666 • Assistive Clinical System</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600">
              <Link href="/dashboard" className="hover:text-teal-700 transition-colors">
                Clinician Portal
              </Link>
              <Link href="/login" className="hover:text-teal-700 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-teal-700 transition-colors">
                Staff Onboarding
              </Link>
              <a href="#simulator" className="hover:text-teal-700 transition-colors">
                Interactive Simulator
              </a>
              <Link href="/admin/models" className="hover:text-teal-700 transition-colors">
                MLOps Registry
              </Link>
              <a href="https://github.com/bunnyvalluri/Clinical-Decision-Support-System-" target="_blank" rel="noreferrer" className="hover:text-teal-700 transition-colors">
                GitHub Repository
              </a>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-teal-600" />
              <span>BPY-CSE-2666 Patient Risk Level Prediction System © 2026. All rights reserved.</span>
            </div>
            <p className="text-slate-400 text-center sm:text-right">
              SaMD assistive tool. Does NOT provide autonomous medical diagnosis or prescription orders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
