import React from "react";
import { AI_INTELLIGENCE_CAPABILITIES } from "@/config/features";
import { ShieldCheck, AlertCircle } from "lucide-react";

export function AIIntelligenceSection() {
  return (
    <section id="ai-intelligence" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            AI-POWERED CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            AI-Powered Clinical Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
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
                className="rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col items-center text-center justify-between shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-2xl bg-teal-50/80 border border-teal-200/60 text-teal-700 flex items-center justify-center mb-3 shadow-2xs">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight mb-1">
                    {cap.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {cap.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Governance & Human-in-the-Loop Callout */}
        <div className="rounded-3xl bg-white border border-teal-200/90 p-6 sm:p-8 max-w-4xl mx-auto shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-950">
                Ethical AI Invariants &amp; Clinician Safeguards
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Governed by policy-controlled agent tool execution and human validation gates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                What AI Does:
              </p>
              <p className="text-slate-600">
                Calculates risk priors, extracts physiological patterns, decomposes TreeSHAP feature
                weights, surfaces uncertainty bounds, and retrieves institutional protocols.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                What AI Never Does:
              </p>
              <p className="text-slate-600">
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
