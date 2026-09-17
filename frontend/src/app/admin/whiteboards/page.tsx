"use client";

import React, { useEffect, useState } from "react";
import { Server, Plus } from "lucide-react";
import WhiteboardList from "@/features/clinical-whiteboard/components/WhiteboardList";
import { ClinicalWhiteboard } from "@/features/clinical-whiteboard/types/whiteboard";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";

export default function AdminWhiteboardsPage() {
  const [whiteboards, setWhiteboards] = useState<ClinicalWhiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("SYSTEM_ARCHITECTURE");
  const [creating, setCreating] = useState(false);

  const fetchWhiteboards = async () => {
    try {
      setLoading(true);
      const data = await whiteboardApi.list();
      setWhiteboards(data);
    } catch (e) {
      console.error("Failed to fetch admin whiteboards", e);
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">System Architecture & Runbook Canvas</h1>
              <p className="text-xs text-slate-500">
                Microservices topology, database failover topology, incident response runbooks, and network security perimeters
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Architecture Board</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            <p className="text-xs text-slate-500">Loading system architecture boards...</p>
          </div>
        </div>
      ) : (
        <WhiteboardList
          whiteboards={whiteboards}
          basePath="/admin/whiteboards"
          role="IT_ADMIN"
          onCreateNew={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Create System Architecture Diagram</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Architecture Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neon PostgreSQL HA & Disaster Recovery Runbook"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                >
                  <option value="SYSTEM_ARCHITECTURE">System Architecture</option>
                  <option value="INCIDENT_RESPONSE">Incident Response Runbook</option>
                  <option value="DATA_LINEAGE">Data Lineage & Infrastructure</option>
                  <option value="GENERAL">General Operational Plan</option>
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
                  className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Canvas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
