"use client";

import React, { useState } from "react";
import { Search, Plus, Filter, LayoutGrid, FileText, ChevronDown } from "lucide-react";
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
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Top action and filter bar - Fully Mobile Responsive */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full">
        {/* Search & Filters Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search care plans, protocols, milestones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition-colors"
            />
          </div>

          {/* Filters Sub-row (2-col grid on mobile, inline-flex on sm+) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
            <div className="relative min-w-0">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
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
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative min-w-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors shrink-0 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Whiteboard</span>
          </button>
        )}
      </div>

      {/* Grid of cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filtered.map((wb) => (
            <WhiteboardCard key={wb.id} whiteboard={wb} basePath={basePath} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Care Plans Found</h4>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {searchTerm
              ? "No diagrams matched your search query. Try resetting filters."
              : "No visual clinical care trajectories or rehabilitation plans found."}
          </p>
          {onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700 shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Plan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
