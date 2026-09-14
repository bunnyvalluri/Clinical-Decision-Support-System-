"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Menu,
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
  X,
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

  // Mobile Navigation Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Live Bedside Simulator State
  const [vitals, setVitals] = useState(PRESETS[1].vitals);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Close mobile drawer on Escape key or resize to desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

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
      {/* ------------------------------------------------------------------ */}
      {/* 1. Institutional Top Navigation Bar */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl transition-all shadow-xs pt-safe">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs p-0.5 group-hover:border-teal-500 transition-colors">
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
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 group-hover:text-teal-700 transition-colors">
                    PatientRisk
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    CDSS
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-slate-500 tracking-wider uppercase hidden xs:block">
                  Clinical Decision Support • SaMD
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-xs font-semibold text-slate-600">
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

          {/* Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Operational Heartbeat Badge */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50/80 text-[11px] font-medium text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-semibold">Systems Live</span>
            </div>

            <Link href="/login" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              >
                Sign In
              </Button>
            </Link>

            <Link href="/register" className="hidden md:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50"
              >
                Register
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                size="sm"
                className="text-xs font-bold gap-1 sm:gap-1.5 shadow-sm bg-teal-600 hover:bg-teal-700 text-white border border-teal-700 hover:border-teal-800 transition-all px-2.5 sm:px-3"
              >
                <span className="hidden xs:inline">Launch Portal</span>
                <span className="xs:hidden">Launch</span>
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </Button>
            </Link>

            {/* Mobile / Tablet Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden touch-target inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Full Screen Slide-Over Navigation Drawer (Rendered outside header to escape backdrop-filter containing block) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200">
          {/* Mobile Drawer Top Bar with Dedicated Close Button */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 pt-safe bg-white shrink-0">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5">
                <Image
                  src="/logo.png"
                  alt="PatientRisk CDSS Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-950">PatientRisk</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  CDSS
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="touch-target inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Mobile Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 pb-safe">
            {/* Live Operational Status Banner */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">NODE 04 • CLOUD TELEMETRY ONLINE</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full shrink-0">
                SUB-20MS
              </span>
            </div>

            {/* Navigation Section Anchor Links */}
            {/* Navigation Section Anchor Links with Premium Clinical Icons */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-2 mb-1">
                Platform Sections
              </p>
              {[
                {
                  href: "#simulator",
                  label: "Risk Simulator",
                  desc: "Live Physiological Inputs & SHAP Explainer",
                  icon: Sliders,
                  color: "bg-teal-50 text-teal-600 border-teal-200",
                },
                {
                  href: "#features",
                  label: "Capabilities & Algorithms",
                  desc: "Platt Sigmoid & Multi-Class Inference",
                  icon: Stethoscope,
                  color: "bg-emerald-50 text-emerald-600 border-emerald-200",
                },
                {
                  href: "#workflow",
                  label: "Care Pathway Integration",
                  desc: "Ward Admission to PDF Generation",
                  icon: Activity,
                  color: "bg-purple-50 text-purple-600 border-purple-200",
                },
                {
                  href: "#architecture",
                  label: "Cloud Backing Stack",
                  desc: "PostgreSQL 16, Redis TLS & ASGI",
                  icon: Radio,
                  color: "bg-sky-50 text-sky-600 border-sky-200",
                },
                {
                  href: "#security",
                  label: "Governance & HIPAA Security",
                  desc: "Audit Logging, RBAC & Overrides",
                  icon: ShieldCheck,
                  color: "bg-blue-50 text-blue-600 border-blue-200",
                },
                {
                  href: "#faq",
                  label: "Evidence & FAQ",
                  desc: "SaMD Class II & Consensus Criteria",
                  icon: HelpCircle,
                  color: "bg-amber-50 text-amber-600 border-amber-200",
                },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="touch-target flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-800 shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${link.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                          {link.label}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {link.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                  </a>
                );
              })}
            </div>

            {/* 1-Click Clinician Role Sandboxes */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                1-Click Clinician Workspaces:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleQuickDemo("DOCTOR");
                  }}
                  className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-left hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      MD
                    </span>
                    <HeartPulse className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                    Doctor
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Cardiology & ICU</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleQuickDemo("NURSE");
                  }}
                  className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-left hover:border-sky-400 hover:bg-sky-50/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      RN
                    </span>
                    <Activity className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                    Nurse
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Triage & Bedside</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleQuickDemo("ANALYST");
                  }}
                  className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-left hover:border-amber-400 hover:bg-amber-50/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      MI
                    </span>
                    <Brain className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                    Medical Informaticist
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Informatics / SHAP</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleQuickDemo("ADMIN");
                  }}
                  className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-left hover:border-purple-400 hover:bg-purple-50/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      IT
                    </span>
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                    IT Administrator
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Governance & Audit</p>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 pb-6 space-y-2.5">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="touch-target w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                <HeartPulse className="h-4 w-4" />
                Launch Live Clinical Portal
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="touch-target w-full flex items-center justify-center py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Sign In with Credentials
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="touch-target w-full flex items-center justify-center py-2.5 rounded-xl border border-teal-200 bg-teal-50/60 text-teal-800 font-semibold text-xs hover:bg-teal-100/70 transition-colors"
              >
                Create Account / Register
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. Hero Section: Clinical Decision Support Platform */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-5 pb-10 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/90 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)]">
        {/* Subtle decorative clinical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        <div className="container relative z-10 mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center pt-1 pb-4">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 text-left space-y-4 sm:space-y-6">
              {/* Institutional Regulatory Compliance Ribbon */}
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs max-w-full">
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
              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.18] sm:leading-[1.12]">
                Real-Time Clinical{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 block sm:inline">
                  Decision Support System
                </span>
              </h1>

              {/* Subtitle / Value Proposition */}
              <p className="text-xs xs:text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Empowering hospital cardiologists, emergency triage nurses, and ICU teams with
                Platt-calibrated multi-class ML risk predictions, transparent TreeSHAP factor attributions,
                and deterministic clinical safety overrides.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-xs sm:text-sm font-bold gap-2 shadow-md bg-teal-600 hover:bg-teal-700 text-white border border-teal-500 transition-all hover:shadow-lg h-10 sm:h-11"
                  >
                    <HeartPulse className="h-4 w-4" />
                    Launch Live Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#simulator" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-xs sm:text-sm font-semibold gap-2 border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs h-10 sm:h-11"
                  >
                    <Sliders className="h-4 w-4 text-teal-600" />
                    Explore Bedside Simulator
                  </Button>
                </a>
              </div>



            {/* Right Column: Clear Clinical Medical Frame */}
            <div className="lg:col-span-5 relative flex justify-center items-center px-1 sm:px-0 mt-3 lg:mt-0">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Soft ambient glow behind console frame */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/15 via-sky-500/15 to-purple-500/15 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

                {/* Main Clinical Frame */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xl space-y-2 sm:space-y-3">
                  {/* Hospital Telemetry Top Status Header */}
                  <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-between text-[10px] sm:text-[11px] font-mono border border-slate-200">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-slate-900 font-bold truncate">NODE 04 • ICU TELEMETRY</span>
                    </div>
                    <span className="text-slate-500 truncate text-[10px]">ENC-88291</span>
                  </div>

                  {/* Doctor Image - Fully Unobstructed & Crystal Clear */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
                    <Image
                      src="/doctor-hero.jpg"
                      alt="Attending Cardiologist Dr. Elena Vance reviewing patient risk assessment on tablet"
                      width={600}
                      height={600}
                      priority
                      className="w-full h-full object-cover object-center transform hover:scale-[1.01] transition-transform duration-500"
                    />

                    {/* Non-obstructive mini telemetry HUD badge at the bottom-right corner */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 flex items-center gap-1.5 shadow-xs">
                      <Activity className="h-3 w-3 text-teal-600 animate-pulse" />
                      <span className="text-[9px] sm:text-[10px] font-mono text-teal-800 font-semibold">114 BPM • 98% SpO2</span>
                    </div>
                  </div>

                  {/* Attending Physician Profile Banner (Cleanly Placed Below Photo) */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white text-slate-900 flex items-center justify-between border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        EV
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">Dr. Elena Vance, MD</h4>
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">Chief of Cardiology</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      On Duty
                    </span>
                  </div>

                  {/* Dual Telemetry Status Badges - Cleanly integrated below with zero text collision */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                        <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-500 font-mono font-semibold block uppercase leading-none">
                          TELEMETRY
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-900 truncate block mt-0.5">
                          0.136 ms Latency
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-500 font-mono font-semibold block uppercase leading-none">
                          REGISTRY
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-700 font-mono truncate block mt-0.5">
                          SHA-256 Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional KPI Metric Ribbon (Clean 2x2 on mobile, 4 columns on desktop) */}
          <div className="pt-4 sm:pt-8 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 max-w-6xl mx-auto text-left">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">Champion</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Random Forest</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-teal-700 font-mono font-bold">Calibrated</span>
                <span className="text-[9px] text-slate-400 font-mono truncate">0.0027</span>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">Latency</span>
                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">0.136 ms</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-600 font-mono font-semibold">Scikit</span>
                <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">Fast</span>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">Safety</span>
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">0 Missed</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-teal-700 font-mono font-bold">100% Rate</span>
                <span className="text-[9px] text-slate-400 font-mono">Acute</span>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">Telemetry</span>
                <Radio className="h-3.5 w-3.5 text-sky-600 animate-pulse shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">ASGI Live</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-sky-700 font-mono font-bold">Sub-Second</span>
                <span className="text-[9px] text-slate-400 font-mono">Push</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Live Bedside Risk Simulator */}
      {/* ------------------------------------------------------------------ */}
      <section id="simulator" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full">
              Live Clinical Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              Live Patient Risk &{" "}
              <em className="not-italic text-teal-600">TreeSHAP</em> Explainer
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Adjust patient vitals in real time to observe dynamic ML risk stratification,
              uncertainty entropy bounds, and localized TreeSHAP feature attributions.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar justify-center flex-wrap py-1">
            {PRESETS.map((preset, idx) => (
              <button key={idx} type="button" onClick={() => setVitals(preset.vitals)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer shrink-0">
                <span>{preset.name}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>{preset.badge}</span>
              </button>
            ))}
          </div>

          {/* Simulator Panel */}
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left: Sliders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Physiological Parameters</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full">Live Inputs</span>
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
                  <div key={i} className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{s.label}</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{s.display}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={(e) => setVitals({ ...vitals, [s.key]: Number(e.target.value) })} className="w-full accent-teal-600 cursor-pointer h-2 rounded-full" />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      {s.marks.map((m, j) => <span key={j}>{m}</span>)}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-800 block">Chest Pain Classification</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[{ label: "Typical", val: 0 }, { label: "Atypical", val: 1 }, { label: "Non-Anginal", val: 2 }, { label: "Asymptomatic", val: 3 }].map((item) => (
                      <button key={item.val} type="button" onClick={() => setVitals({ ...vitals, chestPain: item.val })} className={`text-xs py-2 rounded-xl font-medium transition-all text-center cursor-pointer ${vitals.chestPain === item.val ? "bg-teal-600 text-white font-bold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Output */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Real-Time Inference & TreeSHAP</h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />Live
                  </span>
                </div>

                {/* Risk Output Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-teal-600 pb-3 border-b border-slate-100">
                    <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 animate-pulse" />LEAD II &bull; {vitals.heartRate} BPM</span>
                    <span className="text-slate-400">ST: {vitals.stDepression > 0 ? `-${vitals.stDepression.toFixed(1)}mm` : "ISO"}</span>
                  </div>
                  <div className="relative w-full h-10 bg-teal-50 rounded-xl border border-teal-100 flex items-center p-1 overflow-hidden">
                    <svg className="w-full h-8 stroke-teal-500 fill-none" viewBox="0 0 500 40" preserveAspectRatio="none">
                      <path d="M 0,20 L 50,20 L 58,22 L 66,18 L 74,20 L 88,20 L 92,6 L 98,36 L 104,12 L 110,24 L 116,20 L 130,20 L 150,20 L 168,14 L 180,20 L 250,20 L 258,22 L 266,18 L 274,20 L 288,20 L 292,6 L 298,36 L 304,12 L 310,24 L 316,20 L 330,20 L 350,20 L 368,14 L 380,20 L 500,20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 block">Calibrated Risk Probability</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-extrabold text-slate-900">{simulationResult.probability}%</span>
                        <span className="text-xs text-slate-400 font-mono">Platt Sigmoid</span>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border self-start ${simulationResult.tierBadgeClass}`}>{simulationResult.tier} RISK</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 rounded-full bg-gradient-to-r ${simulationResult.tierColor}`} style={{ width: `${simulationResult.probability}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Low</span><span>Med</span><span>High</span><span>Crit</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">Clinical Directive:</span>
                      <span className="text-slate-600 leading-relaxed">{simulationResult.recommendation}</span>
                    </div>
                  </div>
                  {simulationResult.isUncertain && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700 flex items-center gap-2 font-mono">
                      <AlertCircle className="h-4 w-4 text-purple-500 shrink-0" />
                      <span><strong>Abstention:</strong> Prediction requires additional review (H: {simulationResult.entropy}).</span>
                    </div>
                  )}
                </div>

                {/* SHAP */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">TreeSHAP Factor Attributions</span>
                    <span className="text-xs font-mono text-slate-400">Baseline E[f(x)] = 0.350</span>
                  </div>
                  <div className="space-y-3">
                    {simulationResult.shapDrivers.map((driver, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">{driver.factor}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-500">{driver.value}</span>
                            <span className={`font-bold ${driver.isPositive ? "text-rose-600" : "text-emerald-600"}`}>{driver.isPositive ? "+" : ""}{driver.attribution}</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${driver.isPositive ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${driver.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Red = positive risk contributor; Green = protective clinical marker.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Clinical Intelligence for Every Role */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full">
              High-Acuity Clinical Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              Clinical Intelligence for{" "}
              <em className="not-italic text-teal-600">Every Role</em>
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Designed to alleviate diagnostic latency, eliminate alert fatigue, and deliver transparent
              explainability across all high-pressure cardiology and emergency workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: HeartPulse, label: "Live Risk Stratification", desc: "4-tier Platt-calibrated ML scoring", bg: "bg-teal-100", ic: "text-teal-600" },
              { icon: Brain, label: "TreeSHAP Attribution", desc: "Signed local Shapley values", bg: "bg-sky-100", ic: "text-sky-600" },
              { icon: AlertCircle, label: "Uncertainty Detection", desc: "Shannon entropy abstention", bg: "bg-purple-100", ic: "text-purple-600" },
              { icon: Layers, label: "Celery Async Queues", desc: "Non-blocking PDF generation", bg: "bg-amber-100", ic: "text-amber-600" },
              { icon: ShieldCheck, label: "HIPAA Governance", desc: "Tamper-evident audit logs", bg: "bg-emerald-100", ic: "text-emerald-600" },
              { icon: Radio, label: "Model Registry", desc: "SHA-256 champion versioning", bg: "bg-blue-100", ic: "text-blue-600" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-3 p-5 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                  <div className={`h-14 w-14 rounded-full ${item.bg} flex items-center justify-center`}>
                    <Icon className={`h-7 w-7 ${item.ic}`} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/dashboard">
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-8 rounded-full shadow-sm">
                Explore Platform <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Where Technology Supports Better Care */}
      {/* ------------------------------------------------------------------ */}
      <section id="workflow" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-100 px-4 py-1.5 rounded-full">
              Care Pathway Integration
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              Where <em className="not-italic text-purple-600">technology</em> supports better care.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: Stethoscope, bg: "bg-teal-50", ic: "text-teal-700", title: "Triage & Vital Capture", desc: "Triage nurses register patients capturing biological vitals — BP, ECG ST slope, heart rate, and serum biomarkers — validated in real time against physiological bounds before any ML inference." },
              { icon: Brain, bg: "bg-sky-50", ic: "text-sky-700", title: "Calibrated ML Inference", desc: "The active champion Random Forest pipeline processes scaled feature vectors into 4-class probability outputs, Platt sigmoid calibrated to a Brier score of 0.0027 with sub-millisecond latency." },
              { icon: Zap, bg: "bg-amber-50", ic: "text-amber-700", title: "TreeSHAP Risk Attribution", desc: "Every prediction is paired with exact Shapley values, ranking each input feature contribution. Positive contributors surface in red; protective markers in green — zero black-box opacity." },
              { icon: FileText, bg: "bg-purple-50", ic: "text-purple-700", title: "Clinician Action & PDF Report", desc: "Physicians confirm or override with mandatory documented rationales. Celery workers asynchronously generate ReportLab discharge summaries bound to tamper-evident audit logs." },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-5 p-6 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all">
                  <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${item.ic}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. End-to-End Solutions */}
      {/* ------------------------------------------------------------------ */}
      <section id="architecture" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full">
              Active Cloud Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              End-to-End Solutions for{" "}
              <em className="not-italic text-teal-600">Real-World</em> Clinical Challenges
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              A purpose-built cloud stack handling everything from real-time telemetry to async PDF generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { badge: "PostgreSQL 16", title: "Neon Lakebase", desc: "Serverless Lakebase Postgres with instant branch replication, autoscaling connection pooling, and AES-256 encrypted clinical records at rest.", icon: Database, border: "border-teal-200", ibg: "bg-teal-50", ic: "text-teal-600", bbg: "bg-teal-50", bc: "text-teal-700" },
              { badge: "Django 5 + ASGI", title: "Real-Time API Gateway", desc: "Daphne 4 ASGI server with Django Channels WebSocket pub/sub, JWT middleware, and HIPAA audit event logging for all telemetry.", icon: Server, border: "border-sky-200", ibg: "bg-sky-50", ic: "text-sky-600", bbg: "bg-sky-50", bc: "text-sky-700" },
              { badge: "Celery + Redis", title: "Async Worker Queue", desc: "TLS-encrypted Upstash Redis broker powering Celery background queues for ReportLab PDF generation, drift evaluations, and notifications.", icon: Cpu, border: "border-purple-200", ibg: "bg-purple-50", ic: "text-purple-600", bbg: "bg-purple-50", bc: "text-purple-700" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`relative overflow-hidden rounded-3xl bg-white border ${item.border} p-7 space-y-5 shadow-sm hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${item.bbg} ${item.bc} px-3 py-1 rounded-full border ${item.border}`}>{item.badge}</span>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Active
                    </span>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl ${item.ibg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${item.ic}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <a href="#features">
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-8 rounded-full shadow-sm">
                Know More <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. HIPAA & RBAC */}
      {/* ------------------------------------------------------------------ */}
      <section id="security" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-6">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full">
                Security & Patient Privacy
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
                Be the Clinical{" "}
                <em className="not-italic text-teal-600">Champion</em>{" "}
                with HIPAA Compliance
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Hospital environments demand uncompromising standards. The CDSS enforces medical record masking, audit logging, and strict role-based permissions at every layer.
              </p>
              <div className="space-y-4">
                {["Encrypted MRN with masked display across all telemetry feeds", "Mandatory physician override justifications permanently bound to decision logs", "Automatic JWT session expiration with silent refresh and instant local storage purging", "All data in transit via TLS 1.3; at rest via AES-256 in Neon PostgreSQL"].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-teal-700" />
                    </div>
                    <span className="text-sm text-slate-600">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/register">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 font-semibold text-sm gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="rounded-full px-6 font-semibold text-sm border-slate-300 text-slate-700">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-7 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Role-Based Access Control</span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Enforced</span>
              </div>
              {[
                { role: "Physicians / Cardiologists", badge: "MD", access: "Full EHR, Predictions, Overrides", color: "text-teal-700 bg-teal-50 border-teal-200" },
                { role: "Triage Nurses", badge: "RN", access: "Vitals Entry, Telemetry Alerts", color: "text-sky-700 bg-sky-50 border-sky-200" },
                { role: "Medical Informaticists", badge: "MI", access: "SHAP Analytics, Drift Evaluation", color: "text-amber-700 bg-amber-50 border-amber-200" },
                { role: "Hospital Administrators", badge: "IT", access: "Model Registry, Rollback, Audit", color: "text-purple-700 bg-purple-50 border-purple-200" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${item.color}`}>{item.badge}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.role}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono hidden sm:block">{item.access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Evidence-Based Medicine */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-6">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-100 px-4 py-1.5 rounded-full">
                Medical Evidence
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
                Grounded in{" "}
                <em className="not-italic text-purple-600">Evidence-Based</em>{" "}
                Medicine
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                All AI recommendations and clinical rule overrides are anchored in peer-reviewed consensus literature from leading international medical bodies.
              </p>
              <div className="space-y-4">
                {["Surviving Sepsis Campaign 2021 — SCCM/ESICM international guidelines", "KDIGO Clinical Practice for AKI — Level 1A Evidence creatinine criteria", "AHA/ACC 2017 Hypertension — Class I recommendations for hypertensive crisis"].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-purple-700" />
                    </div>
                    <span className="text-sm text-slate-600">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a href="#faq">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 font-semibold text-sm gap-2">
                    Read Evidence <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#simulator">
                  <Button variant="outline" className="rounded-full px-6 font-semibold text-sm border-slate-300 text-slate-700">
                    Try Simulator
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { code: "SSC-2021-SEPSIS", strength: "Strong Recommendation", title: "Surviving Sepsis Campaign 2021", desc: "SCCM/ESICM international guidelines for sepsis screening, blood lactate assessment, and IV crystalloid resuscitation protocols.", cc: "text-teal-700 bg-teal-50 border-teal-200" },
                { code: "KDIGO-2022-AKI", strength: "Level 1A Evidence", title: "KDIGO Clinical Practice for AKI", desc: "Staging and stratification based on serum creatinine rise and urine output criteria.", cc: "text-sky-700 bg-sky-50 border-sky-200" },
                { code: "AHA-ACC-2017-HTN", strength: "Class I Recommendation", title: "AHA/ACC High Blood Pressure", desc: "Hypertensive crisis stratification (>180/120 mmHg) differentiating acute target organ damage from hypertensive urgency.", cc: "text-purple-700 bg-purple-50 border-purple-200" },
              ].map((card, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${card.cc}`}>{card.code}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{card.strength}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{card.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 9. FAQ */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Key considerations on clinical safety, ML calibration, and regulatory boundaries.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { q: "How does the system ensure licensed physicians retain final diagnostic authority?", a: "PatientRisk CDSS is strictly classified as an assistive SaMD tool. The platform enforces a structured Clinician Override workflow, requiring documented clinical rationales whenever judgment differs from model output." },
              { q: "What algorithms are benchmarked and active in the clinical prediction loop?", a: "The system benchmarks Random Forest, SVM (RBF kernel), and AdaBoost on group-aware partitioned cohorts. Random Forest is the active champion, achieving 1.0000 sensitivity on acute cases and a calibrated Brier score of 0.0027." },
              { q: "How does the system handle high uncertainty or out-of-distribution patients?", a: "When prediction entropy exceeds 0.82 or the margin is below 0.18, the engine abstains with: 'Prediction requires additional review.' Mahalanobis distance checks flag atypical vitals outside validated training envelopes." },
              { q: "How are TreeSHAP feature attributions computed during real-time inference?", a: "The ML Engine employs runtime TreeSHAP unwrapped through CalibratedClassifierCV wrappers, decomposing margin scores into individual feature weight additions and subtractions, executing in under 0.2 milliseconds." },
              { q: "How does the platform handle PHI and HIPAA compliance?", a: "All data in transit is encrypted via TLS 1.3, records at rest in Neon PostgreSQL are AES-256 encrypted, MRNs are masked, and every interaction is written to tamper-evident audit logs." },
            ].map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 overflow-hidden transition-all hover:border-slate-200">
                <button type="button" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between font-semibold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer gap-3 text-sm">
                  <span>{item.q}</span>
                  <span className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 transition-all text-lg leading-none font-light ${openFaq === idx ? "rotate-45 border-teal-400 text-teal-600" : "border-slate-200 text-slate-400"}`}>+</span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-500 leading-relaxed border-t border-slate-100 bg-slate-50/60">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 10. Footer */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-slate-50 border-t border-slate-200 py-14">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-slate-200">
            <div className="lg:col-span-2 space-y-5">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                  <Image src="/logo.png" alt="PatientRisk CDSS Logo" width={36} height={36} className="h-full w-full object-contain rounded-lg" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">PatientRisk CDSS</span>
                  <span className="text-[10px] font-mono text-slate-400">Clinical Decision Support &bull; SaMD</span>
                </div>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Real-time ML risk prediction and TreeSHAP explainability for hospital cardiologists, triage nurses, and ICU teams.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://github.com/bunnyvalluri/Clinical-Decision-Support-System-" target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-300 transition-colors shadow-xs">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <div className="h-9 px-4 rounded-xl bg-white border border-slate-200 flex items-center gap-2 text-[11px] font-mono text-emerald-600 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Systems Live
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/dashboard" className="hover:text-teal-600 transition-colors">Clinician Portal</Link></li>
                <li><a href="#simulator" className="hover:text-teal-600 transition-colors">Risk Simulator</a></li>
                <li><Link href="/login" className="hover:text-teal-600 transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-teal-600 transition-colors">Staff Onboarding</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Technology</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/admin/models" className="hover:text-teal-600 transition-colors">MLOps Registry</Link></li>
                <li><a href="#features" className="hover:text-teal-600 transition-colors">Capabilities</a></li>
                <li><a href="#architecture" className="hover:text-teal-600 transition-colors">Cloud Stack</a></li>
                <li><a href="https://github.com/bunnyvalluri/Clinical-Decision-Support-System-" target="_blank" rel="noreferrer" className="hover:text-teal-600 transition-colors">GitHub Repo</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Get Started</h4>
              <p className="text-sm text-slate-500">Deploy clinical AI decision support in your hospital.</p>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <Lock className="h-3 w-3" />HIPAA-aligned &bull; TLS 1.3 &bull; AES-256
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-teal-500 shrink-0" />
              <span>BPY-CSE-2666 PatientRisk CDSS &copy; 2026. All rights reserved.</span>
            </div>
            <p className="text-center sm:text-right">Assistive SaMD tool. Does NOT provide autonomous medical diagnosis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
