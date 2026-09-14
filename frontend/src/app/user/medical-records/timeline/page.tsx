"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Calendar, HeartPulse, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TIMELINE_EVENTS = [
  {
    id: "evt-01",
    date: "2026-09-13 14:48",
    category: "AI_ASSESSMENT",
    title: "AI Health Risk Assessment Generated",
    detail: "CardioEnsemble-RF estimated a 42.0% moderate risk probability. Clinical review pending.",
    icon: Sparkles,
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: "evt-02",
    date: "2026-09-12 08:30",
    category: "VITALS",
    title: "Patient Self-Reported Vitals Logged",
    detail: "Blood Pressure: 134/86 mmHg, Pulse: 76 bpm, SpO2: 97%.",
    icon: HeartPulse,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "evt-03",
    date: "2026-09-10 14:30",
    category: "ENCOUNTER",
    title: "Cardiology Follow-Up Clinic Visit",
    detail: "Encounter with Doctor. Medication tolerance verified.",
    icon: Calendar,
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    id: "evt-04",
    date: "2026-07-22 09:15",
    category: "ENCOUNTER",
    title: "Telemetry Observation Encounter",
    detail: "Doctor finalized inpatient cardiac stepdown records.",
    icon: FileText,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export default function MedicalRecordsTimelinePage() {
  const [filter, setFilter] = React.useState("ALL");

  const filtered = TIMELINE_EVENTS.filter((e) => filter === "ALL" || e.category === filter);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/user/medical-records">
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Medical Records
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-600" />
            Chronological Health Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete sequential log of visits, measurements, AI assessments, and care milestones.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {["ALL", "ENCOUNTER", "VITALS", "AI_ASSESSMENT"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === cat ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat === "ALL" ? "All Events" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative group">
              <div className="absolute -left-[31px] top-1.5 h-6 w-6 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-teal-600" />
              </div>

              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge className={`text-[10px] font-bold border ${item.color}`}>
                      <Icon className="h-3 w-3 mr-1 inline" />
                      {item.category.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
