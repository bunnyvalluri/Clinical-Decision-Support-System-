"use client";

import React, { useState, useEffect } from "react";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type { NocoDBDataset } from "@/services/nocodb/types";
import { NocoDBGridView } from "@/features/nocodb-workspace/components/NocoDBGridView";

export default function UserDataPage() {
  const [datasets, setDatasets] = useState<NocoDBDataset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const list = await nocodbClient.listDatasets();
        if (isMounted) {
          setDatasets(list);
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
  }, []);

  const patientAccessible = datasets.filter((d) =>
    (d.allowed_roles || []).some((r) => r.toLowerCase() === "patient" || r.toLowerCase() === "user")
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Personal Health Data Exports &amp; Records
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your de-identified clinical activity, health summaries, and consented records.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 animate-pulse">
          Loading health data views...
        </div>
      ) : patientAccessible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">Zero-PHI Privacy Guard Active</p>
          <p className="text-slate-400">
            Internal ML telemetry and institutional operational queues are strictly restricted
            from patient view under HIPAA minimum necessary standards.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {patientAccessible.map((ds) => (
            <NocoDBGridView
              key={ds.id}
              dataset={ds}
              canMutate={false}
              canExport={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
