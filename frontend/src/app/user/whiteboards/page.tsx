"use client";

import React, { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";
import WhiteboardList from "@/features/clinical-whiteboard/components/WhiteboardList";
import { ClinicalWhiteboard } from "@/features/clinical-whiteboard/types/whiteboard";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";

export default function UserWhiteboardsPage() {
  const [whiteboards, setWhiteboards] = useState<ClinicalWhiteboard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWhiteboards = async () => {
    try {
      setLoading(true);
      const data = await whiteboardApi.list();
      setWhiteboards(data);
    } catch (e) {
      console.error("Failed to fetch patient care plans", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhiteboards();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Care Plans & Health Journey</h1>
              <p className="text-xs text-slate-500">
                Visual care trajectories, recovery milestones, and educational pathways approved by your physician
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <p className="text-xs text-slate-500">Loading your care diagrams...</p>
          </div>
        </div>
      ) : (
        <WhiteboardList
          whiteboards={whiteboards}
          basePath="/user/whiteboards"
          role="PATIENT"
        />
      )}
    </div>
  );
}
