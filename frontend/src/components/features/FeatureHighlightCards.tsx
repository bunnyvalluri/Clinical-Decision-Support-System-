"use client";

import React from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureHighlightCards() {
  return (
    <section className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Interactive Clinical Intelligence */}
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200 shadow-2xs">
                  POINT-OF-CARE ASSIST
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">
                  Interactive Clinical Intelligence
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Monitor patient physiological vitals in real time, review calibrated risk scores,
                  and inspect transparent pathophysiological drivers through an ambient, assistive interface.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  "Real-time patient risk stratification with confidence margins",
                  "Biomarker trajectory tracking across acute ward encounters",
                  "Continuous physiologic anomaly detection & outlier alerts",
                  "TreeSHAP feature attributions in plain clinical terms",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200/80 flex items-center justify-between">
              <Link href="/doctor/predictions">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2 rounded-xl shadow-xs">
                  <span>Launch Risk Simulator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[11px] text-slate-400 font-mono">
                /doctor/predictions
              </span>
            </div>
          </div>

          {/* Card 2: Multi-Role Care Portals */}
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 border border-blue-200 shadow-2xs">
                  5 SPECIALIZED ROLES
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">
                  Multi-Role Care Portals
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Dedicated, access-controlled workspaces engineered specifically for each member
                  of the healthcare ecosystem, from bedside triage to hospital informatics.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  "Tailored clinical triage views for Doctors & Nurses",
                  "Interactive Data Workspace for Medical Informaticists",
                  "System health and security telemetry for IT Administrators",
                  "Secure longitudinal health records and insights for Patients",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200/80 flex items-center justify-between">
              <Link href="/solutions">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 rounded-xl shadow-xs">
                  <span>Explore Role Workspaces</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[11px] text-slate-400 font-mono">
                /solutions
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
