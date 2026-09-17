import React from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureHighlightCards() {
  return (
    <section className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Patient Health Intelligence */}
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200">
                  Patient Experience
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">
                  Patient Health Intelligence
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Monitor personal health vitals, review risk assessments, and understand
                  personalized insights through a secure, transparent patient experience.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  "Personalized Health Information & Vitals Tracking",
                  "Calibrated Risk Assessment History",
                  "Transparent TreeSHAP Explanations in Plain Language",
                  "Encrypted Longitudinal Health Timeline",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200/80 flex items-center justify-between">
              <Link href="/user/dashboard">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2">
                  <span>Explore Patient Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[11px] text-slate-400 font-mono">
                /user/dashboard
              </span>
            </div>
          </div>

          {/* Card 2: Clinical Decision Support */}
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-800 border border-blue-200">
                  Physician &amp; Care Team
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">
                  Clinical Decision Support
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Help healthcare professionals review patient physiological information, risk
                  predictions, telemetry trends, and explainable machine-learning insights.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  "Multi-Cohort Calibrated Patient Risk Prediction",
                  "Structured Clinical Insights & Out-of-Distribution Flags",
                  "TreeSHAP Factor Breakdown with Plausibility Auditing",
                  "Formal Clinician Review & Override Workflow",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200/80 flex items-center justify-between">
              <Link href="/doctor/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2">
                  <span>Explore Clinician Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <span className="text-[11px] text-slate-400 font-mono">
                /doctor/dashboard
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
