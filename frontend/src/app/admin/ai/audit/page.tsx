"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

interface InteractionAuditItem {
  id: string;
  clinician_name: string;
  correlation_id: string;
  operation_type: string;
  input_query: string;
  tools_invoked: string[];
  safety_status: string;
  guardrail_flags: string[];
  requires_human_review: boolean;
  human_decision?: string;
  human_rationale?: string;
  human_reviewed_at?: string;
  latency_ms: number;
  created_at: string;
}

export default function AdminAIAuditPage() {
  const [interactions, setInteractions] = React.useState<InteractionAuditItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchAuditRecords = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ count: number; results: InteractionAuditItem[] }>(
        "/ai/interactions/"
      );
      setInteractions(res.data?.results || []);
    } catch {
      // Keep empty array
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAuditRecords();
  }, [fetchAuditRecords]);

  const filteredInteractions = React.useMemo(() => {
    if (!searchTerm) return interactions;
    const lower = searchTerm.toLowerCase();
    return interactions.filter(
      (item) =>
        item.correlation_id.toLowerCase().includes(lower) ||
        item.clinician_name.toLowerCase().includes(lower) ||
        item.input_query.toLowerCase().includes(lower)
    );
  }, [interactions, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Link href="/admin/ai" className="hover:text-purple-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          AI Overview
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Audit Ledger</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="h-6 w-6 text-purple-600" />
            AI Interactions & Compliance Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Immutable 21 CFR Part 11 and HIPAA compliant audit log tracking clinician interactions, safety guardrails, and sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditRecords}
            disabled={isLoading}
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by correlation ID or clinician…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading audit ledger from PostgreSQL…</div>
      ) : filteredInteractions.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No AI interaction records found in PostgreSQL audit ledger.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Correlation ID / Date</th>
                  <th className="py-3 px-4">Clinician</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Safety Status</th>
                  <th className="py-3 px-4">Review Mandate</th>
                  <th className="py-3 px-4">Human Decision</th>
                  <th className="py-3 px-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInteractions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900">
                      <div>{item.correlation_id.slice(0, 12)}…</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {new Date(item.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.clinician_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{item.operation_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.safety_status === "PASSED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : item.safety_status === "FLAGGED"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {item.safety_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.requires_human_review ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="h-3 w-3" />
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-slate-400">Routine</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[11px]">
                      {item.human_decision ? (
                        <span
                          className={
                            item.human_decision === "APPROVED"
                              ? "text-emerald-700"
                              : item.human_decision === "REJECTED"
                              ? "text-rose-700"
                              : "text-blue-700"
                          }
                        >
                          {item.human_decision}
                        </span>
                      ) : item.requires_human_review ? (
                        <span className="text-amber-600 font-medium">Pending Clinician Review</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {item.latency_ms.toFixed(0)} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
