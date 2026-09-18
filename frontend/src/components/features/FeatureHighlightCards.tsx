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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureHighlightCards() {
  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Interactive Clinical Intelligence */}
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            {/* Top Teal Gradient Accent Bar */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"
            />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs uppercase tracking-wider">
                  POINT-OF-CARE ASSIST
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-2 group-hover:text-teal-700 transition-colors">
                  Interactive Clinical Intelligence
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Monitor patient physiological vitals in real time, review calibrated risk scores,
                  and inspect transparent pathophysiological drivers through an ambient, assistive interface.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { title: "Real-Time Risk Stratification", desc: "Platt-calibrated probabilities with confidence bounds" },
                  { title: "Biomarker Trajectory Tracking", desc: "Longitudinal deterioration mapping across acute admissions" },
                  { title: "Continuous Anomaly Detection", desc: "Sub-20ms vitals telemetry & outlier alerts" },
                  { title: "TreeSHAP Local Attributions", desc: "Exact pathophysiological factors presented in plain clinical terms" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong className="font-bold text-slate-900">{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200/80 flex items-center justify-between">
              <Link href="/doctor/predictions">
                <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-teal-600/20 px-5 h-11 border-0 transition-all hover:-translate-y-0.5">
                  <span>Launch Risk Simulator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                /doctor/predictions
              </span>
            </div>
          </div>

          {/* Card 2: Multi-Role Care Portals */}
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            {/* Top Blue Gradient Accent Bar */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500"
            />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs uppercase tracking-wider">
                  5 SPECIALIZED ROLES
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-2 group-hover:text-blue-700 transition-colors">
                  Multi-Role Care Portals
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Dedicated, access-controlled workspaces engineered specifically for each member
                  of the healthcare ecosystem, from bedside triage to hospital informatics.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { title: "Physician & Specialist Portal", desc: "Bedside CDS, cohort management & override review workflow" },
                  { title: "Triage & Nurse Workspace", desc: "Rapid vitals recording, deterioration screening & escalations" },
                  { title: "Clinical Informatics & MLOps", desc: "Deep model evaluation, drift analytics (PSI) & Brier calibration" },
                  { title: "Patient & Admin Access", desc: "Secure personal records & administrative security telemetry" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong className="font-bold text-slate-900">{item.title}:</strong> {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200/80 flex items-center justify-between">
              <Link href="/solutions">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-blue-600/20 px-5 h-11 border-0 transition-all hover:-translate-y-0.5">
                  <span>Explore Role Workspaces</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                /solutions
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
