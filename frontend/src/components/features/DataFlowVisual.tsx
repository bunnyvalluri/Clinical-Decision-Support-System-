"use client";

import React, { useState } from "react";
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
  ShieldCheck,
  Zap,
} from "lucide-react";

interface FlowNode {
  step: string;
  name: string;
  sub: string;
  detail: string;
  protocol: string;
  icon: React.ComponentType<{ className?: string }>;
  isFinal?: boolean;
}

const FLOW_NODES: FlowNode[] = [
  { step: "01", name: "Care Team & Vitals", sub: "Bedside Telemetry", detail: "ICU sensors & manual vitals stream continuous readings.", protocol: "HL7 FHIR v4.0.1", icon: Users },
  { step: "02", name: "Next.js 16 Client", sub: "Secure Web App", detail: "Accessible interface with Apple HIG touch targets.", protocol: "TypeScript / React", icon: Layout },
  { step: "03", name: "Django REST & ASGI", sub: "Security & Channels", detail: "Granular 5-role RBAC & WebSocket router.", protocol: "TLS 1.3 / WSS", icon: Server },
  { step: "04", name: "Neon PostgreSQL", sub: "Authoritative Store", detail: "ACID transactions & immutable audit trails.", protocol: "PostgreSQL 16", icon: Database },
  { step: "05", name: "ML Inference Pipeline", sub: "Ensemble Scoring", detail: "StandardScaler normalization & CatBoost inference.", protocol: "Platt Calibrated", icon: Cpu },
  { step: "06", name: "Deterministic Gate", sub: "Clinical Scoring", detail: "qSOFA, NEWS2 & shock index verification.", protocol: "Deterministic Rules", icon: Activity },
  { step: "07", name: "TreeSHAP Explainer", sub: "Feature Weights", detail: "Exact additive Shapley pathophysiological drivers.", protocol: "Shapley Values", icon: Sliders },
  { step: "08", name: "Physician Sign-Off", sub: "Human-in-the-Loop", detail: "Attending clinician order authorization.", protocol: "SHA-256 Sign-Off", icon: Stethoscope, isFinal: true },
];

export function DataFlowVisual() {
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number | null>(null);

  return (
    <section id="architecture" className="py-10 sm:py-16 lg:py-20 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>SYSTEM TOPOLOGY &amp; PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            End-to-End{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Data Flow
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            How physiological telemetry securely traverses from bedside input to authoritative database
            persistence, machine-learning inference, and validated clinician review.
          </p>
        </div>

        {/* 8-Node Flow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 relative">
          {FLOW_NODES.map((node, idx) => {
            const IconComponent = node.icon;
            const isSelected = selectedNodeIdx === idx;

            return (
              <div
                key={node.step}
                tabIndex={0}
                onClick={() => setSelectedNodeIdx(isSelected ? null : idx)}
                className={`relative rounded-2xl sm:rounded-3xl border p-4 sm:p-5 lg:p-6 flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer group ${
                  node.isFinal
                    ? "bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
                    : isSelected
                    ? "bg-white border-teal-600 shadow-md ring-2 ring-teal-500/20"
                    : "bg-white border-slate-200/90 hover:border-teal-400"
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs font-black text-slate-400">
                      STEP {node.step}
                    </span>
                    <div
                      className={`h-10 w-10 rounded-2xl border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200 ${
                        node.isFinal
                          ? "bg-teal-700 border-teal-800 text-white shadow-xs"
                          : "bg-teal-50 border border-teal-200 text-teal-700"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-950 tracking-tight leading-snug group-hover:text-teal-800 transition-colors">
                      {node.name}
                    </h3>
                    <p className="text-[11px] text-teal-700 font-mono font-semibold mt-0.5">
                      {node.sub}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {node.detail}
                  </p>

                  <div className="pt-1">
                    <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      Protocol: {node.protocol}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                  {node.isFinal ? (
                    <span className="font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                      MANDATORY HUMAN SIGN-OFF
                    </span>
                  ) : (
                    <span className="text-slate-400">Automated Pipeline</span>
                  )}
                  <span className="text-slate-400">Node {node.step}/08</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
