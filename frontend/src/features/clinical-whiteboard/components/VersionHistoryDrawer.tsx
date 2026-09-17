"use client";

import React, { useState } from "react";
import { X, History, RotateCcw, ShieldCheck, Clock } from "lucide-react";
import { WhiteboardDocument } from "../types/whiteboard";

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: WhiteboardDocument[];
  currentVersion: number;
  onRestore: (versionNumber: number, reason: string) => Promise<void>;
  isLocked?: boolean;
}

export default function VersionHistoryDrawer({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onRestore,
  isLocked = false,
}: VersionHistoryDrawerProps) {
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [restoreReason, setRestoreReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmRestore = async () => {
    if (restoringVersion === null) return;
    try {
      setLoading(true);
      await onRestore(restoringVersion, restoreReason);
      setRestoringVersion(null);
      setRestoreReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-sky-600" />
          <h2 className="text-sm font-semibold text-slate-900">Version History & Checkpoints</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close version history"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {versions.map((ver) => {
          const isCurrent = ver.version_number === currentVersion;

          return (
            <div
              key={ver.id}
              className={`rounded-lg border p-3 transition-all ${
                isCurrent
                  ? "border-sky-500 bg-sky-50/50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">v{ver.version_number}</span>
                  {isCurrent && (
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
                      Active
                    </span>
                  )}
                  {ver.is_checkpoint && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                      Checkpoint
                    </span>
                  )}
                </div>

                {!isCurrent && !isLocked && (
                  <button
                    type="button"
                    onClick={() => setRestoringVersion(ver.version_number)}
                    className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                )}
              </div>

              {ver.checkpoint_summary && (
                <p className="mt-1 text-xs text-slate-600">{ver.checkpoint_summary}</p>
              )}

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ver.created_at ? ver.created_at.slice(0, 19).replace("T", " ") : ""}
                </span>
                <span className="font-mono text-[10px]" title={`SHA-256: ${ver.content_hash}`}>
                  {ver.content_hash.slice(0, 8)}...
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restore Confirmation Modal Inside Drawer */}
      {restoringVersion !== null && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-800">
            Restore Version v{restoringVersion}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            This will create a new version checkpoint with this snapshot's contents and log a clinical audit record.
          </p>
          <input
            type="text"
            placeholder="Audit reason (e.g. Rollback to pre-incident triage tree)"
            aria-label="Audit reason"
            value={restoreReason}
            onChange={(e) => setRestoreReason(e.target.value)}
            className="mt-2 w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRestoringVersion(null)}
              className="rounded px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmRestore}
              className="rounded bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Restoring..." : "Confirm Restore"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
