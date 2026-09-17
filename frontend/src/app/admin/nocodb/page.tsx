"use client";

import React, { useState, useEffect } from "react";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset, NocoDBAuditEvent } from "@/services/nocodb/types";
import { DatasetSelector } from "@/features/nocodb-workspace/components/DatasetSelector";
import { NocoDBGridView } from "@/features/nocodb-workspace/components/NocoDBGridView";
import { NocoDBHealthWidget } from "@/features/nocodb-workspace/components/NocoDBHealthWidget";
import { MCPToolStatusCard } from "@/features/nocodb-workspace/components/MCPToolStatusCard";

export default function AdminNocoDBPage() {
  const [datasets, setDatasets] = useState<NocoDBDataset[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("ml_predictions_monitoring");
  const [auditLogs, setAuditLogs] = useState<NocoDBAuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"workspace" | "audit" | "mcp">("workspace");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [dsList, logs] = await Promise.all([
        nocodbClient.listDatasets(),
        nocodbClient.getAuditLogs(30),
      ]);
      setDatasets(dsList);
      setAuditLogs(logs);
      if (dsList.length > 0 && !selectedSlug) {
        setSelectedSlug(dsList[0].slug);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentDataset = datasets.find((d) => d.slug === selectedSlug);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              NocoDB Administration &amp; Governance
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
              IT Administrator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            SSRF boundaries, auxiliary container health, immutable audit logs, and schema controls.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <NocoDBHealthWidget canSync={true} onSyncTriggered={loadData} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "workspace"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Governed Datasets
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Immutable Audit Trail ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("mcp")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "mcp"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          MCP Tool Policy Gateway
        </button>
      </div>

      {activeTab === "workspace" && (
        <div className="space-y-6">
          <DatasetSelector
            datasets={datasets}
            selectedSlug={selectedSlug}
            onSelectDataset={(s) => setSelectedSlug(s)}
            isLoading={isLoading}
          />

          {currentDataset && (
            <NocoDBGridView
              dataset={currentDataset}
              canMutate={true}
              canExport={true}
            />
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              NocoDB Access &amp; Mutation Ledger
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Neon PostgreSQL Authoritative Store
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target Dataset</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {evt.created_at.slice(0, 19).replace("T", " ")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold uppercase text-[10px]">
                        {evt.user_role}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {evt.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">
                        {evt.dataset_slug}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {evt.ip_address || "internal"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                        {JSON.stringify(evt.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "mcp" && <MCPToolStatusCard />}
    </div>
  );
}
