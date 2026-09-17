"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  ArrowLeft,
  CheckCircle2,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

interface ToolDef {
  name: string;
  category: string;
  description: string;
  allowedRoles: string[];
  allowedAgents: string[];
  capability: string;
  dataClassification: string;
  auditRequired: boolean;
  timeoutMs: number;
}

export default function AdminAISecurityPage() {
  const [tools, setTools] = React.useState<ToolDef[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTools = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ count: number; tools: ToolDef[] }>("/ai/tools/");
      setTools(res.data?.tools || []);
    } catch {
      // Keep empty array
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Link href="/admin/ai" className="hover:text-purple-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          AI Overview
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Security & Tool Governance</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-purple-600" />
            AI Security, Tool Allowlist & PHI Governance
          </h1>
          <p className="text-sm text-slate-500">
            Zero-trust tool authorization boundaries, prompt injection defense, and HIPAA PHI isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTools}
            disabled={isLoading}
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Prompt Injection Defense
          </div>
          <p className="text-xs text-emerald-900/80 leading-relaxed">
            Active syntactic token filtering, regex evasion scanners, and system prompt delimiter isolation active on all inbound queries.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-emerald-700">STATUS: ENFORCING</div>
        </div>

        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-1">
            <Lock className="h-4 w-4 text-blue-600" />
            PHI Segregation Standard
          </div>
          <p className="text-xs text-blue-900/80 leading-relaxed">
            Patient identifiers stripped prior to agent reasoning. Pre-write memory sanitizers permanently reject MRNs and personal health data.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-blue-700">STATUS: ENFORCING</div>
        </div>

        <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm mb-1">
            <Zap className="h-4 w-4 text-purple-600" />
            Loop & Recursion Circuit Breaker
          </div>
          <p className="text-xs text-purple-900/80 leading-relaxed">
            Hard execution boundaries: max 10 steps, 60s timeout ceiling, 15 max tool invocations per workflow, 2 max retries.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-purple-700">STATUS: ACTIVE</div>
        </div>
      </div>

      {/* Tool Permission Registry Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Tool Capability & Classification Allowlist
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading tool manifests…</div>
        ) : tools.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            No registered tools found.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tool Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Data Classification</th>
                    <th className="py-3 px-4">Allowed Roles</th>
                    <th className="py-3 px-4">Allowed Personas</th>
                    <th className="py-3 px-4">Timeout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tools.map((tool) => (
                    <tr key={tool.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-purple-950">
                        {tool.name}
                        <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                          {tool.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            tool.category === "FORBIDDEN"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : tool.category === "RESTRICTED"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : tool.category === "CONTROLLED_WRITE"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {tool.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 text-[11px]">
                        {tool.dataClassification}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tool.allowedRoles.length === 0 ? (
                            <span className="text-rose-600 font-semibold text-[10px]">NONE (FORBIDDEN)</span>
                          ) : (
                            tool.allowedRoles.map((r) => (
                              <span key={r} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                {r}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tool.allowedAgents.length === 0 ? (
                            <span className="text-rose-600 font-semibold text-[10px]">NONE</span>
                          ) : (
                            tool.allowedAgents.map((a) => (
                              <span key={a} className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-mono">
                                {a}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {tool.timeoutMs ? `${tool.timeoutMs}ms` : "0ms"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
