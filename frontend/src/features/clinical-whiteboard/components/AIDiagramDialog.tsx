"use client";

import React, { useState } from "react";
import { X, Sparkles, BookOpen, AlertTriangle, ArrowRight } from "lucide-react";
import { AIDiagramResponse } from "../types/whiteboard";
import { whiteboardApi } from "../services/whiteboardApi";

interface AIDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whiteboardId: string;
  onApproveAndInsert: (elements: any[]) => void;
}

export default function AIDiagramDialog({
  isOpen,
  onClose,
  whiteboardId,
  onApproveAndInsert,
}: AIDiagramDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<"SEPSIS" | "CARDIAC" | "TRIAGE" | "GENERAL">("GENERAL");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AIDiagramResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await whiteboardApi.generateAIDiagram(whiteboardId, prompt, category);
      setPreviewData(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate AI diagram. Please check input.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (previewData && previewData.elements) {
      onApproveAndInsert(previewData.elements);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI Clinical Pathway Generator</h2>
              <p className="text-xs text-slate-500">Prompt 31 AI Gateway & Guideline Synthesis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!previewData ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="rounded-lg bg-sky-50 border border-sky-100 p-3 text-xs text-sky-900">
                <p className="font-semibold">Prompt 32 Non-Authoritative Governance Invariant:</p>
                <p className="mt-0.5 text-sky-800">
                  AI-generated diagrams are draft visualization suggestions grounded in medical guidelines.
                  They are non-binding and require independent clinician sign-off before patient care execution.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Domain / Guideline Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["GENERAL", "SEPSIS", "CARDIAC", "TRIAGE"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                        category === cat
                          ? "border-sky-600 bg-sky-50 text-sky-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Pathway or Workflow Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Generate an emergency triage flowchart for suspected sepsis evaluating qSOFA >= 2, blood lactate measurement, and 1-hour antibiotic administration."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Synthesizing Schema...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Structured Diagram</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-semibold">{previewData.safety_disclaimer}</p>
                  <p className="mt-0.5 text-amber-800">
                    Generated {previewData.elements.length} Excalidraw elements. Review the clinical citations below before inserting into your active canvas.
                  </p>
                </div>
              </div>

              {previewData.guideline_citations && previewData.guideline_citations.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <BookOpen className="h-4 w-4 text-sky-600" />
                    <span>Grounded Clinical Guidelines (RAG):</span>
                  </div>
                  {previewData.guideline_citations.map((cite, i) => (
                    <div key={i} className="text-xs text-slate-600 border-l-2 border-sky-400 pl-2">
                      <p className="font-medium text-slate-800">{cite.source}</p>
                      <p className="text-[11px] text-slate-500">{cite.section}: {cite.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Generated Structure Preview ({previewData.diagram_title})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewData.elements.map((el, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-mono"
                    >
                      {el.type} {el.text ? `("${el.text.slice(0, 20)}...")` : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  ← Back to prompt
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleInsert}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <span>Approve & Insert into Canvas</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
