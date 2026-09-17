"use client";

import React, { useState, useEffect } from "react";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset } from "@/services/nocodb/types";
import { DatasetSelector } from "@/features/nocodb-workspace/components/DatasetSelector";
import { NocoDBGridView } from "@/features/nocodb-workspace/components/NocoDBGridView";
import { NocoDBHealthWidget } from "@/features/nocodb-workspace/components/NocoDBHealthWidget";

export default function NurseDataWorkspacePage() {
  const [datasets, setDatasets] = useState<NocoDBDataset[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("clinical_workflow_metrics");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const list = await nocodbClient.listDatasets();
        if (isMounted) {
          setDatasets(list);
          if (list.length > 0 && !selectedSlug) {
            setSelectedSlug(list[0].slug);
          }
        }
      } catch (e) {
        // quiet fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedSlug]);

  const currentDataset = datasets.find((d) => d.slug === selectedSlug);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nursing Workflow &amp; Operational Data
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Nurse Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time department triage throughput, intake queues, and sensor data quality monitoring.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <NocoDBHealthWidget canSync={false} />
        </div>
      </div>

      <DatasetSelector
        datasets={datasets}
        selectedSlug={selectedSlug}
        onSelectDataset={(s) => setSelectedSlug(s)}
        isLoading={isLoading}
      />

      {currentDataset ? (
        <NocoDBGridView
          dataset={currentDataset}
          canMutate={false}
          canExport={false}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
          Select an operational dataset above to inspect records.
        </div>
      )}
    </div>
  );
}
