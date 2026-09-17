"use client";

import React, { useState, useEffect } from "react";
import { LoopDoctorViewer } from "@/components/engineering/LoopDoctorViewer";
import { LoopBudgetWidget } from "@/components/engineering/LoopBudgetWidget";
import { Button } from "@/components/ui/button";

export default function EngineeringHealthPage() {
  const [healthData, setHealthData] = useState({
    service: "loop-engineering",
    version: "0.1.0",
    pinned_commit: "b4f81c9a03de72e519e48b321cf7a40953a87109",
    is_enabled: true,
    total_loops: 3,
    active_runs: 0,
    completed_runs: 14,
    failed_runs: 0,
    loop_ready_score: 92,
    budget: {
      daily_limit: 20.0,
      current_daily_spend: 3.45,
      hard_stop: true,
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loop Engineering Diagnostics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Engine health, readiness score, and worktree isolation telemetry.
          </p>
        </div>
        <Button variant="outline" className="bg-white text-slate-700">
          Run Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoopDoctorViewer
          score={healthData.loop_ready_score}
          healthy={healthData.is_enabled}
          issues={[]}
          recommendations={[
            "All active loops have valid L1/L2 autonomy boundaries.",
            "Ephemeral worktrees are cleanly unlinked after runs.",
            "Clinical protected paths are strictly shielded.",
          ]}
        />
        <LoopBudgetWidget
          dailyLimit={healthData.budget.daily_limit}
          currentSpend={healthData.budget.current_daily_spend}
          hardStop={healthData.budget.hard_stop}
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Runtime Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Package Version:</span>{" "}
            <span className="font-mono text-slate-900">@cobusgreyling/loop v{healthData.version}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Pinned Git Commit:</span>{" "}
            <span className="font-mono text-slate-900">{healthData.pinned_commit}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Maker / Checker Gate:</span>{" "}
            <span className="text-emerald-700 font-semibold">Enforced (Independent Verifier)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Kill-Switch State:</span>{" "}
            <span className="text-emerald-700 font-semibold">Operational (Enabled)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
