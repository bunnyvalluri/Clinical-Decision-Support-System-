"use client";

import * as React from "react";
import { X, ExternalLink, ShieldCheck, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SourceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  content: string;
  contentHash?: string;
  trustTier?: string;
  retrievedAt?: string;
}

export function SourceViewerModal({
  isOpen,
  onClose,
  title,
  url,
  content,
  contentHash,
  trustTier = "TIER_1",
  retrievedAt,
}: SourceViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                {trustTier}
              </Badge>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {retrievedAt ? new Date(retrievedAt).toLocaleString() : "Recently Retrieved"}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 line-clamp-1">{title || "Retrieved Source"}</h2>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              {url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Provenance Banner */}
        {contentHash && (
          <div className="flex items-center gap-2 bg-slate-50 px-6 py-2 border-b border-slate-200 text-xs text-slate-600">
            <Hash className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Content SHA-256:</span>
            <code className="font-mono text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {contentHash}
            </code>
          </div>
        )}

        {/* Modal Content - Sanitized Markdown / Plaintext */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 font-sans text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {content || "No text content available for this source."}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <p className="text-xs text-slate-500">
            Retrieved via Firecrawl Web Intelligence. Passive clinical evidence only.
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
