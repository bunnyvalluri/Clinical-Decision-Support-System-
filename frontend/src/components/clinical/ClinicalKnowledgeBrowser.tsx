"use client";

import * as React from "react";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Layers,
  History,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";

export interface GuidelineItem {
  id: string;
  document_id: string;
  title: string;
  document_type: string;
  organization: string;
  jurisdiction: string;
  specialty: string;
  summary: string;
  content: string;
  status: string;
  current_version: string;
  is_active: boolean;
  effective_date: string | null;
  review_date: string | null;
  is_stale: boolean;
  provenance: {
    source?: string;
    verification_status?: string;
    publisher?: string;
    document_doi?: string;
    retrieved_date?: string;
  };
  evidence_source_details?: {
    name: string;
    organization: string;
    source_url?: string;
    trust_level: string;
    verification_status: string;
  } | null;
}

export interface ClinicalKnowledgeBrowserProps {
  onSelectGuideline?: (guideline: GuidelineItem) => void;
  selectedId?: string;
}

export function ClinicalKnowledgeBrowser({ onSelectGuideline, selectedId }: ClinicalKnowledgeBrowserProps) {
  const [guidelines, setGuidelines] = React.useState<GuidelineItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<string>("ALL");
  const [expandedDocId, setExpandedDocId] = React.useState<string | null>(null);
  const [activeVersionHistory, setActiveVersionHistory] = React.useState<{ docId: string; versions: any[] } | null>(null);

  const fetchGuidelines = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/clinical-knowledge/", {
        params: {
          specialty: selectedSpecialty !== "ALL" ? selectedSpecialty : undefined,
          search: searchQuery.trim() || undefined,
        },
      });
      const data = res.data?.results || res.data || [];
      setGuidelines(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load clinical guidelines:", err);
      setError(err?.response?.data?.detail || "Failed to load clinical guidelines from server.");
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialty, searchQuery]);

  React.useEffect(() => {
    fetchGuidelines();
  }, [fetchGuidelines]);

  const viewVersionHistory = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiClient.get(`/api/clinical-knowledge/${docId}/versions/`);
      setActiveVersionHistory({ docId, versions: res.data || [] });
    } catch {
      setActiveVersionHistory({ docId, versions: [] });
    }
  };

  const specialties = ["ALL", "CARDIOLOGY", "CRITICAL_CARE", "ACUTE_MEDICINE", "ENDOCRINOLOGY", "GENERAL_MEDICINE"];

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg font-semibold text-slate-900">
                Clinical Knowledge & Approved Guidelines
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Authoritative, versioned clinical protocols with verified provenance.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit border-indigo-200 bg-indigo-50 text-indigo-700 text-xs">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Approved Clinical Knowledge
          </Badge>
        </div>

        {/* Search & Specialty Filters */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search guidelines by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((sp) => (
              <Button
                key={sp}
                variant={selectedSpecialty === sp ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSpecialty(sp)}
                className={`h-8 text-xs font-medium ${
                  selectedSpecialty === sp
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {sp === "ALL" ? "All Specialties" : sp.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs font-medium">Loading approved clinical guidelines...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-slate-900">Unable to load clinical knowledge</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchGuidelines}>
              Retry Connection
            </Button>
          </div>
        ) : guidelines.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No guidelines found</p>
            <p className="text-xs text-slate-400 mt-1">
              No approved clinical knowledge matches the selected criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {guidelines.map((doc) => {
              const isExpanded = expandedDocId === doc.id;
              const isSelected = selectedId === doc.id;
              const verStatus =
                doc.provenance?.verification_status ||
                doc.evidence_source_details?.verification_status ||
                "SOURCE NOT VERIFIED";
              const isVerified = verStatus === "VERIFIED";

              return (
                <div
                  key={doc.id}
                  className={`transition-colors ${
                    isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      setExpandedDocId(isExpanded ? null : doc.id);
                      if (onSelectGuideline) onSelectGuideline(doc);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-600">
                            [{doc.document_id}]
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                            {doc.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 font-mono text-[10px]"
                          >
                            v{doc.current_version}
                          </Badge>
                          {doc.is_stale && (
                            <Badge
                              variant="outline"
                              className="border-amber-300 bg-amber-50 text-amber-800 text-[10px]"
                            >
                              <Clock className="mr-1 h-3 w-3 text-amber-600" />
                              REVIEW_REQUIRED
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isVerified
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700 font-bold"
                            }`}
                          >
                            {verStatus}
                          </Badge>
                        </div>
                        {doc.summary && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">{doc.summary}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>Org: <strong className="text-slate-600">{doc.organization}</strong></span>
                          <span>Specialty: <strong className="text-slate-600">{doc.specialty}</strong></span>
                          {doc.effective_date && (
                            <span>Effective: <strong className="text-slate-600">{doc.effective_date}</strong></span>
                          )}
                          {doc.review_date && (
                            <span>Review Due: <strong className="text-slate-600">{doc.review_date}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={(e) => viewVersionHistory(doc.document_id, e)}
                          title="View Version History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-slate-100 pt-3 text-xs space-y-3">
                        <div className="rounded bg-slate-50 p-3 border border-slate-200 text-slate-700 whitespace-pre-line font-sans leading-relaxed">
                          <p className="font-semibold text-slate-800 mb-1">Guideline Recommendations & Protocols:</p>
                          {doc.content}
                        </div>

                        {/* Provenance Box */}
                        <div className="rounded border border-indigo-100 bg-indigo-50/50 p-3">
                          <div className="flex items-center gap-1.5 font-semibold text-indigo-900 mb-1.5">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            Provenance & Evidence Verification
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                            <div>
                              <span className="text-slate-400">Source:</span>{" "}
                              <strong>{doc.provenance?.source || doc.evidence_source_details?.name || "SOURCE NOT VERIFIED"}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Publisher:</span>{" "}
                              <strong>{doc.provenance?.publisher || doc.evidence_source_details?.organization || "--"}</strong>
                            </div>
                            {doc.provenance?.document_doi && (
                              <div>
                                <span className="text-slate-400">DOI / URL:</span>{" "}
                                <a
                                  href={`https://doi.org/${doc.provenance.document_doi}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline font-mono inline-flex items-center gap-1"
                                >
                                  {doc.provenance.document_doi}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-400">Verification Status:</span>{" "}
                              <span className={isVerified ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                                {verStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Version History Modal */}
        {activeVersionHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  Version History: {activeVersionHistory.docId}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setActiveVersionHistory(null)}
                >
                  ✕
                </Button>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                {activeVersionHistory.versions.length === 0 ? (
                  <p className="text-slate-400 italic p-4 text-center">No revision history found.</p>
                ) : (
                  activeVersionHistory.versions.map((ver: any) => (
                    <div key={ver.id} className="rounded border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-700">
                        <span>v{ver.version}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {ver.status}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mt-1">
                        <strong>Change:</strong> {ver.change_reason || "Standard revision"}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                        <span>Reviewer: {ver.reviewer_name || "System"}</span>
                        <span>Date: {ver.effective_date || ver.created_at?.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
