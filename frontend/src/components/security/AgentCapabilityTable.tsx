"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface CapabilityItem {
  id: string;
  capability: string;
  risk_level: string;
  required_permission: string;
  allowed_environment: string;
  network_policy: string;
  approval_required: boolean;
  is_active: boolean;
}

interface AgentCapabilityTableProps {
  capabilities: CapabilityItem[];
}

export const AgentCapabilityTable: React.FC<AgentCapabilityTableProps> = ({ capabilities }) => {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
      default:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Low</Badge>;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Capability</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Required Permission</th>
              <th className="px-4 py-3">Allowed Environment</th>
              <th className="px-4 py-3">Network Policy</th>
              <th className="px-4 py-3">Dual Approval</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {capabilities.map((cap) => (
              <tr key={cap.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">{cap.capability}</td>
                <td className="px-4 py-3">{getRiskBadge(cap.risk_level)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{cap.required_permission}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-50">
                    {cap.allowed_environment}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{cap.network_policy}</td>
                <td className="px-4 py-3 text-xs">
                  {cap.approval_required ? (
                    <span className="text-amber-600 font-medium">Required</span>
                  ) : (
                    <span className="text-slate-400">Pre-Approved</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {cap.is_active ? (
                    <span className="inline-flex items-center text-xs text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-300"></span> Disabled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
