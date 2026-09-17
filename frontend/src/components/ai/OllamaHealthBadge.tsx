"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, Cpu, HardDrive, RefreshCw, XCircle } from "lucide-react";
import apiClient from "@/services/apiClient";

interface OllamaHealthData {
  status: string;
  connected: boolean;
  base_url: string;
  latency_ms: number;
  circuit_breaker: {
    state: string;
    failure_count: number;
  };
  installed_models_count: number;
  running_models_count: number;
}

export function OllamaHealthBadge() {
  const [health, setHealth] = useState<OllamaHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get<OllamaHealthData>("/ai/providers/ollama/health/");
      setHealth(res.data);
    } catch {
      setHealth({
        status: "unreachable",
        connected: false,
        base_url: "http://localhost:11434",
        latency_ms: 0,
        circuit_breaker: { state: "UNKNOWN", failure_count: 0 },
        installed_models_count: 0,
        running_models_count: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span>Checking Ollama...</span>
      </div>
    );
  }

  const isConnected = health?.connected ?? false;

  return (
    <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs text-slate-700">
      <div className="flex items-center gap-1.5">
        <span
          className={`relative flex h-2 w-2 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-amber-500"
          }`}
        >
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
        </span>
        <span className="font-semibold text-slate-800">
          Ollama {isConnected ? "Online" : "Offline"}
        </span>
      </div>

      <span className="text-slate-300">|</span>

      <div className="flex items-center gap-1 text-slate-600">
        <Cpu className="w-3.5 h-3.5 text-slate-400" />
        <span>{health?.running_models_count ?? 0} loaded</span>
      </div>

      <span className="text-slate-300">|</span>

      <div className="flex items-center gap-1 text-slate-600">
        <Activity className="w-3.5 h-3.5 text-slate-400" />
        <span>{health?.latency_ms ?? 0}ms</span>
      </div>

      <button
        onClick={fetchHealth}
        disabled={refreshing}
        title="Refresh Ollama status"
        className="text-slate-400 hover:text-slate-600 transition-colors ml-0.5"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
      </button>
    </div>
  );
}
