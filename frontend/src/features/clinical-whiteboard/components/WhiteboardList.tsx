"use client";

import React, { useState } from "react";
import { Search, Plus, Filter, LayoutGrid, FileText } from "lucide-react";
import { ClinicalWhiteboard, WhiteboardType } from "../types/whiteboard";
import WhiteboardCard from "./WhiteboardCard";

interface WhiteboardListProps {
  whiteboards: ClinicalWhiteboard[];
  basePath: string;
  role: string;
  onCreateNew?: () => void;
}

export default function WhiteboardList({
  whiteboards,
  basePath,
  role,
  onCreateNew,
}: WhiteboardListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const filtered = whiteboards.filter((wb) => {
    const matchesSearch =
      wb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wb.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wb.patient_mrn && wb.patient_mrn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "ALL" || wb.type === selectedType;
    const matchesStatus = selectedStatus === "ALL" || wb.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top action and filter bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clinical whiteboards, MRN, protocols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none shadow-sm"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Board Types</option>
            <option value="CARE_PLAN">Care Plan</option>
            <option value="CLINICAL_WORKFLOW">Clinical Workflow</option>
            <option value="TRIAGE_WORKFLOW">Triage Workflow</option>
            <option value="DECISION_TREE">Decision Tree</option>
            <option value="PATIENT_JOURNEY">Patient Journey</option>
            <option value="ML_WORKFLOW">ML Workflow</option>
            <option value="AI_WORKFLOW">AI Workflow</option>
            <option value="SYSTEM_ARCHITECTURE">System Architecture</option>
            <option value="INCIDENT_RESPONSE">Incident Response</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Whiteboard</span>
          </button>
        )}
      </div>

      {/* Grid of cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((wb) => (
            <WhiteboardCard key={wb.id} whiteboard={wb} basePath={basePath} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">No Clinical Whiteboards Found</h4>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {searchTerm
              ? "No diagrams matched your search query. Try adjusting filters."
              : "No visual clinical pathways or architectural diagrams created yet."}
          </p>
          {onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Whiteboard</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
