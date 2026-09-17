"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SecurityRetestsPage() {
  const retests = [
    {
      id: "ret-1",
      finding_title: "Insecure Direct Object Reference (IDOR) on Synthetic Endpoint",
      endpoint: "/api/v1/predictions/export/",
      tester: "PentestAgentsProvider",
      status: "PASSED",
      message: "Retest confirmed: Endpoint checks user context and rejects mismatched tenant requests.",
      executed_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vulnerability Retest Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated verification confirms remediation before findings are resolved.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
          Schedule Retest
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-4 py-3">Finding Title</th>
              <th className="px-4 py-3">Target Endpoint</th>
              <th className="px-4 py-3">Verification Engine</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Execution Output</th>
              <th className="px-4 py-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {retests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.finding_title}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.endpoint}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.tester}</td>
                <td className="px-4 py-3">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Confirmed Fixed
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-sm truncate">{r.message}</td>
                <td className="px-4 py-3 text-xs text-slate-400 text-right">
                  {new Date(r.executed_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
