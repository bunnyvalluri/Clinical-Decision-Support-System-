"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Database,
  Radio,
  ShieldCheck,
  UserCheck,
  HeartPulse,
  ChevronDown,
  FileCheck,
  Activity,
  Zap,
  Lock,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutHero() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const stats = [
    { label: "Inference Latency", value: "0.136 ms", sub: "Sub-millisecond scoring", icon: Zap },
    { label: "Cohort Accuracy", value: "ROC-AUC 0.94", sub: "Multi-hospital evaluated", icon: Cpu },
    { label: "Telemetry Sync", value: "<20 ms", sub: "WebSocket live stream", icon: Radio },
    { label: "Human Oversight", value: "100% Enforced", sub: "Physician sign-off gate", icon: ShieldCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-200/80">
      {/* High-end ambient clinical gradient glows */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Regulatory & Institutional Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-teal-200/80 text-teal-900 text-xs font-mono font-bold tracking-wide shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span className="uppercase text-teal-800">ENTERPRISE CLINICAL DECISION SUPPORT</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-sans font-semibold">FDA SaMD Aligned</span>
            </div>

            {/* Main Headline with Curated Gradient */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12] sm:leading-[1.08]">
              Building the Future of{" "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent block sm:inline">
                Intelligent Clinical
              </span>{" "}
              <span className="text-slate-950">Decision Support</span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              HealthNova AI bridges complex clinical telemetry, longitudinal EHR records,
              and real-time bedside decision-making. We build calibrated, transparent,
              and clinically-validated intelligence tools that empower physicians, nurses,
              and hospital teams to anticipate critical patient deteriorations hours before crises occur.
            </p>

            {/* Reassurance Invariant Banner (Strict Clinical Compliance) */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-teal-50/90 via-slate-50/90 to-white border border-teal-200/70 flex items-start gap-3.5 max-w-xl shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-600/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                    Human-in-the-Loop Architecture
                  </strong>
                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded border border-teal-200">
                    MANDATORY
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI/ML models calculate calibrated risk signals and localized TreeSHAP factor attributions.
                  Licensed clinical professionals retain sole final diagnostic, prescription, and treatment authority.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-7 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 gap-2 text-sm h-12 rounded-xl transition-all hover:-translate-y-0.5 border-0"
                >
                  <HeartPulse className="h-4 w-4" />
                  <span>Launch Live Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#foundation">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-sm h-12 rounded-xl shadow-2xs gap-2 transition-all hover:-translate-y-0.5"
                >
                  <span>Our Clinical Principles</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </a>
            </div>

            {/* Proof Metric Ribbon */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((item) => {
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

          {/* Right Column: Architectural Satellite Node Ecosystem HUD */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-white via-slate-50/90 to-slate-100/80 border border-slate-200/90 p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-between overflow-hidden">
              {/* Subtle top console header */}
              <div className="w-full flex items-center justify-between pb-3.5 mb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 ml-1 tracking-wider uppercase">
                    SYSTEM TOPOLOGY HUD
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span>SYNCHRONIZED</span>
                </div>
              </div>

              {/* Central Interactive HUD Stage */}
              <div className="relative w-full h-[360px] sm:h-[380px] flex items-center justify-center">
                {/* Concentric Ambient Pulse Rings */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="h-80 w-80 rounded-full border border-slate-200/60 animate-[spin_40s_linear_infinite]" />
                  <div className="absolute h-64 w-64 rounded-full border border-dashed border-teal-200/70" />
                  <div className="absolute h-48 w-48 rounded-full border border-teal-100 bg-teal-50/20" />
                </div>

                {/* Connecting SVG Circuit Lines */}
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full pointer-events-none"
                >
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <line x1="50%" y1="50%" x2="22%" y2="18%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="78%" y2="18%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="22%" y2="82%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="78%" y2="82%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4 4" />
                </svg>

                {/* 1. Top-Left Satellite Node: EHR / FHIR */}
                <div
                  onMouseEnter={() => setActiveNode("ehr")}
                  onMouseLeave={() => setActiveNode(null)}
                  className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-20 w-44 rounded-2xl bg-white border p-3 shadow-md transition-all duration-300 cursor-pointer ${
                    activeNode === "ehr"
                      ? "border-teal-500 scale-105 shadow-teal-500/10"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                      <Database className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      HL7 FHIR v4
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">EHR Clinical Ingestion</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Vitals, lab assays &amp; EHR sync
                  </p>
                </div>

                {/* 2. Top-Right Satellite Node: Diagnostic Telemetry */}
                <div
                  onMouseEnter={() => setActiveNode("telemetry")}
                  onMouseLeave={() => setActiveNode(null)}
                  className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-44 rounded-2xl bg-white border p-3 shadow-md transition-all duration-300 cursor-pointer ${
                    activeNode === "telemetry"
                      ? "border-blue-500 scale-105 shadow-blue-500/10"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                      <Radio className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Sub-20ms
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Bedside Telemetry</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    High-frequency ECG &amp; SpO2
                  </p>
                </div>

                {/* 3. Central Clinical Intelligence Core */}
                <div className="relative z-10 flex flex-col items-center justify-center h-36 w-36 rounded-full bg-white border-2 border-teal-500 shadow-xl shadow-teal-500/15 p-3 text-center transition-transform hover:scale-105">
                  <div className="relative">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-1 shadow-xs">
                      <HeartPulse className="h-6 w-6 animate-pulse" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-950 leading-tight mt-1">
                    Clinical Core
                  </span>
                  <span className="text-[10px] font-mono font-bold text-teal-700 mt-0.5">
                    Ruflo AI Swarm
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                    v3.42 Active
                  </span>
                </div>

                {/* 4. Bottom-Left Satellite Node: Deterministic Safety Rules */}
                <div
                  onMouseEnter={() => setActiveNode("rules")}
                  onMouseLeave={() => setActiveNode(null)}
                  className={`absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 w-44 rounded-2xl bg-white border p-3 shadow-md transition-all duration-300 cursor-pointer ${
                    activeNode === "rules"
                      ? "border-amber-500 scale-105 shadow-amber-500/10"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                      <FileCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Deterministic
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-950">Clinical Protocols</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    qSOFA, NEWS2 &amp; sepsis gates
                  </p>
                </div>

                {/* 5. Bottom-Right Satellite Node: Clinician Review Authority */}
                <div
                  onMouseEnter={() => setActiveNode("clinician")}
                  onMouseLeave={() => setActiveNode(null)}
                  className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 w-44 rounded-2xl bg-white border p-3 shadow-md transition-all duration-300 cursor-pointer ${
                    activeNode === "clinician"
                      ? "border-purple-500 scale-105 shadow-purple-500/10"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                      <UserCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      Final Authority
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-950">Clinician Sign-Off</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Attending physician verification
                  </p>
                </div>
              </div>

              {/* Bottom HUD Security Persistence Badge */}
              <div className="w-full pt-3 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-teal-600" />
                  Authoritative Store: Neon PostgreSQL
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Zero PHI Memory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
