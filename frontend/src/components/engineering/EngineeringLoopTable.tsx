"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EngineeringLoopItem {
  id: string;
  name: string;
  description: string;
  pattern: string;
  autonomy_level: string;
  cadence: string;
  status: string;
  is_active: boolean;
}

interface EngineeringLoopTableProps {
  loops: EngineeringLoopItem[];
  onTriggerRun?: (id: string) => void;
}

export const EngineeringLoopTable: React.FC<EngineeringLoopTableProps> = ({
  loops,
  onTriggerRun,
}) => {
  const getAutonomyBadge = (autonomy: string) => {
    switch (autonomy) {
      case "L1_REPORT_ONLY":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">L1 Report Only</Badge>;
      case "L2_ASSISTED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">L2 Assisted</Badge>;
      case "L3_CONTROLLED_UNATTENDED":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">L3 Unattended</Badge>;
      default:
        return <Badge variant="outline">{autonomy}</Badge>;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Loop Name</th>
              <th className="px-4 py-3">Pattern</th>
              <th className="px-4 py-3">Autonomy Level</th>
              <th className="px-4 py-3">Cadence</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loops.map((loop) => (
              <tr key={loop.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  <div>{loop.name}</div>
                  <div className="text-xs text-slate-400 font-normal">{loop.description}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{loop.pattern}</td>
                <td className="px-4 py-3">{getAutonomyBadge(loop.autonomy_level)}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{loop.cadence}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {loop.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link href={`/admin/engineering/loops/${loop.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-slate-700">
                      Configure
                    </Button>
                  </Link>
                  {onTriggerRun && (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onTriggerRun(loop.id)}
                    >
                      Run Now
                    </Button>
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
