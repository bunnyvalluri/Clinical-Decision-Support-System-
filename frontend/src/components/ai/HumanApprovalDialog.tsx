"use client";

import * as React from "react";
import { ShieldCheck, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HumanApprovalDialogProps {
  isOpen: boolean;
  actionTitle: string;
  actionDetails: string;
  onApprove: (rationale: string) => void;
  onReject: (rationale: string) => void;
  onClose: () => void;
}

export const HumanApprovalDialog: React.FC<HumanApprovalDialogProps> = ({
  isOpen,
  actionTitle,
  actionDetails,
  onApprove,
  onReject,
  onClose,
}) => {
  const [rationale, setRationale] = React.useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center gap-2.5 text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <ShieldCheck className="h-5 w-5 text-amber-700" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Physician Sign-Off Required
            </h3>
            <p className="text-xs text-slate-500">
              Healthcare Invariant: AI cannot execute Level-3 clinical actions autonomously.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700">
          <div className="font-semibold text-slate-900 mb-1">{actionTitle}</div>
          <div className="leading-relaxed">{actionDetails}</div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Clinical Rationale / Notes:
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Enter clinical justification for decision..."
            className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            rows={3}
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(rationale)}
            className="text-xs border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reject Action
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(rationale)}
            className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Approve & Sign
          </Button>
        </div>
      </div>
    </div>
  );
};
