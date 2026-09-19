"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  BarChart2,
  Users,
  Heart,
  ShieldCheck,
  ChevronRight,
  PlayCircle,
  Activity,
  CheckCircle2,
  Stethoscope,
  Cpu,
  Radio,
  Sliders,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroTelemetryState {
  ward: string;
  patientId: string;
  vitalSummary: string;
  metricLabel: string;
  metricValue: string;
  delta: string;
  statusColor: string;
  statusBg: string;
  statusBorder: string;
}

const HERO_SCENARIOS: HeroTelemetryState[] = [
  {
    ward: "ICU Bed 04 • Acute Care",
    patientId: "ENC-8921 • Post-Op Colorectal",
    vitalSummary: "HR 114 bpm • BP 92/58 mmHg • SpO2 93%",
    metricLabel: "qSOFA Decompensation Index",
    metricValue: "18.4% (STABLE)",
    delta: "Normative Baseline",
    statusColor: "text-teal-700",
    statusBg: "bg-teal-50",
    statusBorder: "border-teal-200",
  },
  {
    ward: "Cardiology Suite • Bed 02",
    patientId: "ENC-4410 • Post-PTCA Day 1",
    vitalSummary: "HR 74 bpm • BP 118/76 mmHg • MAP 90",
    metricLabel: "Hemodynamic Stability",
    metricValue: "99.2% (OPTIMAL)",
    delta: "+0.4h Steady Margin",
    statusColor: "text-emerald-700",
    statusBg: "bg-emerald-50",
    statusBorder: "border-emerald-200",
  },
  {
    ward: "Emergency Triage • Bay 07",
    patientId: "ENC-3109 • Acute Dyspnea",
    vitalSummary: "HR 102 bpm • SpO2 91% (RA) • RR 24",
    metricLabel: "NEWS2 Escalation Tripwire",
    metricValue: "3 (MONITORING)",
    delta: "Triage Alert Armed",
    statusColor: "text-amber-700",
    statusBg: "bg-amber-50",
    statusBorder: "border-amber-200",
  },
];

export function SolutionsHero() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0);
  const activeScenario = HERO_SCENARIOS[activeScenarioIdx];

  return (
    <section className="relative overflow-hidden pt-4 pb-14 sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)] border-b border-slate-200/80">
      {/* Background medical grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none opacity-35" />

      {/* Ambient soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-6 h-80 w-80 rounded-full bg-sky-100/40 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900">Solutions</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-5 sm:space-y-6 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/90 text-teal-800 text-xs font-mono font-semibold tracking-wide uppercase shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>HEALTHCARE AI SOLUTIONS</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.14] sm:leading-[1.12]">
              Smarter Solutions{" "}
              <span className="text-teal-600 block sm:inline">
                for a Healthier Tomorrow
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Comprehensive, evidence-based AI capabilities engineered to elevate clinical workflows, safeguard patient telemetry, accelerate medical decisions, and empower healthcare professionals across inpatient, outpatient, and critical care environments.
            </p>

            {/* Reassurance Governance Disclaimer */}
            <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/90 flex items-start gap-3.5 max-w-xl shadow-xs">
              <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="font-bold text-slate-900">Clinical Decision Support Invariant:</strong>{" "}
                  HealthNova AI assists clinical teams with validated risk models and explainable telemetry. Licensed healthcare professionals retain complete diagnostic and prescription authority.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                  <span className="flex items-center gap-1 font-semibold text-teal-700">
                    <CheckCircle2 className="h-3 w-3" /> 21 CFR Part 11 Compliant
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Zero PHI Leakage</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-semibold">Non-Autonomous</span>
                </div>
              </div>
            </div>

            {/* Interactive Bedside Telemetry Scenario Switcher */}
            <div className="pt-1 max-w-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                  Live Telemetry Simulator Feed:
                </span>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  FHIR v4.0.1 Connected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HERO_SCENARIOS.map((item, idx) => (
                  <button
                    key={item.ward}
                    type="button"
                    onClick={() => setActiveScenarioIdx(idx)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      activeScenarioIdx === idx
                        ? "bg-teal-50/90 border-teal-300 shadow-xs ring-1 ring-teal-500/20"
                        : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-[11px] truncate">{item.ward.split("•")[0]}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.metricValue.split("(")[0]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a href="#core-solutions">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 shadow-sm gap-2 text-sm h-12 rounded-xl transition-all"
                >
                  <span>Explore Solutions</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#healthcare-workflow">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-semibold px-6 text-sm h-12 gap-2 rounded-xl shadow-2xs"
                >
                  <PlayCircle className="h-4 w-4 text-teal-600" />
                  <span>Watch Clinical Workflow</span>
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual with Doctor & 4 Floating Satellite Badges */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center relative">
            {/* Top-right Cursive Annotation with Arrow */}
            <div className="absolute -top-8 right-2 sm:right-6 z-20 hidden sm:flex flex-col items-end pointer-events-none">
              <span className="font-serif italic text-xs sm:text-sm font-semibold text-teal-700 tracking-wide bg-white/95 px-2.5 py-1 rounded-lg border border-teal-100 shadow-xs">
                Technology for a healthier tomorrow ✨
              </span>
              <svg
                width="64"
                height="44"
                viewBox="0 0 64 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-teal-500 mt-1 stroke-current"
              >
                <path
                  d="M12 4C28 6 52 14 42 32C38 38 24 36 22 38"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="3 3"
                />
                <path
                  d="M20 32L22 38L28 36"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg flex flex-col items-center">
              {/* Doctor Main Image Frame: Unobstructed and 100% completely visible on mobile & desktop */}
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-slate-200/90 bg-gradient-to-b from-teal-50/50 via-white to-sky-50/50 shadow-xl p-2 group">
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
                  <Image
                    src="/doctor-hero.jpg"
                    alt="Healthcare clinician using HealthNova AI tablet at bedside"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 512px"
                    className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-transparent pointer-events-none" />

                  {/* Bottom Image Tag - Crisp Pure Light Glass Pill */}
                  <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200/90 shadow-sm">
                    <Activity className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-teal-600 animate-pulse shrink-0" />
                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-tight">Continuous Telemetry Ingestion</span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-teal-800 font-bold bg-teal-100/90 px-1.5 py-0.5 rounded border border-teal-300">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Desktop Floating Badges (Hidden on mobile to keep doctor image 100% visible and un-obscured) */}
              {/* Floating Badge 1: Top Left - Better Decisions */}
              <div className="hidden sm:flex absolute -top-3 sm:-left-6 rounded-2xl bg-white/95 border border-slate-200/90 px-3.5 py-2.5 shadow-md items-center gap-3 z-20 backdrop-blur-sm hover:scale-102 transition-transform">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Better Decisions</p>
                  <p className="text-[10px] font-medium text-slate-500">Evidence-informed</p>
                </div>
              </div>

              {/* Floating Badge 2: Top Right - Empowered Providers */}
              <div className="hidden sm:flex absolute top-8 sm:-right-6 rounded-2xl bg-white/95 border border-slate-200/90 px-3.5 py-2.5 shadow-md items-center gap-3 z-20 backdrop-blur-sm hover:scale-102 transition-transform">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Empowered Providers</p>
                  <p className="text-[10px] font-medium text-slate-500">Reduced burden</p>
                </div>
              </div>

              {/* Floating Badge 3: Mid Left - Healthier Communities */}
              <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 sm:-left-6 rounded-2xl bg-white/95 border border-slate-200/90 px-3.5 py-2.5 shadow-md items-center gap-3 z-20 backdrop-blur-sm hover:scale-102 transition-transform">
                <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Healthier Communities</p>
                  <p className="text-[10px] font-medium text-slate-500">Early risk awareness</p>
                </div>
              </div>

              {/* Floating Badge 4: Bottom Right - Safer Care */}
              <div className="hidden sm:flex absolute -bottom-4 sm:-right-4 rounded-2xl bg-white/95 border border-slate-200/90 px-3.5 py-2.5 shadow-md items-center gap-3 z-20 backdrop-blur-sm hover:scale-102 transition-transform">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Safer Care</p>
                  <p className="text-[10px] font-medium text-slate-500">Continuous audit</p>
                </div>
              </div>

              {/* Mobile View Clean Value Props Grid: Displayed directly below the image so doctor is 100% visible */}
              <div className="grid grid-cols-2 gap-2 mt-4 w-full sm:hidden">
                <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <BarChart2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">Better Decisions</p>
                    <p className="text-[9px] font-medium text-slate-500 truncate">Evidence-informed</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">Empowered Providers</p>
                    <p className="text-[9px] font-medium text-slate-500 truncate">Reduced burden</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">Healthier Communities</p>
                    <p className="text-[9px] font-medium text-slate-500 truncate">Early risk awareness</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">Safer Care</p>
                    <p className="text-[9px] font-medium text-slate-500 truncate">Continuous audit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
