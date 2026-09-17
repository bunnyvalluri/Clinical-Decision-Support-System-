"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

interface AgentDef {
  id: string;
  name: string;
  role: string;
  category: string;
  version: string;
  description: string;
  capabilities: string[];
  allowedTools: string[];
  deniedTools: string[];
  timeoutSeconds: number;
}

export default function AdminAIAgentsPage() {
  const [agents, setAgents] = React.useState<AgentDef[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const fetchAgents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ count: number; agents: AgentDef[] }>("/ai/agents/");
      setAgents(res.data?.agents || []);
    } catch {
      // Keep empty array on failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const categories = React.useMemo(() => {
    const set = new Set(agents.map((a) => a.category));
    return ["ALL", ...Array.from(set)];
  }, [agents]);

  const filteredAgents = React.useMemo(() => {
    if (selectedCategory === "ALL") return agents;
    return agents.filter((a) => a.category === selectedCategory);
  }, [agents, selectedCategory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Link href="/admin/ai" className="hover:text-purple-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          AI Overview
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Agent Registry</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Specialized Agent Registry
          </h1>
          <p className="text-sm text-slate-500">
            17 specialized agents deployed in a hierarchical swarm with least-privilege tool execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgents}
            disabled={isLoading}
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer ${
              selectedCategory === cat
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading Ruflo agent manifests…</div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No registered agents found for the selected category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {agent.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">v{agent.version}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{agent.name}</h3>
                <p className="text-xs font-mono text-purple-600 mt-0.5">{agent.id}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{agent.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Allowed Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {agent.allowedTools.map((tool) => (
                      <span
                        key={tool}
                        className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] flex items-center gap-1 font-mono"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {agent.deniedTools && agent.deniedTools.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Denied Boundaries:</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.deniedTools.map((tool) => (
                        <span
                          key={tool}
                          className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] flex items-center gap-1 font-mono"
                        >
                          <XCircle className="h-2.5 w-2.5" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Timeout: {agent.timeoutSeconds}s
                  </span>
                  <span className="text-purple-600 font-medium">Least-Privilege</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
