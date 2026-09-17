"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WhiteboardEditor from "@/features/clinical-whiteboard/components/WhiteboardEditor";
import { ClinicalWhiteboard } from "@/features/clinical-whiteboard/types/whiteboard";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";

export default function UserWhiteboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [whiteboard, setWhiteboard] = useState<ClinicalWhiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const data = await whiteboardApi.get(id);
        setWhiteboard(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to load patient care plan.");
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading Care Plan...</p>
        </div>
      </div>
    );
  }

  if (error || !whiteboard) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow-lg">
          <h2 className="text-base font-bold text-slate-900">Unable to Open Care Plan</h2>
          <p className="mt-1 text-xs text-slate-500">{error || "The care plan is either pending clinical review or not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <WhiteboardEditor
      initialWhiteboard={whiteboard}
      basePath="/user/whiteboards"
      userRole="PATIENT"
    />
  );
}
