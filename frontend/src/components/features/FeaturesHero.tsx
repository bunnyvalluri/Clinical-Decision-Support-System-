"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Activity,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Cpu,
  TrendingUp,
  Moon,
  Footprints,
  Layers,
  Zap,
  Radio,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturesHero() {
  const [activeTab, setActiveTab] = useState<"vitals" | "telemetry">("vitals");

  const proofMetrics = [
    { label: "Inference Latency", value: "0.136 ms", sub: "Sub-millisecond compute", icon: Zap },
    { label: "Ensemble Accuracy", value: "ROC-AUC 0.94", sub: "Multi-cohort validated", icon: Cpu },
    { label: "Telemetry Push", value: "<20 ms", sub: "ASGI WebSocket stream", icon: Radio },
    { label: "Human Authority", value: "100% Enforced", sub: "Physician sign-off gate", icon: UserCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24 bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-200/80">
      {/* Background Ambient Gradient Glows (Strict Light Theme) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-teal-400/15 via-cyan-300/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-20 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-sky-400/12 via-indigo-300/8 to-transparent blur-3xl"
      />
      {/* Subtle clinical grid background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_60%,transparent_100%)]"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900">Features</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* Regulatory Eyebrow Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-teal-200/80 text-teal-900 text-xs font-mono font-bold tracking-wide uppercase shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span>ENTERPRISE CLINICAL SUITE</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-sans font-semibold">12 CORE CAPABILITIES</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12] sm:leading-[1.08]">
              Smarter Tools for{" "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent block sm:inline">
                Everyday Healthcare
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              HealthNova AI provides a complete suite of intelligent clinical tools designed to enhance
              medical decision-making, streamline point-of-care workflows, and elevate patient outcomes
              across acute hospital wards and outpatient clinics.
            </p>

            {/* Reassurance Disclaimer Badge */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-teal-50/90 via-slate-50/90 to-white border border-teal-200/70 flex items-start gap-3.5 max-w-xl shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-600/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                    Clinician-in-the-Loop Standard
                  </strong>
                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded border border-teal-200">
                    NON-AUTONOMOUS
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Advanced AI and predictive analytics assist clinical judgment; final medical decisions
                  and treatment prescriptions remain with qualified healthcare professionals.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <a href="#powerful-features">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-7 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 gap-2 text-sm h-12 rounded-xl transition-all hover:-translate-y-0.5 border-0"
                >
                  <span>Explore All Features</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#ai-intelligence">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-sm h-12 gap-2 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5"
                >
                  <Layers className="h-4 w-4 text-teal-600" />
                  <span>Clinical Intelligence</span>
                </Button>
              </a>
            </div>

            {/* Proof Metric Ribbon */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {proofMetrics.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-teal-600 mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-950 font-mono">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Realistic Healthcare Intelligence Mobile Device & Dashboard Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Outer Ambient Glow */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-teal-500/20 via-sky-500/15 to-purple-500/15 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

              {/* Device Frame */}
              <div className="relative rounded-[40px] border-4 border-slate-300/80 bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-slate-900/5 space-y-4">
                {/* Device Speaker Notch */}
                <div className="mx-auto mb-3 h-3.5 w-28 rounded-full bg-slate-100 border border-slate-200" />

                {/* Device Screen Content */}
                <div className="space-y-3.5">
                  {/* Top Bar inside Mockup */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Patient Workspace
                      </p>
                      <h4 className="text-sm font-bold text-slate-900">
                        Sarah Jenkins &bull; Bed 04
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Telemetry
                    </span>
                  </div>

                  {/* 2-Col Metric Cards inside Device */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Heart Rate */}
                    <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center gap-2.5 shadow-2xs">
                      <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Heart className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Heart Rate</p>
                        <p className="text-base font-extrabold text-slate-900 font-mono leading-tight">
                          72 <span className="text-[10px] font-normal text-slate-500">bpm</span>
                        </p>
                      </div>
                    </div>

                    {/* Vitals Telemetry */}
                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-2.5 shadow-2xs">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Activity className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Blood Pressure</p>
                        <p className="text-base font-extrabold text-slate-900 font-mono leading-tight">
                          120/80
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Risk Prediction Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          ML Risk Assessment
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        LOW RISK TIER
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                          18.4%
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                          Calculated Probability
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Random Forest v1.4
                      </span>
                    </div>

                    {/* Progress Bar with Gradient */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: "18.4%" }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      Vitals within baseline bounds. Continuous ward surveillance active.
                    </p>
                  </div>

                  {/* Secondary Metric Strip */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Moon className="h-3.5 w-3.5 text-blue-500" />
                        <span>Telemetry</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">7h 30m</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Footprints className="h-3.5 w-3.5 text-emerald-500" />
                        <span>SpO2 Level</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">98%</span>
                    </div>
                  </div>

                  {/* Bottom Navigation Mockup */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-[10px] font-semibold text-slate-400">
                    <span className="text-teal-600 font-bold">Vitals</span>
                    <span>Trends</span>
                    <span>Telemetry</span>
                    <span>Reports</span>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Satellite Badges */}
              <div className="absolute -top-3 -right-3 sm:-right-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-left pr-1">
                  <p className="text-[9px] font-mono text-slate-400">TreeSHAP</p>
                  <p className="text-xs font-bold text-slate-950">Explainable</p>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-3 sm:-left-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left pr-1">
                  <p className="text-[9px] font-mono text-slate-400">Governance</p>
                  <p className="text-xs font-bold text-slate-950">Human Sign-off</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
