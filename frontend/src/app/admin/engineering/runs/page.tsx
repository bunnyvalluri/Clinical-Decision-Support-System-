"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function EngineeringRunsPage() {
  const [runs] = useState([
    {
      id: "run-e2e-001",
      loop_name: "Daily Repository Health & CI Triage",
      pattern: "DAILY_TRIAGE",
      autonomy_level: "L1_REPORT_ONLY",
      status: "COMPLETED",
      ready_score: 92,
      duration: "38s",
      cost: "$0.003",
      started_at: new Date(Date.now() - 3600000).toLocaleString(),
    },
    {
      id: "run-ci-042",
      loop_name: "CI Sweeper & Syntax Auto-Fixer",
      pattern: "CI_SWEEPER",
      autonomy_level: "L2_ASSISTED",
      status: "COMPLETED",
      ready_score: 88,
      duration: "1m 12s",
      cost: "$0.008",
      started_at: new Date(Date.now() - 7200000).toLocaleString(),
    },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engineering Loop Runs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Execution history, Maker/Checker audits, and worktree traces.
          </p>
        </div>
        <Link href="/admin/engineering/loops">
          <Button variant="outline" className="bg-white text-slate-700">
            View Active Loops
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-4 py-3">Run ID</th>
              <th className="px-4 py-3">Loop & Pattern</th>
              <th className="px-4 py-3">Autonomy</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ready Score</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3 text-right">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">
                  <Link href={`/admin/engineering/runs/${r.id}`}>{r.id}</Link>
                </td>
                <td className="px-4 py-3 text-slate-900">
                  <div className="font-medium">{r.loop_name}</div>
                  <div className="text-xs text-slate-400 font-mono">{r.pattern}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <Badge variant="outline" className="bg-slate-50">{r.autonomy_level}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">{r.ready_score}%</td>
                <td className="px-4 py-3 text-xs text-slate-600 font-mono">{r.cost}</td>
                <td className="px-4 py-3 text-xs text-slate-400 text-right">{r.started_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
