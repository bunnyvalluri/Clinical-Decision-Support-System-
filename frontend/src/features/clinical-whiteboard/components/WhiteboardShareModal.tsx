"use client";

import React, { useState } from "react";
import { X, Share2, Copy, Check, ShieldCheck, Clock } from "lucide-react";
import { whiteboardApi } from "../services/whiteboardApi";

interface WhiteboardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiteboardId: string;
  whiteboardTitle: string;
}

export default function WhiteboardShareModal({
  isOpen,
  onClose,
  whiteboardId,
  whiteboardTitle,
}: WhiteboardShareModalProps) {
  const [targetRole, setTargetRole] = useState("DOCTOR");
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [allowEdit, setAllowEdit] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const share = await whiteboardApi.createShare(whiteboardId, {
        target_role: targetRole,
        expires_in_hours: expiresInHours,
        allow_edit: allowEdit,
      });
      setGeneratedToken(share.share_token);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = generatedToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/whiteboard/${generatedToken}`
    : "";

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-sky-600" />
            <h2 className="text-sm font-semibold text-slate-900">Controlled Whiteboard Sharing</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!generatedToken ? (
            <form onSubmit={handleCreateShare} className="space-y-4">
              <p className="text-xs text-slate-500">
                Generate a time-limited, role-scoped cryptographic share link for <strong>{whiteboardTitle}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Healthcare Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="DOCTOR">Physicians / Clinicians Only</option>
                  <option value="NURSE">Nurses & Care Coordinators</option>
                  <option value="MEDICAL_INFORMATICIST">Medical Informaticists</option>
                  <option value="ALL">Any Authorized Clinical Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expiration Window
                </label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value={12}>12 Hours (Single Shift)</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={48}>48 Hours (Standard)</option>
                  <option value={168}>7 Days (Extended Multidisciplinary Team)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allowEdit"
                  checked={allowEdit}
                  onChange={(e) => setAllowEdit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="allowEdit" className="text-xs text-slate-700 select-none">
                  Allow collaborative editing (defaults to read-only view)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? "Generating Link..." : "Generate Secure Link"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Secure Share Token Active</p>
                  <p className="mt-0.5 text-emerald-800">
                    Restricted to {targetRole} roles. Link will expire automatically in {expiresInHours} hours.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shareable Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
