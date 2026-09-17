"use client";

import React, { useState, useEffect } from "react";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset, NocoDBRow } from "@/services/nocodb/types";
import { DatasetSelector } from "@/features/nocodb-workspace/components/DatasetSelector";
import { NocoDBGridView } from "@/features/nocodb-workspace/components/NocoDBGridView";
import { NocoDBHealthWidget } from "@/features/nocodb-workspace/components/NocoDBHealthWidget";
import { MLMonitoringView } from "@/features/nocodb-workspace/components/MLMonitoringView";
import { MCPToolStatusCard } from "@/features/nocodb-workspace/components/MCPToolStatusCard";
import { DataQualityDrawer } from "@/features/nocodb-workspace/components/DataQualityDrawer";

export default function InformaticistDataWorkspacePage() {
  const [datasets, setDatasets] = useState<NocoDBDataset[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("ml_predictions_monitoring");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"grid" | "ml_monitoring" | "mcp_gateway">("grid");
  const [selectedRow, setSelectedRow] = useState<NocoDBRow | null>(null);

  const loadDatasets = async () => {
    try {
      const list = await nocodbClient.listDatasets();
      setDatasets(list);
      if (list.length > 0 && !selectedSlug) {
        setSelectedSlug(list[0].slug);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadDatasets();
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
              Clinical Data Workspace
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              NocoDB Auxiliary Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Governed de-identified analytical projections, MLOps metrics, and data quality queues.
          </p>
        </div>

        {/* Workspace Health */}
        <div className="w-full sm:w-auto">
          <NocoDBHealthWidget canSync={true} onSyncTriggered={loadDatasets} />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("grid")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "grid"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Dataset Explorer &amp; Grid</span>
          {currentDataset && (
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
              {currentDataset.title}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ml_monitoring")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "ml_monitoring"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>MLOps &amp; Drift Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab("mcp_gateway")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "mcp_gateway"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>MCP Tool Gateway</span>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
            AI Agent Safe
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "grid" && (
        <div className="space-y-6">
          <DatasetSelector
            datasets={datasets}
            selectedSlug={selectedSlug}
            onSelectDataset={(slug) => setSelectedSlug(slug)}
            isLoading={isLoading}
          />

          {currentDataset ? (
            <NocoDBGridView
              dataset={currentDataset}
              canMutate={true}
              canExport={true}
              onRowSelect={(row) => setSelectedRow(row)}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
              Select a dataset from the list above to view rows.
            </div>
          )}
        </div>
      )}

      {activeTab === "ml_monitoring" && <MLMonitoringView />}

      {activeTab === "mcp_gateway" && <MCPToolStatusCard />}

      {/* Row Inspector Drawer */}
      {selectedRow && (
        <DataQualityDrawer
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onUpdateStatus={() => {
            setSelectedRow(null);
            loadDatasets();
          }}
        />
      )}
    </div>
  );
}
