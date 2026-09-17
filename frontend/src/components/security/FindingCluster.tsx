"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface ClusterItem {
  id: string;
  cluster_hash: string;
  title: string;
  vulnerability_type: string;
  affected_endpoint: string;
  findings_count: number;
  providers: string[];
  confidence_score: number;
  status: string;
}

interface FindingClusterProps {
  clusters: ClusterItem[];
}

export const FindingCluster: React.FC<FindingClusterProps> = ({ clusters }) => {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Multi-Provider Finding Clusters</h3>
          <p className="text-xs text-slate-500">
            Deduplicated and correlated vulnerabilities across Strix, Bug Hunter, and Pentest-Agents.
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          {clusters.length} Unique Clusters
        </Badge>
      </div>
      <div className="divide-y divide-slate-100">
        {clusters.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No cross-provider finding clusters recorded yet.
          </div>
        ) : (
          clusters.map((c) => (
            <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-medium text-sm text-slate-900">{c.title}</div>
                <div className="flex gap-1">
                  {c.providers.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span><strong className="text-slate-700">Endpoint:</strong> {c.affected_endpoint}</span>
                <span><strong className="text-slate-700">Type:</strong> {c.vulnerability_type}</span>
                <span><strong className="text-slate-700">Correlated Findings:</strong> {c.findings_count}</span>
                <span className="font-mono text-[10px] text-slate-400">Hash: {c.cluster_hash.slice(0, 10)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
