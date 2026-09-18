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
} from "lucide-react";

interface FlowNode {
  step: string;
  name: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FLOW_NODES: FlowNode[] = [
  { step: "01", name: "Care Team / Patient", sub: "User Interface", icon: Users },
  { step: "02", name: "Next.js 16 Client", sub: "Secure Web Portal", icon: Layout },
  { step: "03", name: "Django REST API", sub: "RBAC & Authorization", icon: Server },
  { step: "04", name: "Neon PostgreSQL", sub: "Authoritative Store", icon: Database },
  { step: "05", name: "ML Inference Pipeline", sub: "StandardScaler & Model", icon: Cpu },
  { step: "06", name: "Risk Tier Assessment", sub: "Calibrated Probability", icon: Activity },
  { step: "07", name: "TreeSHAP Explainer", sub: "Feature Contributions", icon: Sliders },
  { step: "08", name: "Physician Sign-Off", sub: "Human-in-the-Loop", icon: Stethoscope },
];

export function DataFlowVisual() {
  return (
    <section id="architecture" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            SYSTEM TOPOLOGY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            End-to-End Clinical Data Flow
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
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
                className="relative rounded-2xl bg-slate-50/70 border border-slate-200/90 p-5 flex flex-col justify-between shadow-2xs hover:border-teal-300 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      STEP {node.step}
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-white border border-slate-200/80 text-teal-700 flex items-center justify-center shadow-2xs">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-950 tracking-tight leading-snug">
                    {node.name}
                  </h3>

                  <p className="text-xs text-slate-500 font-mono">
                    {node.sub}
                  </p>
                </div>

                {/* Desktop Arrow Indicator between nodes */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-white border border-slate-200 items-center justify-center shadow-2xs text-slate-400"
                  >
                    <ArrowRight className="h-3 w-3" />
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
