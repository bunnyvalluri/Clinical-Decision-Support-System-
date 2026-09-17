"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface LoopApprovalDialogProps {
  isOpen: boolean;
  runId: string;
  patchSummary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LoopApprovalDialog: React.FC<LoopApprovalDialogProps> = ({
  isOpen,
  runId,
  patchSummary,
  onConfirm,
  onCancel,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white max-w-md w-full rounded-xl border border-slate-200 shadow-xl p-6">
        <h2 className="text-lg font-bold text-slate-900">Engineering Gate: Human Sign-off</h2>
        <p className="text-sm text-slate-600 mt-2">
          Verify candidate changes before creating a draft PR:
        </p>
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 max-h-40 overflow-y-auto">
          {patchSummary || "Candidate patch generated in isolated worktree."}
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="gate_confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 h-4 w-4"
          />
          <label htmlFor="gate_confirm" className="text-xs text-slate-700 select-none">
            I confirm Maker/Checker verification passed and no clinical paths are touched.
          </label>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs bg-white">
            Reject
          </Button>
          <Button
            size="sm"
            disabled={!confirmed}
            onClick={onConfirm}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            Approve & Dispatch PR
          </Button>
        </div>
      </div>
    </div>
  );
};
