"use client";

import React, { useEffect, useState } from "react";
import { PenTool, Plus } from "lucide-react";
import WhiteboardList from "@/features/clinical-whiteboard/components/WhiteboardList";
import { ClinicalWhiteboard } from "@/features/clinical-whiteboard/types/whiteboard";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";

export default function NurseWhiteboardsPage() {
  const [whiteboards, setWhiteboards] = useState<ClinicalWhiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("TRIAGE_WORKFLOW");
  const [creating, setCreating] = useState(false);

  const fetchWhiteboards = async () => {
    try {
      setLoading(true);
      const data = await whiteboardApi.list();
      setWhiteboards(data);
    } catch (e) {
      console.error("Failed to fetch nurse whiteboards", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhiteboards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const created = await whiteboardApi.create({
        title: newTitle,
        type: newType,
        classification: "INTERNAL",
      });
      setShowCreateModal(false);
      setNewTitle("");
      setWhiteboards((prev) => [created, ...prev]);
    } catch (e) {
      console.error("Failed to create whiteboard", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Triage Protocols & Care Pathways</h1>
              <p className="text-xs text-slate-500">
                Bedside care coordination, shift handovers, and emergency triage pathways
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Triage Pathway</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
            <p className="text-xs text-slate-500">Loading triage pathways...</p>
          </div>
        </div>
      ) : (
        <WhiteboardList
          whiteboards={whiteboards}
          basePath="/nurse/whiteboards"
          role="NURSE"
          onCreateNew={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Create Triage or Care Pathway</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathway Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rapid Response Escalation — Ward 4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="TRIAGE_WORKFLOW">Triage Workflow</option>
                  <option value="CARE_PLAN">Care Plan</option>
                  <option value="CLINICAL_WORKFLOW">Clinical Workflow</option>
                  <option value="TEAM_COLLABORATION">Team Handover</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Pathway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
