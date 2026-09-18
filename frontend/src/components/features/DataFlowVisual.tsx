"use client";

import React from "react";
import {
  Users,
  Layout,
  Server,
  Database,
  Cpu,
  Activity,
  Sliders,
  Stethoscope,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface FlowNode {
  step: string;
  name: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  isFinal?: boolean;
}

const FLOW_NODES: FlowNode[] = [
  { step: "01", name: "Care Team / Patient", sub: "User Interface", icon: Users },
  { step: "02", name: "Next.js 16 Client", sub: "Secure Web Portal", icon: Layout },
  { step: "03", name: "Django REST API", sub: "RBAC & Authorization", icon: Server },
  { step: "04", name: "Neon PostgreSQL", sub: "Authoritative Store", icon: Database },
  { step: "05", name: "ML Inference Pipeline", sub: "StandardScaler & Model", icon: Cpu },
  { step: "06", name: "Risk Tier Assessment", sub: "Calibrated Probability", icon: Activity },
  { step: "07", name: "TreeSHAP Explainer", sub: "Feature Contributions", icon: Sliders },
  { step: "08", name: "Physician Sign-Off", sub: "Human-in-the-Loop", icon: Stethoscope, isFinal: true },
];

export function DataFlowVisual() {
  return (
    <section id="architecture" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>SYSTEM TOPOLOGY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            End-to-End{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Data Flow
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            How physiological vitals securely traverse from client input to authoritative database
            persistence, machine-learning inference, and validated clinician review.
          </p>
        </div>

        {/* Desktop 8-Node Flow Diagram (Grid on desktop, stacked on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {FLOW_NODES.map((node, idx) => {
            const IconComponent = node.icon;
            const isLast = idx === FLOW_NODES.length - 1;

            return (
              <div
                key={node.step}
                className={`relative rounded-2xl border p-5 flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group ${
                  node.isFinal
                    ? "bg-gradient-to-b from-emerald-50/40 to-white border-emerald-400 ring-2 ring-emerald-500/10"
                    : "bg-slate-50/70 border-slate-200/90 hover:border-teal-400"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold text-slate-400">
                      STEP {node.step}
                    </span>
                    <div
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform duration-300 ${
                        node.isFinal
                          ? "bg-emerald-100/70 border-emerald-300 text-emerald-800"
                          : "bg-white border-slate-200 text-teal-700"
                      }`}
                    >
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-950 tracking-tight leading-snug group-hover:text-teal-700 transition-colors">
                    {node.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-mono">
                      {node.sub}
                    </p>
                    {node.isFinal && (
                      <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        FINAL GATE
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Arrow Indicator between nodes */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white border border-slate-200 items-center justify-center shadow-xs text-slate-400 group-hover:text-teal-600 transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
