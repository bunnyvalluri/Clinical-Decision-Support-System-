"use client";

import React, { useState, useEffect } from "react";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBMCPTool, NocoDBMCPExecutionResponse } from "@/services/nocodb/types";

export function MCPToolStatusCard() {
  const [tools, setTools] = useState<NocoDBMCPTool[]>([]);
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<NocoDBMCPExecutionResponse | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    async function loadTools() {
      try {
        const toolList = await nocodbClient.getMCPTools();
        if (isCurrent && Array.isArray(toolList)) {
          setTools(toolList);
        }
      } catch (e) {
        // Fallback default tools
        if (isCurrent) {
          setTools([
            {
              name: "nocodb_list_datasets",
              description: "Lists all accessible analytical datasets in the NocoDB workspace.",
              parameters: {},
            },
            {
              name: "nocodb_query_dataset",
              description: "Queries records from a specified analytical dataset with filtering.",
              parameters: { dataset_id: "string" },
            },
            {
              name: "nocodb_get_drift_metrics",
              description: "Retrieves feature drift metrics (PSI, KS statistic) from the Feature Drift Ledger.",
              parameters: {},
            },
            {
              name: "nocodb_get_quality_issues",
              description: "Queries open data quality issues and anomalies.",
              parameters: {},
            },
          ]);
        }
      }
    }
    loadTools();
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleTestInvoke = async (toolName: string) => {
    setExecutingTool(toolName);
    try {
      const args: Record<string, any> = {};
      if (toolName === "nocodb_query_dataset") {
        args.dataset_id = "ml_predictions_monitoring";
        args.limit = 5;
      }
      const res = await nocodbClient.executeMCPTool(toolName, args, "informaticist_console");
      setLastResponse(res);
      setShowModal(true);
    } catch (err: any) {
      setLastResponse({
        success: false,
        error: err?.response?.data?.error || "Execution failed.",
      });
      setShowModal(true);
    } finally {
      setExecutingTool(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            Ruflo v3.42.0 Gateway
          </span>
          <h3 className="text-sm font-bold text-slate-900 mt-1">
            NocoDB Model Context Protocol (MCP) Tools
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Policy: Read-Only Allowlist
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {tools.map((t) => (
          <div
            key={t.name}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {t.name}
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                  AUDITED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => handleTestInvoke(t.name)}
                disabled={executingTool === t.name}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 transition-colors disabled:opacity-50"
              >
                {executingTool === t.name ? "Invoking..." : "Test Invoke"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {showModal && lastResponse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  MCP Tool Execution Result
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {lastResponse.tool}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] max-h-64 overflow-y-auto">
              <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
