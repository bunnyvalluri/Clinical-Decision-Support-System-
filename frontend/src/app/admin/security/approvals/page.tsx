"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApprovalDialog } from "@/components/security/ApprovalDialog";

export default function SecurityApprovalsPage() {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const pendingApprovals = [
    {
      id: "appr-1",
      target: "Synthetic CDSS Staging Environment",
      environment: "STAGING",
      requested_by: "devsecops_lead",
      scope: "/api/v1/health/, /api/v1/predictions/, /api/v1/auth/",
      expires_in: "48 Hours",
      status: "PENDING",
    },
    {
      id: "appr-2",
      target: "Internal Microservice Auth Gateway",
      environment: "SECURITY_TEST",
      requested_by: "redteam_analyst",
      scope: "/api/v1/auth/tokens/, /api/v1/rbac/",
      expires_in: "24 Hours",
      status: "PENDING",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dual-Custody Security Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Policy enforcement requirement: High-risk security tests require dual-custody authorization.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-900">Pending Execution Requests</h2>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {pendingApprovals.length} Pending Approval
          </Badge>
        </div>

        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-4 py-3">Target Name</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Permitted Scope</th>
              <th className="px-4 py-3">Authorization Window</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingApprovals.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{item.target}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {item.environment}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.requested_by}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{item.scope}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{item.expires_in}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    onClick={() => setSelectedTarget(item.target)}
                  >
                    Review & Authorize
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ApprovalDialog
        isOpen={Boolean(selectedTarget)}
        targetName={selectedTarget || ""}
        scopeSummary="/api/v1/health/, /api/v1/predictions/ (Synthetic Staging Only)"
        onConfirm={() => setSelectedTarget(null)}
        onCancel={() => setSelectedTarget(null)}
      />
    </div>
  );
}
