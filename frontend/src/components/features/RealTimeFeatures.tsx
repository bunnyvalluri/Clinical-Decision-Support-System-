"use client";

import React from "react";
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
} from "lucide-react";

interface RealTimeEvent {
  event: string;
  source: string;
  description: string;
  latency: string;
}

const REAL_TIME_EVENTS: RealTimeEvent[] = [
  {
    event: "Vitals Ingestion Update",
    source: "Bedside Monitor / Nurse Workspace",
    description: "New physiological vitals captured and broadcast to ward telemetry channels.",
    latency: "< 20ms",
  },
  {
    event: "Prediction Completed",
    source: "ML Inference Engine",
    description: "Ensemble model completes calibrated scoring and emits risk tier updates.",
    latency: "< 50ms",
  },
  {
    event: "Prediction Reviewed",
    source: "Physician Sign-Off",
    description: "Clinician reviews model recommendations and commits documented override.",
    latency: "< 15ms",
  },
  {
    event: "Clinical Alert & Escalation",
    source: "Ward Surveillance Service",
    description: "High/Critical deterioration triggers synchronized alerts to attending teams.",
    latency: "< 10ms",
  },
  {
    event: "Patient Record Modification",
    source: "Django Channels Event Layer",
    description: "Synchronized admission and medication adjustments across active client sessions.",
    latency: "< 25ms",
  },
  {
    event: "System Health Telemetry",
    source: "Celery & Redis Heartbeat",
    description: "Continuous operational ping verifying database, worker, and ASGI socket liveness.",
    latency: "< 10ms",
  },
];

export function RealTimeFeatures() {
  return (
    <section id="realtime" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>REAL-TIME INFRASTRUCTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Real-Time{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Built on ASGI Django Channels, Redis Pub/Sub, and secure WebSockets to ensure
            critical physiological events propagate instantly across hospital care teams.
          </p>
        </div>

        {/* Real-time Architecture Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left 2 cols: Real-Time Event Types */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {REAL_TIME_EVENTS.map((item) => (
              <div
                key={item.event}
                className="rounded-2xl bg-slate-50/70 border border-slate-200/90 p-5 space-y-2.5 hover:border-teal-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-950 group-hover:text-teal-700 transition-colors">
                    {item.event}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
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
            ))}
          </div>

          {/* Right 1 col: Live Infrastructure Status Card */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-50/95 via-white to-slate-50/90 border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between shadow-lg shadow-slate-100 space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-teal-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                    Channel Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-slate-600 font-medium">ASGI Protocol:</span>
                  <span className="font-mono font-bold text-slate-900">Django Channels</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-slate-600 font-medium">Channel Layer:</span>
                  <span className="font-mono font-bold text-slate-900">Redis In-Memory Pub/Sub</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-slate-600 font-medium">Transport Security:</span>
                  <span className="font-mono font-bold text-slate-900">WSS / TLS 1.3</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-slate-600 font-medium">Average Message Hop:</span>
                  <span className="font-mono font-bold text-emerald-700">&lt; 8.4ms</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-950 text-xs flex items-center gap-2.5 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
              <span className="text-[11px] leading-snug font-medium">
                Zero telemetry drop guarantee with automatic client reconnection and state hydration.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
