"use client";

import React, { useEffect, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawClientProps {
  initialData?: {
    elements?: any[];
    appState?: Record<string, any>;
    files?: Record<string, any>;
  };
  onChange?: (elements: readonly any[], appState: any, files: any) => void;
  isReadOnly?: boolean;
  excalidrawRef?: React.RefObject<any>;
}

export default function ExcalidrawClient({
  initialData,
  onChange,
  isReadOnly = false,
  excalidrawRef,
}: ExcalidrawClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Initializing Clinical Canvas...</p>
        </div>
      </div>
    );
  }

  // Hospital Light Theme Enforcement
  const initialAppState = {
    theme: "light" as const,
    viewBackgroundColor: "#ffffff",
    ...(initialData?.appState || {}),
  };

  return (
    <div className="relative h-full w-full bg-white font-sans antialiased">
      <Excalidraw
        excalidrawAPI={(api) => {
          if (excalidrawRef && "current" in excalidrawRef) {
            (excalidrawRef as any).current = api;
          }
        }}
        initialData={{
          elements: initialData?.elements || [],
          appState: initialAppState,
          files: initialData?.files || {},
        }}
        onChange={(elements, appState, files) => {
          if (onChange) {
            onChange(elements, appState, files);
          }
        }}
        viewModeEnabled={isReadOnly}
        theme="light"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: !isReadOnly,
            loadScene: false,
            saveToActiveFile: false,
            theme: false, // Disables dark mode toggle in compliance with hospital light theme standard
            export: {
              saveFileToDisk: true,
            },
          },
        }}
      />
    </div>
  );
}
