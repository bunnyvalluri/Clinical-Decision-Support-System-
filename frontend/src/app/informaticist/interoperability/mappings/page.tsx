"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  BookOpen,
  CheckCircle2,
  Code,
  FileCode,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";
import { InteroperabilityService } from "@/services/interoperability/InteroperabilityService";
import type {
  FHIRMappingVersionItem,
  TerminologyMappingItem,
} from "@/services/interoperability/InteroperabilityTypes";

export default function InformaticistMappingsPage() {
  const [mappings, setMappings] = React.useState<FHIRMappingVersionItem[]>([]);
  const [terminology, setTerminology] = React.useState<TerminologyMappingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"terminology" | "versions">("terminology");
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mRes, tRes] = await Promise.all([
        InteroperabilityService.fetchMappings(),
        InteroperabilityService.fetchTerminology(),
      ]);
      setMappings(mRes.results || []);
      setTerminology(tRes.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load clinical mappings.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTerminology = terminology.filter(
    (t) =>
      t.source_code.toLowerCase().includes(search.toLowerCase()) ||
      t.target_code.toLowerCase().includes(search.toLowerCase()) ||
      t.target_display.toLowerCase().includes(search.toLowerCase()) ||
      t.source_system.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/informaticist/interoperability" className="text-xs font-semibold text-amber-800 hover:underline">
              ← Interoperability Hub
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600">Mappings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Clinical Mappings & Terminology Standards
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Standard LOINC, SNOMED CT, and ICD-10 translation tables and versioned mapping schemas.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("terminology")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "terminology"
              ? "border-amber-600 text-amber-900 bg-white rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Standard Terminology Mappings ({terminology.length})
        </button>
        <button
          onClick={() => setActiveTab("versions")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "versions"
              ? "border-amber-600 text-amber-900 bg-white rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Resource Mapping Schemas ({mappings.length})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-800">{error}</p>
        </div>
      )}

      {/* Terminology Tab */}
      {activeTab === "terminology" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code (e.g. 8480-6), system, or display name..."
              className="text-xs bg-transparent w-full focus:outline-none text-slate-800"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Source System</th>
                    <th className="py-3 px-4 font-semibold">Source Code</th>
                    <th className="py-3 px-4 font-semibold">Target Standard</th>
                    <th className="py-3 px-4 font-semibold">Target Code</th>
                    <th className="py-3 px-4 font-semibold">Display / Description</th>
                    <th className="py-3 px-4 font-semibold">Internal Field</th>
                    <th className="py-3 px-4 font-semibold">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTerminology.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800 font-mono">
                        {t.source_system}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {t.source_code}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {t.target_system}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        {t.target_code}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {t.target_display}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {t.internal_field || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {t.is_verified ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unverified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Versions Tab */}
      {activeTab === "versions" && (
        <div className="grid grid-cols-1 gap-4">
          {mappings.map((m) => (
            <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{m.resource_type}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    v{m.version}
                  </span>
                  {m.is_active && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  Updated: {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>

              {m.change_summary && (
                <p className="text-xs text-slate-600">{m.change_summary}</p>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <pre className="text-[11px] text-slate-700 font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(m.mapping_rules, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
