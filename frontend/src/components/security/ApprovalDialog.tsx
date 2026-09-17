"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface ApprovalDialogProps {
  isOpen: boolean;
  targetName: string;
  scopeSummary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  targetName,
  scopeSummary,
  onConfirm,
  onCancel,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white max-w-md w-full rounded-xl border border-slate-200 shadow-xl p-6">
        <h2 className="text-lg font-bold text-slate-900">Dual-Custody Security Authorization</h2>
        <p className="text-sm text-slate-600 mt-2">
          You are authorizing a policy-governed security assessment against:
        </p>
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div><span className="font-semibold text-slate-700">Target:</span> {targetName}</div>
          <div><span className="font-semibold text-slate-700">Permitted Scope:</span> {scopeSummary}</div>
          <div className="text-amber-700 font-medium">Production testing is strictly forbidden.</div>
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="dual_custody_agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <label htmlFor="dual_custody_agree" className="text-xs text-slate-700 select-none">
            I verify that this target is in-scope and approved for controlled assessment.
          </label>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs bg-white text-slate-700">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!agreed}
            onClick={onConfirm}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            Authorize & Dispatch
          </Button>
        </div>
      </div>
    </div>
  );
};
