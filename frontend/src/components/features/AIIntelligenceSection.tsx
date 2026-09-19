"use client";

import React from "react";
import { AI_INTELLIGENCE_CAPABILITIES } from "@/config/features";
import { ShieldCheck, CheckCircle2, XCircle, Sparkles, Bot, Cpu, Sliders, Activity } from "lucide-react";

export function AIIntelligenceSection() {
  return (
    <section id="ai-intelligence" className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>AI INFRASTRUCTURE &amp; EXPLAINABILITY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A comprehensive suite of calibrated machine learning ensembles, governed multi-agent safety roles,
            and exact TreeSHAP attributions designed to support physician decision-making.
          </p>
        </div>

        {/* 12 AI Capabilities Structured Grid (No cartoon bubbles, pure clinical engineering cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {AI_INTELLIGENCE_CAPABILITIES.map((cap) => {
            const IconComponent = cap.icon;
            return (
              <div
                key={cap.title}
                className="rounded-2xl bg-slate-50/70 border border-slate-200/90 p-4.5 flex flex-col items-center text-center justify-between shadow-2xs hover:bg-white hover:border-teal-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-default"
              >
                <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight mb-1 group-hover:text-teal-800 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-[10px] font-mono font-semibold text-teal-700 uppercase tracking-wide">
                    {cap.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Governance & Human-in-the-Loop Callout */}
        <div className="rounded-3xl bg-slate-50 border border-slate-300 p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
            <div className="h-12 w-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-800/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-950">
                  Ethical AI Invariants &amp; Clinician Safeguards
                </h4>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                  POLICY-GOVERNED
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Governed by hierarchical agent tool execution and mandatory human clinician validation gates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700 leading-relaxed">
            <div className="space-y-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <p className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>What AI Does:</span>
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Calculates calibrated risk priors, extracts longitudinal physiological patterns, decomposes
                additive TreeSHAP feature weights, surfaces epistemic uncertainty bounds, and retrieves approved
                institutional care protocols.
              </p>
            </div>
            <div className="space-y-2 p-5 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <p className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                <XCircle className="h-4 w-4 text-rose-700 shrink-0" />
                <span>What AI Never Does:</span>
              </p>
              <p className="text-slate-700 text-xs leading-relaxed">
                <strong className="text-rose-950 font-bold">Never diagnoses autonomously</strong>, prescribes
                medications, orders invasive treatments, alters EHR records without clinician sign-off, or
                overrides the professional medical judgment of a licensed attending physician.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
