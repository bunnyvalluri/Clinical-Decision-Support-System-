"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Cpu,
  Download,
  FileCheck,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import apiClient from "@/services/apiClient";

interface RegisteredModel {
  id: string;
  name: string;
  tag: string;
  provider: string;
  runtime: string;
  context_length: number;
  capabilities: string[];
  license: string;
  status: "DISCOVERED" | "EVALUATING" | "APPROVED" | "ACTIVE" | "DEPRECATED" | "RETIRED";
  approved_roles: string[];
  data_classification: string;
  updated_at: string;
}

export function OllamaModelManager() {
  const [models, setModels] = useState<RegisteredModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullTag, setPullTag] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ models: RegisteredModel[] }>("/ai/providers/ollama/models/");
      setModels(res.data.models || []);
    } catch {
      setMessage({ text: "Failed to load model registry.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage(null);
      await apiClient.post("/ai/providers/ollama/models/sync/");
      setMessage({ text: "Models synchronized successfully with local Ollama daemon.", type: "success" });
      await fetchModels();
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.error || "Model sync failed.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pullTag.trim()) return;
    try {
      setPulling(true);
      setMessage(null);
      await apiClient.post("/ai/providers/ollama/models/pull/", { model: pullTag.trim() });
      setMessage({ text: `Model '${pullTag}' successfully pulled into local library.`, type: "success" });
      setPullTag("");
      await fetchModels();
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.error || "Pull request failed.", type: "error" });
    } finally {
      setPulling(false);
    }
  };

  const handleStatusChange = async (modelTag: string, newStatus: string) => {
    try {
      setMessage(null);
      await apiClient.post(`/ai/providers/ollama/models/${encodeURIComponent(modelTag)}/status/`, {
        status: newStatus,
      });
      setMessage({ text: `Model status updated to ${newStatus}.`, type: "success" });
      await fetchModels();
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.error || "Status update failed.", type: "error" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">ACTIVE</span>;
      case "APPROVED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case "EVALUATING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">EVALUATING</span>;
      case "DISCOVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">DISCOVERED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Ollama Local Model Registry & Governance
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative local models registered in Neon PostgreSQL. Clinical routing requires informaticist approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-blue-600" : ""}`} />
            {syncing ? "Syncing..." : "Sync Local Daemon"}
          </button>
        </div>
      </div>

      {/* Banner / Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Model Pull Form */}
      <form onSubmit={handlePull} className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. llama3.3:8b-instruct-q4_K_M or nomic-embed-text:latest"
          value={pullTag}
          onChange={(e) => setPullTag(e.target.value)}
          className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={pulling || !pullTag.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {pulling ? "Pulling..." : "Pull Model"}
        </button>
      </form>

      {/* Model Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Model Tag</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Context</th>
              <th className="px-4 py-3">Capabilities</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" />
                  Loading model registry...
                </td>
              </tr>
            ) : models.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No local models registered. Click &apos;Sync Local Daemon&apos; to discover models.
                </td>
              </tr>
            ) : (
              models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{m.tag}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{m.provider} • {m.data_classification}</div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(m.status)}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{m.context_length?.toLocaleString()} tokens</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.capabilities?.map((cap) => (
                        <span key={cap} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.license}</td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    {m.status !== "ACTIVE" && (
                      <button
                        onClick={() => handleStatusChange(m.tag, "ACTIVE")}
                        className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-medium transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                    {m.status !== "APPROVED" && (
                      <button
                        onClick={() => handleStatusChange(m.tag, "APPROVED")}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {m.status !== "DEPRECATED" && (
                      <button
                        onClick={() => handleStatusChange(m.tag, "DEPRECATED")}
                        className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-[11px] transition-colors"
                      >
                        Deprecate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
