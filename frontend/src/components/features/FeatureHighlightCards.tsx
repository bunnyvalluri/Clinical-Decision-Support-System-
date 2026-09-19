"use client";

import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureHighlightCards() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Interactive Clinical Intelligence & Risk Intercept */}
          <div className="relative rounded-3xl bg-slate-50/70 border border-slate-300/90 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            {/* Top Teal Accent Bar */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600"
            />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider">
                  POINT-OF-CARE ASSIST
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-2 group-hover:text-teal-800 transition-colors">
                  Point-of-Care Risk Intelligence
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Continuous bedside telemetry analysis combining Platt-calibrated ensemble ML with
                  transparent TreeSHAP factor attributions, predicting sepsis and respiratory collapse hours in advance.
                </p>
              </div>

              {/* High-Density Capability Rows */}
              <div className="space-y-2.5 pt-2">
                {[
                  { title: "Anticipatory Sepsis Trajectory", desc: "6–8 hour early warning forecast with Brier reliability score < 0.08" },
                  { title: "TreeSHAP Local Attributions", desc: "Additive pathophysiological biomarker drivers in plain clinical terminology" },
                  { title: "Deterministic Safety Interlocks", desc: "Hardcoded qSOFA, NEWS2 & shock index verification prior to alerting" },
                  { title: "Sub-20ms Telemetry Sync", desc: "Live multi-bed vitals stream via ASGI WebSockets & Redis Channel Layer" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5 text-xs text-slate-700 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong className="font-bold text-slate-900">{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200 flex items-center justify-between">
              <Link href="/doctor/predictions">
                <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-teal-900/10 px-5 h-11 border-0 transition-all hover:-translate-y-0.5 cursor-pointer">
                  <span>Launch Risk Simulator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
                /doctor/predictions
              </span>
            </div>
          </div>

          {/* Card 2: Multi-Role Care Portals & Workspaces */}
          <div className="relative rounded-3xl bg-slate-50/70 border border-slate-300/90 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            {/* Top Teal Accent Bar */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-700 via-cyan-600 to-sky-600"
            />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider">
                  5 SPECIALIZED ROLES
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-2 group-hover:text-teal-800 transition-colors">
                  Role-Gated Clinical Workspaces
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Dedicated, access-controlled hospital interfaces engineered specifically for each
                  clinical stakeholder, from bedside triage nurses to hospital informaticists and IT administrators.
                </p>
              </div>

              {/* High-Density Capability Rows */}
              <div className="space-y-2.5 pt-2">
                {[
                  { title: "Attending Physician Suite", desc: "Point-of-care CDS, cohort triage, and cryptographic protocol sign-off" },
                  { title: "Ward & ICU Nurse Portal", desc: "Sub-20ms vitals entry, rapid response escalation & bedside alarms" },
                  { title: "Informatics & MLOps Console", desc: "Brier calibration tracking, PSI drift detection & model registry auditing" },
                  { title: "Platform Security & IT Admin", desc: "Neon PostgreSQL pool monitoring, RBAC matrices & HIPAA audit logs" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5 text-xs text-slate-700 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong className="font-bold text-slate-900">{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200 flex items-center justify-between">
              <Link href="/solutions">
                <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-teal-900/10 px-5 h-11 border-0 transition-all hover:-translate-y-0.5 cursor-pointer">
                  <span>Explore Role Workspaces</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
                /solutions
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
