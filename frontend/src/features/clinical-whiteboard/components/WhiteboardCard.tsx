"use client";

import React from "react";
import Link from "next/link";
import { Lock, Clock, User, Shield, FileText } from "lucide-react";
import { ClinicalWhiteboard } from "../types/whiteboard";

interface WhiteboardCardProps {
  whiteboard: ClinicalWhiteboard;
  basePath: string; // e.g. "/doctor/whiteboards", "/nurse/whiteboards"
}

export default function WhiteboardCard({ whiteboard, basePath }: WhiteboardCardProps) {
  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "PHI":
      case "RESTRICTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "SENSITIVE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PUBLIC":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-sky-50 text-sky-700 border-sky-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_REVIEW":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ARCHIVED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <Link
      href={`${basePath}/${whiteboard.id}`}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-sky-400 hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${getClassificationBadge(
                whiteboard.classification
              )}`}
            >
              {whiteboard.classification}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(
                whiteboard.status
              )}`}
            >
              {whiteboard.status.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {whiteboard.is_locked && (
              <span title="Locked by Clinical Approval" className="text-amber-600">
                <Lock className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600">
              v{whiteboard.current_version}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
          {whiteboard.title}
        </h3>

        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
          {whiteboard.description || "No description provided."}
        </p>

        {whiteboard.patient_mrn && (
          <div className="mt-3 flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
            <User className="h-3 w-3 text-slate-400" />
            <span>Patient: {whiteboard.patient_name || whiteboard.patient_mrn}</span>
            <span className="text-slate-400">({whiteboard.patient_mrn})</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {whiteboard.type.replace("_", " ")}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(whiteboard.updated_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
