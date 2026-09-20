"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Activity,
  Bell,
  CheckCircle2,
  RefreshCw,
  Zap,
  Server,
  Sparkles,
  Wifi,
  ShieldCheck,
  Database,
  Layers,
} from "lucide-react";

interface RealTimeEvent {
  event: string;
  source: string;
  description: string;
  latency: string;
}

const REAL_TIME_EVENTS: RealTimeEvent[] = [
  {
    event: "Vitals Telemetry Ingestion",
    source: "Bedside ICU Monitors / HL7 FHIR",
    description: "High-frequency physiological vitals captured and broadcast to ward telemetry channels under 20ms.",
    latency: "< 20ms",
  },
  {
    event: "Ensemble Scoring Complete",
    source: "ML Inference Engine",
    description: "CatBoost & Random Forest ensembles complete calibrated scoring and emit risk tier updates.",
    latency: "< 50ms",
  },
  {
    event: "Attending Sign-Off Review",
    source: "Physician Bedside Portal",
    description: "Clinician reviews model recommendations and commits documented cryptographic order sign-off.",
    latency: "< 15ms",
  },
  {
    event: "Ward Deterioration Escalation",
    source: "Rapid Response Surveillance Service",
    description: "High/Critical trajectory shifts trigger synchronized alert pushes to triage and nursing pagers.",
    latency: "< 10ms",
  },
  {
    event: "EHR Order Synchronization",
    source: "Django Channels Event Layer",
    description: "Bi-directional admission, medication, and protocol adjustments across active bedside client sessions.",
    latency: "< 25ms",
  },
  {
    event: "Infrastructure Heartbeat",
    source: "Celery & Redis Channel Layer",
    description: "Continuous operational ping verifying database connection pools, worker pools, and ASGI socket liveness.",
    latency: "< 10ms",
  },
];

export function RealTimeFeatures() {
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick((prev) => (prev + 1) % 100);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="realtime" className="py-10 sm:py-16 lg:py-20 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>REAL-TIME INFRASTRUCTURE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Sub-20ms Real-Time{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Built on ASGI Django Channels, Redis In-Memory Pub/Sub, and secure WebSockets to ensure
            critical physiological events propagate instantly across hospital care teams.
          </p>
        </div>

        {/* Real-time Architecture Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left 7 cols: Real-Time Event Types */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {REAL_TIME_EVENTS.map((item, idx) => {
              const isPulsing = idx === pulseTick % REAL_TIME_EVENTS.length;
              return (
                <div
                  key={item.event}
                  className={`rounded-2xl sm:rounded-3xl bg-white border p-4 sm:p-5 space-y-2 transition-all duration-300 shadow-2xs group ${
                    isPulsing
                      ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                      : "border-slate-200/90 hover:border-teal-400 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-950 group-hover:text-teal-800 transition-colors">
                      {item.event}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.latency}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-teal-700 font-semibold">
                    {item.source}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right 5 cols: Live Infrastructure Status Card (Pure Light Clinical Theme) */}
          <div className="lg:col-span-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-300 p-4 sm:p-6 lg:p-7 flex flex-col justify-between shadow-xl space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-teal-700 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-950 uppercase tracking-wide">
                    Live Channel Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  ONLINE • LOW LATENCY
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">ASGI Protocol:</span>
                  <span className="font-bold text-slate-900">Django Channels 4.1</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Channel Layer:</span>
                  <span className="font-bold text-slate-900">Redis In-Memory Pub/Sub</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Transport Security:</span>
                  <span className="font-bold text-slate-900">WSS / TLS 1.3 Strict</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">PostgreSQL Store:</span>
                  <span className="font-bold text-teal-800">Neon Authoritative Store</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-700" />
                    Round-Trip Latency Guarantee:
                  </span>
                  <span className="text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    &lt; 20ms p99
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Critical care vitals and alert escalations arrive at bedside tablets under 20 milliseconds,
                  enabling rapid clinical intervention.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Concurrent Sockets: 10,000+ Active</span>
              <span className="font-bold text-slate-700">Zero Frame Drops</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
