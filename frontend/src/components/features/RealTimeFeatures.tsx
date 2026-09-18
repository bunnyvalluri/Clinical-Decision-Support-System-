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
    <section id="realtime" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            REAL-TIME INFRASTRUCTURE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Real-Time Clinical Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
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
                className="rounded-2xl bg-slate-50/70 border border-slate-200/90 p-5 space-y-2.5 hover:border-teal-300 hover:shadow-xs transition-all duration-200 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-950">{item.event}</span>
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
          <div className="rounded-3xl bg-slate-50/90 border border-slate-200 p-6 flex flex-col justify-between shadow-2xs space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-teal-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-950">
                    Channel Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ONLINE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">ASGI Protocol:</span>
                  <span className="font-mono font-bold text-slate-900">Django Channels</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">Channel Layer:</span>
                  <span className="font-mono font-bold text-slate-900">Redis In-Memory Pub/Sub</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">Connection Transport:</span>
                  <span className="font-mono font-bold text-slate-900">WSS / TLS 1.3</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">Average Message Hop:</span>
                  <span className="font-mono font-bold text-emerald-700">&lt; 8.4ms</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-900 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
              <span className="text-[11px] leading-snug">
                Zero telemetry drop guarantee with automatic client reconnection and state hydration.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
