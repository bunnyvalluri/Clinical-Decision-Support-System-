"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

interface AIStreamingMessageProps {
  partialText: string;
  isStreaming: boolean;
}

export const AIStreamingMessage: React.FC<AIStreamingMessageProps> = ({
  partialText,
  isStreaming,
}) => {
  return (
    <div className="flex gap-3 text-slate-800">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
        <Sparkles className="h-4 w-4 animate-pulse" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-900">HealthNova AI Assistant</span>
          <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
            Streaming response...
          </span>
        </div>
        <div className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
          {partialText}
          {isStreaming && (
            <span className="inline-block h-3.5 w-1.5 ml-0.5 bg-blue-600 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};
