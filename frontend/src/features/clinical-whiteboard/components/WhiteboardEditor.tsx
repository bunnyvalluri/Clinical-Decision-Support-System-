"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Clock,
  History,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Download,
  Lock,
  Users,
} from "lucide-react";

import {
  ClinicalWhiteboard,
  WhiteboardDocument,
  SaveStatus,
} from "../types/whiteboard";
import { whiteboardApi } from "../services/whiteboardApi";
import WhiteboardToolbar from "./WhiteboardToolbar";
import VersionHistoryDrawer from "./VersionHistoryDrawer";
import ClinicalReviewModal from "./ClinicalReviewModal";
import AIDiagramDialog from "./AIDiagramDialog";
import WhiteboardShareModal from "./WhiteboardShareModal";

// Client-only dynamic Excalidraw import
const ExcalidrawClient = dynamic(() => import("./ExcalidrawClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
        <p className="text-xs font-medium text-slate-500">Loading Clinical Whiteboard Canvas...</p>
      </div>
    </div>
  ),
});

interface WhiteboardEditorProps {
  initialWhiteboard: ClinicalWhiteboard;
  basePath: string; // e.g. "/doctor/whiteboards"
  userRole: string;
}

export default function WhiteboardEditor({
  initialWhiteboard,
  basePath,
  userRole,
}: WhiteboardEditorProps) {
  const [whiteboard, setWhiteboard] = useState<ClinicalWhiteboard>(initialWhiteboard);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [versions, setVersions] = useState<WhiteboardDocument[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<any[]>([]);

  const excalidrawApiRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load versions
  const loadVersions = useCallback(async () => {
    try {
      const vers = await whiteboardApi.getVersions(whiteboard.id);
      setVersions(vers);
    } catch (e) {
      console.error("Failed to load versions", e);
    }
  }, [whiteboard.id]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // WebSocket Live Collaboration
  useEffect(() => {
    if (typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname + ":8000";
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
    const wsUrl = `${protocol}//${host}/ws/whiteboards/${whiteboard.id}/?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "WHITEBOARD_UPDATE" && msg.elements && excalidrawApiRef.current) {
          // Update elements from remote collaborator
          excalidrawApiRef.current.updateScene({ elements: msg.elements });
        } else if (msg.type === "USER_JOINED") {
          setActiveCollaborators((prev) => [
            ...prev.filter((c) => c.user_id !== msg.user_id),
            { user_id: msg.user_id, name: msg.user_name, role: msg.role, color: msg.color },
          ]);
        } else if (msg.type === "USER_LEFT") {
          setActiveCollaborators((prev) => prev.filter((c) => c.user_id !== msg.user_id));
        }
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [whiteboard.id]);

  // Autosave logic
  const handleCanvasChange = (elements: readonly any[], appState: any, files: any) => {
    if (whiteboard.is_locked) return;

    setSaveStatus("unsaved");

    // Broadcast change to active WebSocket room
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "WHITEBOARD_UPDATE",
          elements: elements,
          version: whiteboard.current_version,
        })
      );
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const res = await whiteboardApi.saveDocument(whiteboard.id, {
          elements: Array.from(elements),
          appState: { viewBackgroundColor: appState.viewBackgroundColor || "#ffffff" },
          files: files || {},
        });
        setSaveStatus("saved");
        setWhiteboard((prev) => ({ ...prev, updated_at: res.updated_at }));
      } catch (e) {
        setSaveStatus("error");
      }
    }, 2000);
  };

  // Insert Clinical Templates
  const handleInsertTemplate = (templateName: string) => {
    if (!excalidrawApiRef.current || whiteboard.is_locked) return;
    const currentElements = excalidrawApiRef.current.getSceneElements();

    let newElements: any[] = [];
    if (templateName === "DECISION_DIAMOND") {
      newElements = [
        {
          id: `diamond-${Date.now()}`,
          type: "diamond",
          x: 200,
          y: 200,
          width: 200,
          height: 90,
          strokeColor: "#059669",
          backgroundColor: "#d1fae5",
          fillStyle: "solid",
          roundness: { type: 2 },
        },
        {
          id: `text-${Date.now()}`,
          type: "text",
          x: 230,
          y: 235,
          width: 140,
          height: 25,
          text: "Risk Threshold Met?",
          fontSize: 14,
          strokeColor: "#065f46",
          textAlign: "center",
        },
      ];
    } else if (templateName === "SEPSIS_BUNDLE") {
      newElements = [
        {
          id: `sepsis-${Date.now()}`,
          type: "rectangle",
          x: 200,
          y: 200,
          width: 320,
          height: 70,
          strokeColor: "#dc2626",
          backgroundColor: "#fee2e2",
          fillStyle: "solid",
          roundness: { type: 3 },
        },
        {
          id: `text-sepsis-${Date.now()}`,
          type: "text",
          x: 215,
          y: 225,
          width: 290,
          height: 25,
          text: "Surviving Sepsis: 1-Hr Blood Culture & Lactate",
          fontSize: 13,
          strokeColor: "#991b1b",
          textAlign: "center",
        },
      ];
    } else if (templateName === "NON_AUTHORITATIVE_BANNER") {
      newElements = [
        {
          id: `banner-${Date.now()}`,
          type: "rectangle",
          x: 100,
          y: 50,
          width: 580,
          height: 45,
          strokeColor: "#d97706",
          backgroundColor: "#fef3c7",
          fillStyle: "solid",
          roundness: { type: 3 },
        },
        {
          id: `text-banner-${Date.now()}`,
          type: "text",
          x: 120,
          y: 65,
          width: 540,
          height: 20,
          text: "⚠️ Non-Authoritative Diagram — Requires Human Clinician Sign-Off",
          fontSize: 13,
          strokeColor: "#92400e",
          textAlign: "center",
        },
      ];
    }

    excalidrawApiRef.current.updateScene({
      elements: [...currentElements, ...newElements],
    });
    setSaveStatus("unsaved");
  };

  // Insert AI generated elements
  const handleApproveAI = (aiElements: any[]) => {
    if (!excalidrawApiRef.current || whiteboard.is_locked) return;
    const currentElements = excalidrawApiRef.current.getSceneElements();
    excalidrawApiRef.current.updateScene({
      elements: [...currentElements, ...aiElements],
    });
    setSaveStatus("unsaved");
  };

  // Restore version
  const handleRestoreVersion = async (targetVersion: number, reason: string) => {
    const res = await whiteboardApi.restoreVersion(whiteboard.id, targetVersion, reason);
    if (res.document && excalidrawApiRef.current) {
      excalidrawApiRef.current.updateScene({
        elements: res.document.elements,
      });
      setWhiteboard((prev) => ({
        ...prev,
        current_version: res.current_version,
        is_locked: false,
      }));
      await loadVersions();
    }
  };

  // Clinical Review
  const handleReviewSubmit = async (
    action: "SUBMIT" | "APPROVE" | "REQUEST_CHANGES",
    notes: string
  ) => {
    const updated = await whiteboardApi.review(whiteboard.id, action, notes);
    setWhiteboard(updated);
  };

  // Export audit
  const handleExportAudit = async (format: "JSON" | "SVG" | "PNG") => {
    try {
      await whiteboardApi.auditExport(whiteboard.id, format);
    } catch (e) {
      console.error("Export audit failed", e);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation & Governance Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={basePath}
            className="flex items-center gap-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 line-clamp-1">{whiteboard.title}</h1>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                v{whiteboard.current_version}
              </span>
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  whiteboard.classification === "PHI"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-sky-50 text-sky-700 border-sky-200"
                }`}
              >
                {whiteboard.classification}
              </span>
              {whiteboard.is_locked && (
                <span
                  title="Locked by Clinician Sign-Off"
                  className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
                >
                  <Lock className="h-3 w-3" />
                  Locked (Approved)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {whiteboard.type.replace("_", " ")}
              {whiteboard.patient_mrn ? ` • Patient ${whiteboard.patient_mrn}` : ""}
            </p>
          </div>
        </div>

        {/* Central Clinical Toolbar */}
        <WhiteboardToolbar
          onInsertTemplate={handleInsertTemplate}
          onOpenAIDialog={() => setShowAI(true)}
          isReadOnly={whiteboard.is_locked}
        />

        {/* Action Controls & Save Status */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators */}
          {activeCollaborators.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[11px] text-slate-600">
              <Users className="h-3.5 w-3.5 text-sky-600" />
              <span>{activeCollaborators.length + 1} online</span>
            </div>
          )}

          {/* Autosave Status Pill */}
          <div className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 font-medium">
            {saveStatus === "saving" && (
              <span className="text-sky-600 flex items-center gap-1">
                <span className="h-2 w-2 animate-ping rounded-full bg-sky-500" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && <span className="text-emerald-600">● Saved</span>}
            {saveStatus === "unsaved" && <span className="text-amber-600">● Unsaved</span>}
            {saveStatus === "error" && <span className="text-rose-600">● Save Failed</span>}
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReview(true)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Review</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5 text-sky-600" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <main className="relative flex-1 w-full overflow-hidden">
        <ExcalidrawClient
          excalidrawRef={excalidrawApiRef}
          initialData={whiteboard.current_document || undefined}
          onChange={handleCanvasChange}
          isReadOnly={whiteboard.is_locked}
        />
      </main>

      {/* Modals & Drawers */}
      <VersionHistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        versions={versions}
        currentVersion={whiteboard.current_version}
        onRestore={handleRestoreVersion}
        isLocked={whiteboard.is_locked}
      />

      <ClinicalReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        whiteboard={whiteboard}
        userRole={userRole}
        onReviewSubmit={handleReviewSubmit}
      />

      <AIDiagramDialog
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        whiteboardId={whiteboard.id}
        onApproveAndInsert={handleApproveAI}
      />

      <WhiteboardShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        whiteboardId={whiteboard.id}
        whiteboardTitle={whiteboard.title}
      />
    </div>
  );
}
