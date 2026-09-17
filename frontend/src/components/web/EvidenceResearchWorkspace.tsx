"use client";

import * as React from "react";
import { BookOpen, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, HelpCircle, FileText, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { webIntelligenceService } from "@/services/webIntelligenceService";
import type { WebResearchSession, ResearchMode } from "@/types/webIntelligence";
import { SourceViewerModal } from "./SourceViewerModal";

interface EvidenceResearchWorkspaceProps {
  role?: string;
  defaultMode?: ResearchMode;
}

export function EvidenceResearchWorkspace({
  role = "DOCTOR",
  defaultMode = "MEDICAL_EVIDENCE",
}: EvidenceResearchWorkspaceProps) {
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<ResearchMode>(defaultMode);
  const [activeSession, setActiveSession] = React.useState<WebResearchSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Modal preview
  const [modalData, setModalData] = React.useState<{ title: string; url: string; content: string } | null>(null);

  const handleCreateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const session = await webIntelligenceService.createResearch(query.trim(), mode);
      setActiveSession(session);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || err.message || "Failed to execute research session.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (reviewStatus: "ACCEPTED" | "REJECTED" | "REQUIRES_ADDITIONAL_EVIDENCE") => {
    if (!activeSession) return;
    setIsReviewing(true);

    try {
      const updated = await webIntelligenceService.reviewResearch(activeSession.id, reviewStatus, reviewNotes);
      setActiveSession(updated);
      setReviewNotes("");
    } catch (err: any) {
      alert("Failed to submit clinician review: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Evidence Research Input */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Evidence Synthesis & Literature Investigation
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Multi-source evidence discovery with explicit conflict detection and mandatory clinician review.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
              Mode: {mode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateResearch} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter clinical condition, guideline inquiry, or drug interaction question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 text-sm"
              />
              <Button type="submit" disabled={isLoading || !query.trim()} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Investigating
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" />
                    Synthesize
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Session Findings */}
      {activeSession && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 text-xs">
                      Session: {activeSession.id.slice(0, 8)}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(activeSession.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{activeSession.query}</h3>
                </div>

                {/* Review Status Badge */}
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    activeSession.clinician_review_status === "ACCEPTED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : activeSession.clinician_review_status === "REJECTED"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {activeSession.clinician_review_status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Synthesized Findings</h4>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeSession.findings || "No findings recorded."}
                </div>
              </div>

              {/* Uncertainty and Limitations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Uncertainty & Model Inference
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {activeSession.uncertainty_notes || "None flagged."}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Evidence Limitations
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeSession.limitations || "Standard clinical literature limitations apply."}
                  </p>
                </div>
              </div>

              {/* Citations & Sources */}
              {activeSession.sources && activeSession.sources.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Grounding Sources & Citations ({activeSession.sources.length})
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {activeSession.sources.map((src) => (
                      <div key={src.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">[{src.citation_number}]</span>
                          <span className="font-medium text-slate-800 line-clamp-1">{src.source_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setModalData({
                                title: src.source_title,
                                url: src.source_url,
                                content: `Source URL: ${src.source_url}\nCitations: [${src.citation_number}]`,
                              })
                            }
                            className="h-7 text-xs text-slate-600 hover:text-slate-900"
                          >
                            <FileText className="mr-1 h-3 w-3" /> View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinician Review & Sign-Off Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Human Attending Clinician Review
                  </h4>
                  {activeSession.reviewed_at && (
                    <span className="text-xs text-slate-400">
                      Reviewed on {new Date(activeSession.reviewed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Per CDSS Constitution Article 4, AI recommendations and external web literature require explicit clinician review prior to any clinical action.
                </p>

                <div className="space-y-2">
                  <Input
                    placeholder="Enter clinical notes or reasons for acceptance / rejection..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="bg-white border-slate-200 text-xs text-slate-900"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleReview("ACCEPTED")}
                      disabled={isReviewing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Accept Evidence
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview("REQUIRES_ADDITIONAL_EVIDENCE")}
                      disabled={isReviewing}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-8"
                    >
                      <HelpCircle className="mr-1 h-3.5 w-3.5" /> Needs More Data
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview("REJECTED")}
                      disabled={isReviewing}
                      className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8"
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal preview */}
      {modalData && (
        <SourceViewerModal
          isOpen={!!modalData}
          onClose={() => setModalData(null)}
          title={modalData.title}
          url={modalData.url}
          content={modalData.content}
        />
      )}
    </div>
  );
}
