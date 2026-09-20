"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  Zap,
  Cpu,
  HeartPulse,
  ChevronDown,
  Activity,
  CheckCircle2,
  Sliders,
  Sparkles,
  Terminal,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealtimeEcgWaveform } from "@/components/clinical/RealtimeEcgWaveform";

export function AboutHero() {
  const [hudMode, setHudMode] = useState<"telemetry" | "swarm">("telemetry");
  const [signedOff, setSignedOff] = useState(false);

  const stats = [
    { label: "Inference Latency", value: "0.136 ms", sub: "Sub-millisecond p99 scoring", icon: Zap },
    { label: "Cohort Discrimination", value: "ROC-AUC 0.94", sub: "Multi-center validated", icon: Cpu },
    { label: "Telemetry Sync", value: "<20 ms", sub: "ASGI WebSocket stream", icon: Radio },
    { label: "Human Oversight", value: "100% Enforced", sub: "Mandatory physician sign-off", icon: ShieldCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/40 border-b border-slate-200">
      {/* Precision subtle engineering grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_30%,#000_65%,transparent_100%)]"
      />

      {/* Atmospheric clinical gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 right-1/4 h-[550px] w-[550px] rounded-full bg-teal-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-24 h-[500px] w-[500px] rounded-full bg-sky-500/8 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Executive Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Regulatory & Institutional Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-300 text-slate-800 text-xs font-mono font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span className="tracking-wide uppercase text-teal-800 font-bold">
                ENTERPRISE CLINICAL DECISION SUPPORT
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-sans">FDA SaMD Aligned</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-teal-700 font-sans hidden sm:inline">HL7 FHIR R4 Ready</span>
            </div>

            {/* Main Commanding Headline */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-tight sm:leading-[1.08]">
                Precision Intelligence at the{" "}
                <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
                  Point of Care
                </span>
              </h1>
              <p className="text-base sm:text-xl font-medium text-slate-700 tracking-tight">
                Anticipating Acute Patient Deterioration Hours Before Bedside Crisis
              </p>
            </div>

            {/* Authoritative Subtitle */}
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              HealthNova AI bridges high-frequency bedside telemetry, longitudinal EHR records, and
              calibrated ensemble machine learning. Built from the ICU up, our dual-gated system delivers
              transparent TreeSHAP pathophysiological drivers and deterministic clinical safety interlocks (qSOFA, NEWS2),
              enabling acute care teams to act with swift clinical certainty.
            </p>

            {/* Mandatory Clinical Safety Invariant Banner */}
            <div className="p-3.5 sm:p-4.5 rounded-2xl bg-white border border-teal-200/90 shadow-xs flex items-start gap-3 sm:gap-3.5 max-w-xl">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-700/20">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                    Human-in-the-Loop Clinical Architecture
                  </strong>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    MANDATORY
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI/ML models compute calibrated risk trajectories with transparent factor attributions.
                  Licensed attending physicians retain sole and absolute authority for all diagnostic,
                  therapeutic, and prescription decisions.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold px-7 shadow-md shadow-teal-900/10 gap-2 text-xs sm:text-sm h-11 sm:h-12 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <HeartPulse className="h-4 w-4 text-teal-200" />
                  <span>Launch Live Bedside Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#foundation" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-xs sm:text-sm h-11 sm:h-12 rounded-xl shadow-2xs gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Inspect Clinical Paradigm</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </a>
            </div>

            {/* Proof Metrics Ribbon */}
            <div className="pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-2.5 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-black text-slate-950 font-mono tracking-tight truncate">
                      {item.value}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 100% Light Clinical Bedside HUD Console */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-lg rounded-3xl bg-white text-slate-900 p-5 sm:p-6 shadow-xl border border-slate-300 space-y-4">
              {/* Console Header Bar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 ml-1 tracking-wider uppercase">
                    BEDSIDE INTELLIGENCE HUD
                  </span>
                </div>
                {/* HUD Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[10px] font-mono font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setHudMode("telemetry")}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      hudMode === "telemetry"
                        ? "bg-white text-teal-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Telemetry
                  </button>
                  <button
                    type="button"
                    onClick={() => setHudMode("swarm")}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      hudMode === "swarm"
                        ? "bg-white text-teal-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Swarm Consensus
                  </button>
                </div>
              </div>

              {hudMode === "telemetry" ? (
                /* Telemetry & Deterioration View */
                <div className="space-y-3.5">
                  {/* Patient Header & Risk Flag */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">ICU-04</span>
                        <span className="text-xs font-bold text-slate-950">Eleanor Vance, 68F</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                        MRN-882910 • Post-Op Colorectal Day 2
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        SEPSIS ALERT
                      </span>
                      <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                        +6.2h Anticipatory Lead
                      </span>
                    </div>
                  </div>

                  {/* Real-Time Telemetry Sparkline & Vitals Grid */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Activity className="h-3.5 w-3.5 text-teal-700" />
                        Lead II ECG Rhythm
                      </span>
                      <span className="text-teal-800 font-bold">Sinus Tachycardia (118 bpm)</span>
                    </div>
                    {/* Real-Time Moving ECG Rhythm Waveform */}
                    <RealtimeEcgWaveform
                      heartRate={118}
                      stDepression={1.2}
                      className="h-10 w-full"
                    />

                    {/* Vitals Quadrant */}
                    <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-center font-mono">
                      <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-500 block">HR</span>
                        <span className="text-xs font-bold text-rose-600">118 bpm</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-500 block">MAP / BP</span>
                        <span className="text-xs font-bold text-rose-600">58 / 86/52</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-500 block">SpO2</span>
                        <span className="text-xs font-bold text-amber-600">91% (RA)</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-500 block">Resp Rate</span>
                        <span className="text-xs font-bold text-rose-600">26 /min</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Probability & TreeSHAP Factor Drivers */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Sliders className="h-3.5 w-3.5 text-teal-700" />
                        <span className="font-bold text-slate-900">Ensemble Sepsis Risk</span>
                      </div>
                      <span className="font-mono font-black text-rose-600 text-sm">84.7%</span>
                    </div>

                    {/* Calibrated Risk Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: "85%" }}
                      />
                    </div>

                    {/* Local TreeSHAP Factor Attributions */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase">
                        Top TreeSHAP Biomarker Drivers:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                        <div className="p-1.5 rounded-xl bg-white border border-rose-200 text-rose-800">
                          <span className="block text-[8px] text-slate-500">Serum Lactate</span>
                          <span className="font-bold">3.8 (+0.21)</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-white border border-rose-200 text-rose-800">
                          <span className="block text-[8px] text-slate-500">MAP Depressed</span>
                          <span className="font-bold">58 mmHg (+0.17)</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800">
                          <span className="block text-[8px] text-slate-500">WBC Elevation</span>
                          <span className="font-bold">14.8k (+0.11)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deterministic Rule Interlock & Interactive Sign-Off Action */}
                  <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-teal-900 font-bold">Deterministic Clinical Gate:</span>
                      <span className="text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-200">qSOFA = 2 • NEWS2 = 8</span>
                    </div>
                    {signedOff ? (
                      <div className="p-2.5 rounded-xl bg-white border border-teal-300 text-teal-900 text-xs font-mono flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                          <div>
                            <span className="font-bold block">Dr. R. Vance, MD (ID: #4481)</span>
                            <span className="text-[10px] text-teal-700">1-Hour Sepsis Bundle Authorized</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200">
                          AUDITED
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSignedOff(true)}
                        className="w-full py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-teal-900/10"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Authorize 1-Hour Sepsis Bundle (Attending Sign-Off)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Ruflo Multi-Agent Swarm Consensus View */
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                    <div className="flex items-center justify-between text-teal-900 text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-teal-700" />
                        Ruflo v3.42.0 Policy Swarm
                      </span>
                      <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        CONSENSUS VERIFIED
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Hierarchical 6-agent deterministic policy evaluation before alerting bedside clinician.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { role: "coordinator", action: "Dispatched vitals & context minimization", status: "CLEARED" },
                      { role: "clinical-safety-agent", action: "Cross-audited qSOFA=2 & NEWS2=8 rules", status: "ALERT READY" },
                      { role: "ml-engineer-agent", action: "Platt calibration Brier=0.08, AUC=0.94", status: "VALIDATED" },
                      { role: "mlops-agent", action: "PSI drift check = 0.024 (< 0.100 threshold)", status: "STABLE" },
                      { role: "clinical-explainability-agent", action: "Computed 18 exact TreeSHAP feature attributions", status: "COMPILED" },
                      { role: "privacy-agent", action: "Zero-PHI memory boundary enforced via Neon", status: "SECURE" },
                    ].map((agent) => (
                      <div
                        key={agent.role}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]"
                      >
                        <div className="space-y-0.5">
                          <span className="text-teal-900 font-bold block">{agent.role}</span>
                          <span className="text-[10px] text-slate-500">{agent.action}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {agent.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                    <span>Authoritative Store: Neon PostgreSQL</span>
                    <span className="text-teal-800 font-bold">100% ACID Logged</span>
                  </div>
                </div>
              )}

              {/* Console Footer Live Heartbeat */}
              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Real-time Telemetry Loop</span>
                </span>
                <span>Latency: 0.136ms • Sub-20ms WebSocket</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
