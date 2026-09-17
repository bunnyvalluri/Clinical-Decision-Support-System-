"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  HeartPulse,
  Layout,
  Shield,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type SearchHit } from "@/services/search/searchTypes";

interface SearchResultsProps {
  hits: SearchHit[];
  isLoading: boolean;
  searchMode?: "meilisearch" | "degraded_postgres" | "unavailable";
  query?: string;
  onSelectHit?: (hit: SearchHit) => void;
}

export function SearchResults({
  hits,
  isLoading,
  searchMode = "meilisearch",
  query = "",
  onSelectHit,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-6">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-800">
          {query ? `No matching records found for "${query}"` : "No search results"}
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Try adjusting your query, verifying patient MRN accuracy, or checking active filter criteria.
        </p>
      </div>
    );
  }

  const getEntityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "patient":
        return <Users className="h-4 w-4 text-sky-600" />;
      case "prediction":
        return <HeartPulse className="h-4 w-4 text-emerald-600" />;
      case "clinical_record":
        return <Activity className="h-4 w-4 text-purple-600" />;
      case "model":
        return <Cpu className="h-4 w-4 text-indigo-600" />;
      case "whiteboard":
        return <Layout className="h-4 w-4 text-amber-600" />;
      case "triage_record":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  const getRiskBadge = (level?: string) => {
    if (!level) return null;
    switch (level.toUpperCase()) {
      case "CRITICAL":
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            {level} RISK
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            MEDIUM RISK
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            LOW RISK
          </span>
        );
    }
  };

  const getEntityHref = (hit: SearchHit): string => {
    const type = hit.entity_type?.toLowerCase();
    if (type === "patient") {
      return hit.patient_id ? `/patients` : `/patients`;
    }
    if (type === "prediction") {
      return `/predictions`;
    }
    if (type === "clinical_record") {
      return `/clinical`;
    }
    if (type === "model") {
      return `/admin/models`;
    }
    if (type === "whiteboard") {
      return `/whiteboards`;
    }
    return `/dashboard`;
  };

  return (
    <div className="space-y-3">
      {searchMode === "degraded_postgres" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Search operating in degraded mode via Neon PostgreSQL fallback.</span>
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase">Fallback Active</span>
        </div>
      )}

      {hits.map((hit) => {
        const title = hit.display_name || hit.title || hit.name || `Record #${hit.source_id || hit.document_id}`;
        const subtitle =
          hit.subtitle ||
          (hit.mrn ? `MRN: ${hit.mrn}` : "") +
            (hit.model_name ? ` • Model: ${hit.model_name}` : "") +
            (hit.encounter_type ? ` • ${hit.encounter_type}` : "");

        const href = getEntityHref(hit);

        return (
          <div
            key={hit.document_id}
            onClick={() => onSelectHit?.(hit)}
            className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 group-hover:border-emerald-200 group-hover:bg-emerald-50/50 transition-colors">
                {getEntityIcon(hit.entity_type)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {title}
                  </h4>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600 uppercase border border-slate-200">
                    {hit.entity_type?.replace("_", " ")}
                  </span>
                  {getRiskBadge(hit.risk_level || hit.prediction_result)}
                </div>

                {subtitle && (
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    {subtitle}
                  </p>
                )}

                {/* Secure highlight snippet: escaped plain text */}
                {hit.highlight && (
                  <div
                    className="mt-1.5 text-xs text-slate-600 line-clamp-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono text-[11px]"
                    dangerouslySetInnerHTML={{ __html: hit.highlight }}
                  />
                )}
              </div>
            </div>

            <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              {hit.updated_at && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(hit.updated_at * 1000).toLocaleDateString()}</span>
                </div>
              )}
              <Link
                href={href}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
              >
                <span>Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
