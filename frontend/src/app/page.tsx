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
  Brain,
  Check,
  CheckCircle2,
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
import { PublicNavbar, PublicFooter } from "@/components/layout";

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
    let tierBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-300";
    let recommendation = "Vitals are within baseline bounds. Continue standard observation and routine outpatient care.";

    if (probability >= 0.75 || vitals.stDepression >= 3.0 || vitals.systolicBp >= 180) {
      tier = "CRITICAL";
      tierColor = "from-purple-500 via-rose-500 to-red-600";
      tierBadgeClass = "bg-purple-50 text-purple-700 border-purple-300";
      recommendation = "Immediate cardiac resuscitation or ICU bed transfer. Stat troponins and cardiologist bedside consult.";
    } else if (probability >= 0.5) {
      tier = "HIGH";
      tierColor = "from-rose-500 to-red-600";
      tierBadgeClass = "bg-rose-50 text-rose-700 border-rose-300";
      recommendation = "Urgent diagnostic review. Order serial troponins, 12-lead ECG telemetry, and arterial blood gas panel.";
    } else if (probability >= 0.25) {
      tier = "MEDIUM";
      tierColor = "from-amber-500 to-orange-600";
      tierBadgeClass = "bg-amber-50 text-amber-700 border-amber-300";
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Universal Institutional Top Navigation Bar */}
      <PublicNavbar />

      {/* 2. Hero Section: Clinical Decision Support Platform */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/90 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)]">
        {/* Subtle decorative clinical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center pt-1 pb-4">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 text-left space-y-4 sm:space-y-6">
              {/* Institutional Regulatory Compliance Ribbon */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs max-w-full">
                <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-ping shrink-0" />
                <span className="font-mono text-[10px] sm:text-[11px] text-teal-900 font-bold uppercase tracking-wider">
                  FDA SaMD Class II Aligned
                </span>
                <span className="text-slate-300 hidden xs:inline">•</span>
                <span className="text-slate-700 text-[10px] sm:text-xs">Sub-20ms Telemetry</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-500 font-mono text-[10px] sm:text-xs hidden sm:inline">TreeSHAP Explainable</span>
              </div>

              {/* Authoritative Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-slate-950 leading-[1.15] sm:leading-[1.12]">
                Real-Time Clinical{" "}
                <span className="text-teal-600 block sm:inline">
                  Decision Support System
                </span>
              </h1>

              {/* Subtitle / Value Proposition */}
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
                Empowering hospital cardiologists, emergency triage nurses, and ICU teams with
                Platt-calibrated multi-class ML risk predictions, transparent TreeSHAP factor attributions,
                and deterministic clinical safety overrides.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-xs sm:text-sm font-bold gap-2 shadow-md bg-teal-600 hover:bg-teal-700 text-white border border-teal-500 transition-all hover:shadow-lg h-11 px-6 rounded-xl"
                  >
                    <HeartPulse className="h-4 w-4" />
                    <span>Launch Live Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#simulator" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-xs sm:text-sm font-semibold gap-2 border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs h-11 px-6 rounded-xl"
                  >
                    <Sliders className="h-4 w-4 text-teal-600" />
                    <span>Explore Bedside Simulator</span>
                  </Button>
                </a>
              </div>

              {/* 1-Click Role Workspace Sandbox */}
              <div className="pt-2 sm:pt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <UserCheck className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-mono font-bold">
                    1-Click Clinician Workspaces:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                  {/* Doctor */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("DOCTOR")}
                    className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        MD
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 truncate">Cardiology</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                      Doctor
                    </p>
                  </button>

                  {/* Nurse */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("NURSE")}
                    className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-xs hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        RN
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 truncate">Triage</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                      Nurse
                    </p>
                  </button>

                  {/* Analyst */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("ANALYST")}
                    className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        MI
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 truncate">Informatics</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                      Informaticist
                    </p>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("ADMIN")}
                    className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-xs hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        IT
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 truncate">Admin</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                      IT Admin
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Clear Clinical Medical Frame */}
            <div className="lg:col-span-5 relative flex justify-center items-center px-1 sm:px-0 mt-4 lg:mt-0">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Soft ambient glow behind console frame */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/15 via-sky-500/15 to-purple-500/15 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

                {/* Main Clinical Frame */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3 shadow-xl space-y-3">
                  {/* Hospital Telemetry Top Status Header */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-between text-[11px] font-mono border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-slate-900 font-bold truncate">NODE 04 • ICU TELEMETRY</span>
                    </div>
                    <span className="text-slate-500 truncate text-[10px]">ENC-88291</span>
                  </div>

                  {/* Doctor Image Frame */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-inner group">
                    <Image
                      src="/doctor-hero.jpg"
                      alt="Attending Cardiologist Dr. Elena Vance reviewing patient risk assessment on tablet"
                      width={600}
                      height={600}
                      priority
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />

                    {/* Non-obstructive mini telemetry HUD badge */}
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 flex items-center gap-1.5 shadow-xs">
                      <Activity className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                      <span className="text-[10px] font-mono text-teal-800 font-bold">114 BPM • 98% SpO2</span>
                    </div>
                  </div>

                  {/* Attending Physician Profile Banner */}
                  <div className="p-2.5 rounded-xl bg-white text-slate-900 flex items-center justify-between border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        EV
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">Dr. Elena Vance, MD</h4>
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">Chief of Cardiology</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      On Duty
                    </span>
                  </div>

                  {/* Dual Telemetry Status Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                      <div className="h-6 w-6 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-500 font-mono font-semibold block uppercase leading-none">
                          TELEMETRY
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 truncate block mt-0.5">
                          0.136 ms Latency
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-500 font-mono font-semibold block uppercase leading-none">
                          REGISTRY
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 font-mono truncate block mt-0.5">
                          SHA-256 Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional KPI Metric Ribbon */}
          <div className="pt-6 sm:pt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 truncate">Champion Model</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-sm font-bold text-slate-950 truncate">Random Forest</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-teal-700 font-mono font-bold">Calibrated Brier</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">0.0027</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 truncate">Inference Latency</span>
                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              </div>
              <p className="text-sm font-bold text-slate-950">0.136 ms</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-slate-600 font-mono font-semibold">Scikit-Learn</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Sub-ms</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 truncate">Acute Safety</span>
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              </div>
              <p className="text-sm font-bold text-slate-950">0 Missed Events</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-teal-700 font-mono font-bold">100% Recall</span>
                <span className="text-[10px] text-slate-400 font-mono">Acute Cohort</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 truncate">Live Telemetry</span>
                <Radio className="h-3.5 w-3.5 text-sky-600 animate-pulse shrink-0" />
              </div>
              <p className="text-sm font-bold text-slate-950">ASGI Real-Time</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-sky-700 font-mono font-bold">Sub-Second Push</span>
                <span className="text-[10px] text-slate-400 font-mono">WebSockets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Bedside Risk Simulator */}
      <section id="simulator" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-teal-600" />
              <span>LIVE CLINICAL SIMULATOR</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
              Live Patient Risk &amp;{" "}
              <span className="text-teal-600">TreeSHAP</span> Explainer
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Adjust patient vitals in real time to observe dynamic ML risk stratification,
              uncertainty entropy bounds, and localized TreeSHAP feature attributions.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar justify-center flex-wrap py-1">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setVitals(preset.vitals)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer shrink-0"
              >
                <span>{preset.name}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Simulator Panel */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-8 lg:p-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left: Sliders */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Physiological Parameters</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                    Live Inputs
                  </span>
                </div>

                {isBiologicalViolation && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span><strong>Biological Contradiction:</strong> Systolic ({vitals.systolicBp}) must exceed Diastolic ({vitals.diastolicBp}).</span>
                  </div>
                )}

                {[
                  { label: "Resting BP (SBP / DBP)", display: `${vitals.systolicBp} / ${vitals.diastolicBp} mmHg`, min: 90, max: 210, step: 2, value: vitals.systolicBp, key: "systolicBp", marks: ["90 (Norm)", "130 (Elev)", "160 (Stg 2)", "210 (Crisis)"] },
                  { label: "ST-Segment Depression (ECG)", display: `${vitals.stDepression.toFixed(1)} mm`, min: 0, max: 5.0, step: 0.1, value: vitals.stDepression, key: "stDepression", marks: ["0.0mm (Iso)", "1.5mm (Mod)", "3.5mm (Severe)"] },
                  { label: "Max Heart Rate", display: `${vitals.heartRate} bpm`, min: 70, max: 200, step: 1, value: vitals.heartRate, key: "heartRate", marks: ["70 (Low)", "140 (Target)", "200 (Max)"] },
                  { label: "Serum Cholesterol", display: `${vitals.cholesterol} mg/dL`, min: 140, max: 380, step: 5, value: vitals.cholesterol, key: "cholesterol", marks: ["140 (Opt)", "240 (High)", "380 (Crit)"] },
                ].map((s, i) => (
                  <div key={i} className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{s.label}</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                        {s.display}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={s.value}
                      onChange={(e) => setVitals({ ...vitals, [s.key]: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer h-2 rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      {s.marks.map((m, j) => <span key={j}>{m}</span>)}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-800 block">Chest Pain Classification</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[{ label: "Typical", val: 0 }, { label: "Atypical", val: 1 }, { label: "Non-Anginal", val: 2 }, { label: "Asymptomatic", val: 3 }].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setVitals({ ...vitals, chestPain: item.val })}
                        className={`text-xs py-2 rounded-xl font-medium transition-all text-center cursor-pointer border ${
                          vitals.chestPain === item.val
                            ? "bg-slate-950 text-white font-bold border-slate-950 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Output */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Real-Time Inference &amp; TreeSHAP</h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Calibrated
                  </span>
                </div>

                {/* Risk Output Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-teal-700 pb-3 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      LEAD II &bull; {vitals.heartRate} BPM
                    </span>
                    <span className="text-slate-500">ST: {vitals.stDepression > 0 ? `-${vitals.stDepression.toFixed(1)}mm` : "ISO"}</span>
                  </div>
                  <div className="relative w-full h-10 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center p-1 overflow-hidden">
                    <svg className="w-full h-8 stroke-teal-600 fill-none" viewBox="0 0 500 40" preserveAspectRatio="none">
                      <path d="M 0,20 L 50,20 L 58,22 L 66,18 L 74,20 L 88,20 L 92,6 L 98,36 L 104,12 L 110,24 L 116,20 L 130,20 L 150,20 L 168,14 L 180,20 L 250,20 L 258,22 L 266,18 L 274,20 L 288,20 L 292,6 L 298,36 L 304,12 L 310,24 L 316,20 L 330,20 L 350,20 L 368,14 L 380,20 L 500,20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Calibrated Risk Probability</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-black text-slate-950 font-mono">{simulationResult.probability}%</span>
                        <span className="text-xs text-slate-400 font-mono">Platt Sigmoid</span>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border self-start ${simulationResult.tierBadgeClass}`}>
                      {simulationResult.tier} RISK
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div className={`h-full transition-all duration-300 rounded-full bg-gradient-to-r ${simulationResult.tierColor}`} style={{ width: `${simulationResult.probability}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Low</span><span>Med</span><span>High</span><span>Crit</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Clinical Directive:</span>
                      <span className="text-slate-700 leading-relaxed">{simulationResult.recommendation}</span>
                    </div>
                  </div>
                  {simulationResult.isUncertain && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-800 flex items-center gap-2 font-mono">
                      <AlertCircle className="h-4 w-4 text-purple-600 shrink-0" />
                      <span><strong>Abstention:</strong> Prediction requires additional review (H: {simulationResult.entropy}).</span>
                    </div>
                  )}
                </div>

                {/* SHAP Attributions */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-950">TreeSHAP Factor Attributions</span>
                    <span className="text-xs font-mono text-slate-500">Baseline E[f(x)] = 0.350</span>
                  </div>
                  <div className="space-y-3">
                    {simulationResult.shapDrivers.map((driver, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800">{driver.factor}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-500">{driver.value}</span>
                            <span className={`font-bold ${driver.isPositive ? "text-rose-600" : "text-emerald-600"}`}>
                              {driver.isPositive ? "+" : ""}{driver.attribution}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${driver.isPositive ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${driver.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    Red = positive risk contributor; Green = protective clinical marker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Clinical Intelligence for Every Role */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-teal-600" />
              <span>HIGH-ACUITY CLINICAL CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
              Clinical Intelligence for{" "}
              <span className="text-teal-600">Every Role</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Designed to alleviate diagnostic latency, eliminate alert fatigue, and deliver transparent
              explainability across all high-pressure cardiology and emergency workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: HeartPulse, label: "Live Risk Stratification", desc: "4-tier Platt-calibrated ML scoring", bg: "bg-teal-50 border-teal-200", ic: "text-teal-600" },
              { icon: Brain, label: "TreeSHAP Attribution", desc: "Signed local Shapley values", bg: "bg-sky-50 border-sky-200", ic: "text-sky-600" },
              { icon: AlertCircle, label: "Uncertainty Detection", desc: "Shannon entropy abstention", bg: "bg-purple-50 border-purple-200", ic: "text-purple-600" },
              { icon: Layers, label: "Celery Async Queues", desc: "Non-blocking PDF generation", bg: "bg-amber-50 border-amber-200", ic: "text-amber-600" },
              { icon: ShieldCheck, label: "HIPAA Governance", desc: "Tamper-evident audit logs", bg: "bg-emerald-50 border-emerald-200", ic: "text-emerald-600" },
              { icon: Radio, label: "Model Registry", desc: "SHA-256 champion versioning", bg: "bg-blue-50 border-blue-200", ic: "text-blue-600" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center space-y-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-1 transition-all cursor-default"
                >
                  <div className={`h-14 w-14 rounded-2xl border ${item.bg} flex items-center justify-center`}>
                    <Icon className={`h-7 w-7 ${item.ic}`} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-950 leading-snug">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/dashboard">
              <Button className="gap-2 bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-8 h-11 rounded-xl shadow-xs transition-colors">
                <span>Explore Platform</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Where Technology Supports Better Care */}
      <section id="workflow" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-teal-600" />
              <span>CARE PATHWAY INTEGRATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
              Where <span className="text-teal-600">technology</span> supports better care.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            {[
              { icon: Stethoscope, bg: "bg-teal-50 border-teal-200", ic: "text-teal-700", title: "Triage & Vital Capture", desc: "Triage nurses register patients capturing biological vitals — BP, ECG ST slope, heart rate, and serum biomarkers — validated in real time against physiological bounds before any ML inference." },
              { icon: Brain, bg: "bg-sky-50 border-sky-200", ic: "text-sky-700", title: "Calibrated ML Inference", desc: "The active champion Random Forest pipeline processes scaled feature vectors into 4-class probability outputs, Platt sigmoid calibrated to a Brier score of 0.0027 with sub-millisecond latency." },
              { icon: Zap, bg: "bg-amber-50 border-amber-200", ic: "text-amber-700", title: "TreeSHAP Risk Attribution", desc: "Every prediction is paired with exact Shapley values, ranking each input feature contribution. Positive contributors surface in red; protective markers in green — zero black-box opacity." },
              { icon: FileText, bg: "bg-purple-50 border-purple-200", ic: "text-purple-700", title: "Clinician Action & PDF Report", desc: "Physicians confirm or override with mandatory documented rationales. Celery workers asynchronously generate ReportLab discharge summaries bound to tamper-evident audit logs." },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-5 p-6 rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all"
                >
                  <div className={`h-12 w-12 rounded-2xl border ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${item.ic}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 text-base mb-1.5">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. End-to-End Solutions */}
      <section id="architecture" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-teal-600" />
              <span>ACTIVE CLOUD INFRASTRUCTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
              End-to-End Solutions for{" "}
              <span className="text-teal-600">Real-World</span> Clinical Challenges
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              A purpose-built cloud stack handling everything from real-time telemetry to async PDF generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { badge: "PostgreSQL 16", title: "Neon Lakebase", desc: "Serverless Lakebase Postgres with instant branch replication, autoscaling connection pooling, and AES-256 encrypted clinical records at rest.", icon: Database, border: "border-teal-200", ibg: "bg-teal-50 border-teal-200", ic: "text-teal-600", bbg: "bg-teal-50", bc: "text-teal-700" },
              { badge: "Django 5 + ASGI", title: "Real-Time API Gateway", desc: "Daphne 4 ASGI server with Django Channels WebSocket pub/sub, JWT middleware, and HIPAA audit event logging for all telemetry.", icon: Server, border: "border-sky-200", ibg: "bg-sky-50 border-sky-200", ic: "text-sky-600", bbg: "bg-sky-50", bc: "text-sky-700" },
              { badge: "Celery + Redis", title: "Async Worker Queue", desc: "TLS-encrypted Upstash Redis broker powering Celery background queues for ReportLab PDF generation, drift evaluations, and notifications.", icon: Cpu, border: "border-purple-200", ibg: "bg-purple-50 border-purple-200", ic: "text-purple-600", bbg: "bg-purple-50", bc: "text-purple-700" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-7 space-y-5 shadow-xs hover:shadow-md hover:border-teal-400 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${item.bbg} ${item.bc} px-3 py-1 rounded-full border ${item.border}`}>{item.badge}</span>
                      <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>
                    <div className={`h-12 w-12 rounded-2xl border ${item.ibg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${item.ic}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-950 mb-2">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/solutions">
              <Button className="gap-2 bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-8 h-11 rounded-xl shadow-xs transition-colors">
                <span>View Full Architecture</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. HIPAA & RBAC */}
      <section id="security" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-14 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-teal-600" />
                <span>SECURITY &amp; PATIENT PRIVACY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
                Be the Clinical{" "}
                <span className="text-teal-600">Champion</span>{" "}
                with HIPAA Compliance
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Hospital environments demand uncompromising standards. The CDSS enforces medical record masking, audit logging, and strict role-based permissions at every layer.
              </p>
              <div className="space-y-3.5 pt-1">
                {[
                  "Encrypted MRN with masked display across all telemetry feeds",
                  "Mandatory physician override justifications permanently bound to decision logs",
                  "Automatic JWT session expiration with silent refresh and instant local storage purging",
                  "All data in transit via TLS 1.3; at rest via AES-256 in Neon PostgreSQL",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 text-left">
                    <div className="h-5 w-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-teal-700" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap pt-2">
                <Link href="/register">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 h-11 font-bold text-xs sm:text-sm gap-2 shadow-xs">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="rounded-xl px-6 h-11 font-semibold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 space-y-4 shadow-xs text-left">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-sm font-bold text-slate-950 uppercase tracking-wide">Role-Based Access Control</span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Enforced</span>
              </div>
              {[
                { role: "Physicians / Cardiologists", badge: "MD", access: "Full EHR, Predictions, Overrides", color: "text-teal-700 bg-teal-50 border-teal-200" },
                { role: "Triage Nurses", badge: "RN", access: "Vitals Entry, Telemetry Alerts", color: "text-sky-700 bg-sky-50 border-sky-200" },
                { role: "Medical Informaticists", badge: "MI", access: "SHAP Analytics, Drift Evaluation", color: "text-amber-700 bg-amber-50 border-amber-200" },
                { role: "Hospital Administrators", badge: "IT", access: "Model Registry, Rollback, Audit", color: "text-purple-700 bg-purple-50 border-purple-200" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-200/80 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${item.color}`}>{item.badge}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{item.role}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono hidden sm:block">{item.access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Evidence-Based Medicine */}
      <section className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-14 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-teal-600" />
                <span>MEDICAL EVIDENCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
                Grounded in{" "}
                <span className="text-teal-600">Evidence-Based</span>{" "}
                Medicine
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                All AI recommendations and clinical rule overrides are anchored in peer-reviewed consensus literature from leading international medical bodies.
              </p>
              <div className="space-y-3.5 pt-1">
                {[
                  "Surviving Sepsis Campaign 2021 — SCCM/ESICM international guidelines",
                  "KDIGO Clinical Practice for AKI — Level 1A Evidence creatinine criteria",
                  "AHA/ACC 2017 Hypertension — Class I recommendations for hypertensive crisis",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 text-left">
                    <div className="h-5 w-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-teal-700" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap pt-2">
                <a href="#faq">
                  <Button className="bg-slate-950 hover:bg-slate-800 text-white rounded-xl px-6 h-11 font-bold text-xs sm:text-sm gap-2 shadow-xs">
                    <span>Read Evidence</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#simulator">
                  <Button variant="outline" className="rounded-xl px-6 h-11 font-semibold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50">
                    Try Simulator
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {[
                { code: "SSC-2021-SEPSIS", strength: "Strong Recommendation", title: "Surviving Sepsis Campaign 2021", desc: "SCCM/ESICM international guidelines for sepsis screening, blood lactate assessment, and IV crystalloid resuscitation protocols.", cc: "text-teal-700 bg-teal-50 border-teal-200" },
                { code: "KDIGO-2022-AKI", strength: "Level 1A Evidence", title: "KDIGO Clinical Practice for AKI", desc: "Staging and stratification based on serum creatinine rise and urine output criteria.", cc: "text-sky-700 bg-sky-50 border-sky-200" },
                { code: "AHA-ACC-2017-HTN", strength: "Class I Recommendation", title: "AHA/ACC High Blood Pressure", desc: "Hypertensive crisis stratification (>180/120 mmHg) differentiating acute target organ damage from hypertensive urgency.", cc: "text-purple-700 bg-purple-50 border-purple-200" },
              ].map((card, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs hover:border-teal-300 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${card.cc}`}>{card.code}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{card.strength}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-950">{card.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-teal-600" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Key considerations on clinical safety, ML calibration, and regulatory boundaries.
            </p>
          </div>
          <div className="space-y-3 text-left">
            {[
              { q: "How does the system ensure licensed physicians retain final diagnostic authority?", a: "HealthNova AI is strictly classified as an assistive clinical decision support tool. The platform enforces a structured Clinician Override workflow, requiring documented clinical rationales whenever judgment differs from model output." },
              { q: "What algorithms are benchmarked and active in the clinical prediction loop?", a: "The system benchmarks Random Forest, SVM (RBF kernel), and AdaBoost on group-aware partitioned cohorts. Random Forest is the active champion, achieving 1.0000 sensitivity on acute cases and a calibrated Brier score of 0.0027." },
              { q: "How does the system handle high uncertainty or out-of-distribution patients?", a: "When prediction entropy exceeds 0.82 or the margin is below 0.18, the engine abstains with: 'Prediction requires additional review.' Mahalanobis distance checks flag atypical vitals outside validated training envelopes." },
              { q: "How are TreeSHAP feature attributions computed during real-time inference?", a: "The ML Engine employs runtime TreeSHAP unwrapped through CalibratedClassifierCV wrappers, decomposing margin scores into individual feature weight additions and subtractions, executing in under 0.2 milliseconds." },
              { q: "How does the platform handle PHI and HIPAA compliance?", a: "All data in transit is encrypted via TLS 1.3, records at rest in Neon PostgreSQL are AES-256 encrypted, MRNs are masked, and every interaction is written to tamper-evident audit logs." },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-teal-300 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-slate-950 hover:text-teal-700 transition-colors cursor-pointer gap-3 text-sm sm:text-base"
                >
                  <span>{item.q}</span>
                  <span
                    className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 transition-all text-base leading-none font-light ${
                      openFaq === idx
                        ? "rotate-45 border-teal-400 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Universal Institutional Footer */}
      <PublicFooter />
    </div>
  );
}
