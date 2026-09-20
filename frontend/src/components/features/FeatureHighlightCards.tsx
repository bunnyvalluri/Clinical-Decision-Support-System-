"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Activity,
  Sliders,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureHighlightCards() {
  const [selectedDemoTier, setSelectedDemoTier] = useState<"normal" | "elevated" | "critical">("critical");
  const [selectedRolePreview, setSelectedRolePreview] = useState<"physician" | "nurse" | "informaticist" | "admin">("physician");

  const DEMO_TIERS = {
    normal: {
      score: "12.4%",
      label: "LOW RISK",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      barWidth: "14%",
      lead: "Normative Baseline",
      leadColor: "text-emerald-700",
      topBiomarker: "Lactate Clear 0.9 (-0.110)",
      directive: "Continue standard ICU baseline telemetry.",
    },
    elevated: {
      score: "54.8%",
      label: "MODERATE",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      barWidth: "55%",
      lead: "+5.1h Early Warning",
      leadColor: "text-amber-700",
      topBiomarker: "MAP Trend 68 mmHg (+0.142)",
      directive: "Repeat arterial blood gas and monitor urine output.",
    },
    critical: {
      score: "84.7%",
      label: "HIGH RISK",
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      barWidth: "85%",
      lead: "+6.2h Anticipatory Lead",
      leadColor: "text-rose-700",
      topBiomarker: "Serum Lactate 3.8 mmol/L (+0.214)",
      directive: "Immediate CCU physician bedside evaluation mandated.",
    },
  };

  const ROLE_PREVIEWS = {
    physician: {
      title: "Attending Cardiologist",
      badge: "Clinical Authority (MD)",
      access: "Full Differential & Order Sign-Off",
      tools: ["TreeSHAP Biomarker Waterfall", "Holter Lead II/V5 Waveforms", "Cryptographic Sign-Off Gate"],
      sla: "< 15ms Sign-Off Commit",
    },
    nurse: {
      title: "Bedside & Triage Nurse",
      badge: "Care Coordination (RN)",
      access: "Bedside Telemetry & Rapid Response",
      tools: ["Sub-20ms Vital Streams", "qSOFA / NEWS2 Alarms", "Escalation Pager Sync"],
      sla: "< 10ms Alert Dispatch",
    },
    informaticist: {
      title: "Clinical Informaticist & MLOps",
      badge: "Model Stewardship",
      access: "Drift Monitoring & Registry Audit",
      tools: ["Brier Calibration Curves", "Population Drift (PSI/KS)", "Model Registry v3.42.0"],
      sla: "Zero Prescriptive Autonomy",
    },
    admin: {
      title: "Platform Security & IT Admin",
      badge: "Infrastructure & HIPAA",
      access: "Immutable Neon PostgreSQL Store",
      tools: ["SHA-256 Audit Records", "Granular 5-Role RBAC", "TLS 1.3 & AES-256 Logs"],
      sla: "99.99% Telemetry Uptime",
    },
  };

  const activeTier = DEMO_TIERS[selectedDemoTier];
  const activeRole = ROLE_PREVIEWS[selectedRolePreview];

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {/* Card 1: Interactive Clinical Intelligence & Risk Intercept */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-slate-300 p-4 sm:p-7 lg:p-9 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-teal-400 transition-all duration-300 overflow-hidden group">
            {/* Top Teal Accent Bar */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600"
            />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider">
                  POINT-OF-CARE ASSIST
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight mb-2 group-hover:text-teal-800 transition-colors">
                  Point-of-Care Risk Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Continuous bedside telemetry analysis combining Platt-calibrated ensemble ML with
                  transparent TreeSHAP factor attributions, predicting sepsis and respiratory collapse hours in advance.
                </p>
              </div>

              {/* Interactive Demonstration Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-600" />
                    Interactive Trajectory State:
                  </span>
                  <div className="flex gap-1">
                    {(["normal", "elevated", "critical"] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedDemoTier(tier)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          selectedDemoTier === tier
                            ? "bg-teal-700 text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Platt-Calibrated Probability</span>
                      <span className={`text-xl font-mono font-black ${activeTier.color}`}>
                        {activeTier.score}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${activeTier.bg} ${activeTier.color} ${activeTier.border}`}>
                        {activeTier.label}
                      </span>
                      <span className={`block text-[10px] font-mono font-semibold ${activeTier.leadColor} mt-0.5`}>
                        {activeTier.lead}
                      </span>
                    </div>
                  </div>

                  {/* Animated Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-teal-500 via-amber-500 to-rose-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: activeTier.barWidth }}
                    />
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-600">
                    <span className="truncate">Top Driver: <strong>{activeTier.topBiomarker}</strong></span>
                    <span className="text-teal-800 font-bold shrink-0">TreeSHAP</span>
                  </div>
                </div>
              </div>

              {/* High-Density Capability Rows */}
              <div className="space-y-2 pt-1">
                {[
                  { title: "Anticipatory Sepsis Trajectory", desc: "6–8 hour early warning forecast with Brier score < 0.08" },
                  { title: "TreeSHAP Local Attributions", desc: "Additive pathophysiological biomarker drivers in plain terminology" },
                  { title: "Deterministic Safety Interlocks", desc: "Hardcoded qSOFA, NEWS2 & shock index verification prior to alerting" },
                  { title: "Sub-20ms Telemetry Sync", desc: "Live multi-bed vitals stream via ASGI WebSockets & Redis Channel Layer" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2 text-xs text-slate-700 p-2 rounded-xl bg-slate-50/70 border border-slate-200/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong className="font-bold text-slate-900">{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
              <Link href="/doctor/predictions">
                <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-teal-900/10 px-5 h-10 border-0 transition-all hover:-translate-y-0.5 cursor-pointer">
                  <span>Launch Risk Simulator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                /doctor/predictions
              </span>
            </div>
          </div>

          {/* Card 2: Multi-Role Care Portals & Workspaces */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-slate-300 p-4 sm:p-7 lg:p-9 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-teal-400 transition-all duration-300 overflow-hidden group">
            {/* Top Teal Accent Bar */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-700 via-cyan-600 to-sky-600"
            />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider">
                  5 SPECIALIZED ROLES
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight mb-2 group-hover:text-teal-800 transition-colors">
                  Role-Gated Clinical Workspaces
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Dedicated, access-controlled hospital interfaces engineered specifically for each
                  clinical stakeholder, from bedside triage nurses to hospital informaticists and IT administrators.
                </p>
              </div>

              {/* Interactive Role Switcher Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    Select Role Preview:
                  </span>
                  <div className="flex gap-1">
                    {(["physician", "nurse", "informaticist", "admin"] as const).map((roleKey) => (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => setSelectedRolePreview(roleKey)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                          selectedRolePreview === roleKey
                            ? "bg-teal-700 text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        {roleKey === "physician" ? "Doctor" : roleKey}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-950 block">{activeRole.title}</span>
                      <span className="text-[10px] font-mono text-teal-700 font-bold">{activeRole.badge}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                      {activeRole.sla}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {activeRole.tools.map((tool) => (
                      <div key={tool} className="text-[9px] font-mono p-1 rounded bg-slate-50 text-slate-700 border border-slate-200 truncate">
                        • {tool}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* High-Density Capability Rows */}
              <div className="space-y-2 pt-1">
                {[
                  { title: "Attending Physician Suite", desc: "Point-of-care CDS, cohort triage, and cryptographic protocol sign-off" },
                  { title: "Ward & ICU Nurse Portal", desc: "Sub-20ms vitals entry, rapid response escalation & bedside alarms" },
                  { title: "Informatics & MLOps Console", desc: "Brier calibration tracking, PSI drift detection & model registry auditing" },
                  { title: "Platform Security & IT Admin", desc: "Neon PostgreSQL pool monitoring, RBAC matrices & HIPAA audit logs" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2 text-xs text-slate-700 p-2 rounded-xl bg-slate-50/70 border border-slate-200/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong className="font-bold text-slate-900">{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
              <Link href="/solutions">
                <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-teal-900/10 px-5 h-10 border-0 transition-all hover:-translate-y-0.5 cursor-pointer">
                  <span>Explore Role Workspaces</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                /solutions
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
