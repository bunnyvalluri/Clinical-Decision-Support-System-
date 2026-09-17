"use client";

import React, { useState, useEffect } from "react";
import { EngineeringLoopTable, EngineeringLoopItem } from "@/components/engineering/EngineeringLoopTable";
import { LoopReadyScoreMeter } from "@/components/engineering/LoopReadyScoreMeter";
import { LoopBudgetWidget } from "@/components/engineering/LoopBudgetWidget";
import { Button } from "@/components/ui/button";

export default function EngineeringLoopsPage() {
  const [loops, setLoops] = useState<EngineeringLoopItem[]>([
    {
      id: "loop-1",
      name: "Daily Repository Health & CI Triage",
      description: "L1 report-only sweep evaluating failed tests, dependency alerts, and spec drift",
      pattern: "DAILY_TRIAGE",
      autonomy_level: "L1_REPORT_ONLY",
      cadence: "DAILY",
      status: "READY",
      is_active: true,
    },
    {
      id: "loop-2",
      name: "CI Sweeper & Syntax Auto-Fixer",
      description: "L2 assisted loop preparing candidate patches for lint/type errors in worktrees",
      pattern: "CI_SWEEPER",
      autonomy_level: "L2_ASSISTED",
      cadence: "CI_EVENT",
      status: "READY",
      is_active: true,
    },
    {
      id: "loop-3",
      name: "Spec Kit Convergence Auditor",
      description: "Detects divergence between specs, plans, and active code implementations",
      pattern: "SPEC_CONVERGENCE",
      autonomy_level: "L1_REPORT_ONLY",
      cadence: "PR_EVENT",
      status: "READY",
      is_active: true,
    },
  ]);

  const handleTrigger = (id: string) => {
    alert(`Triggered loop run: ${id}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Engineering Loop Orchestration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Governed by Cobus Greyling Loop Engineering (@cobusgreyling/loop).
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          Register New Loop
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoopReadyScoreMeter score={92} />
        <LoopBudgetWidget dailyLimit={20.0} currentSpend={3.45} hardStop={true} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Active Engineering Loops
        </h2>
        <EngineeringLoopTable loops={loops} onTriggerRun={handleTrigger} />
      </div>
    </div>
  );
}
