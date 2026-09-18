"use client";

import React from "react";
import {
  Cpu,
  User,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { JulesActivity } from "@/types/jules";

interface Props {
  activities: JulesActivity[];
  loading?: boolean;
}

export function JulesActivityTimeline({ activities, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 text-slate-400">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No activity recorded for this session yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => {
        const isUser = act.originator === "USER";
        const isSystem = act.originator === "SYSTEM";

        let Icon = Cpu;
        let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";

        if (isUser) {
          Icon = User;
          badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
        } else if (isSystem) {
          Icon = ShieldCheck;
          badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
        } else if (act.activity_type.includes("PLAN")) {
          Icon = FileCode;
          badgeColor = "bg-teal-50 text-teal-700 border-teal-200";
        }

        const dateStr = new Date(act.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        return (
          <div key={act.id} className="relative group">
            {/* Dot on line */}
            <div className="absolute -left-6 top-1.5 h-5 w-5 rounded-full bg-white border-2 border-slate-300 group-hover:border-teal-600 flex items-center justify-center transition-colors">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-teal-600" />
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{act.originator}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {act.activity_type}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {dateStr}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {act.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
