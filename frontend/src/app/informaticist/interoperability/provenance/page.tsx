"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  CheckCircle2,
  Code,
  Copy,
  Eye,
  Fingerprint,
  GitBranch,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { InteroperabilityService } from "@/services/interoperability/InteroperabilityService";
import type { FHIRProvenanceRecordItem } from "@/services/interoperability/InteroperabilityTypes";

export default function InformaticistProvenancePage() {
  const [provenance, setProvenance] = React.useState<FHIRProvenanceRecordItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRecord, setSelectedRecord] = React.useState<FHIRProvenanceRecordItem | null>(null);
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await InteroperabilityService.fetchProvenance();
      setProvenance(res.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load provenance records.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

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
            <span className="text-xs font-semibold text-slate-600">Provenance & Lineage</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Cryptographic Provenance & Lineage
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Tamper-evident SHA-256 payload checksums, originating healthcare sources, and full clinical lineage.
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

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && provenance.length === 0 && (
        <div className="p-12 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <Fingerprint className="h-10 w-10 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No provenance records recorded yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cryptographic SHA-256 provenance hashes are generated automatically upon every inbound or outbound FHIR exchange.
          </p>
        </div>
      )}

      {/* Provenance Table */}
      {provenance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Entity Type</th>
                  <th className="py-3 px-4 font-semibold">Direction</th>
                  <th className="py-3 px-4 font-semibold">Originating Source</th>
                  <th className="py-3 px-4 font-semibold">External Resource ID</th>
                  <th className="py-3 px-4 font-semibold">SHA-256 Payload Checksum</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {provenance.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.fhir_resource_type} ({p.entity_type})
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          p.direction === "INBOUND_IMPORT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {p.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.external_system_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.external_resource_id || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-xs">{p.payload_sha256}</span>
                        <button
                          onClick={() => copyToClipboard(p.payload_sha256)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy SHA-256 Hash"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copiedHash === p.payload_sha256 && (
                          <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.recorded_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Payload Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Raw FHIR R4 Payload Snapshot
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Source: <strong className="text-slate-800">{selectedRecord.external_system_name}</strong></span>
                <span>SHA-256: <strong className="text-slate-800 font-mono text-[10px]">{selectedRecord.payload_sha256.substring(0, 16)}...</strong></span>
              </div>
              <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96">
                <pre>{JSON.stringify(selectedRecord.raw_payload_snapshot, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
