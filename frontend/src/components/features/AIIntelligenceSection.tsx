"use client";

import React from "react";
import { AI_INTELLIGENCE_CAPABILITIES } from "@/config/features";
import { ShieldCheck, CheckCircle2, XCircle, Sparkles, Bot } from "lucide-react";

export function AIIntelligenceSection() {
  return (
    <section id="ai-intelligence" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50/80 via-slate-50/40 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>AI INFRASTRUCTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            A comprehensive suite of machine-learning models, governed AI agents, and explainability
            tools designed to support better healthcare outcomes while preserving physician authority.
          </p>
        </div>

        {/* 12 AI Capabilities Grid (Light Healthcare Technology Aesthetic) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {AI_INTELLIGENCE_CAPABILITIES.map((cap) => {
            const IconComponent = cap.icon;
            return (
              <div
                key={cap.title}
                className="rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col items-center text-center justify-between shadow-xs hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-default"
              >
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center mb-3 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight mb-1 group-hover:text-teal-700 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-[10px] font-mono font-semibold text-slate-500">
                    {cap.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Governance & Human-in-the-Loop Callout */}
        <div className="rounded-3xl bg-white border border-teal-200/90 p-6 sm:p-8 max-w-4xl mx-auto shadow-md shadow-teal-500/5 space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-950">
                  Ethical AI Invariants &amp; Clinician Safeguards
                </h4>
                <span className="text-[9px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  POLICY-GOVERNED
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Governed by policy-controlled agent tool execution and human validation gates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              <p className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>What AI Does:</span>
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Calculates risk priors, extracts physiological patterns, decomposes TreeSHAP feature
                weights, surfaces uncertainty bounds, and retrieves institutional protocols.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-rose-50/50 border border-rose-200/70 shadow-2xs">
              <p className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>What AI Never Does:</span>
              </p>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Never diagnoses autonomously, prescribes medications, orders invasive treatments,
                alters clinical records without authorization, or overrides licensed physician judgment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
