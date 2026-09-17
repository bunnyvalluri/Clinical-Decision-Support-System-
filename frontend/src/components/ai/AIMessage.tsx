"use client";

import * as React from "react";
import { Bot, User, Sparkles } from "lucide-react";
import { CitationList } from "./CitationList";
import { CitationItem } from "./SourceCard";
import { AIConfidenceIndicator } from "./AIConfidenceIndicator";
import { ToolExecutionCard } from "./ToolExecutionCard";
import { AIWarning } from "./AIWarning";

export interface MessageData {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string | Date;
  modelName?: string;
  citations?: CitationItem[];
  groundingStatus?: string;
  groundingConfidence?: number;
  toolCalls?: Array<{ tool_name: string; success: boolean; latency_ms?: number }>;
  requiresApproval?: boolean;
  isError?: boolean;
}

interface AIMessageProps {
  message: MessageData;
  onApproveAction?: () => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message, onApproveAction }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          isUser
            ? "bg-slate-700 text-white"
            : "bg-blue-600 text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${
          isUser
            ? "rounded-tr-none bg-blue-50 border-blue-100 text-slate-900"
            : "rounded-tl-none bg-white border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2 text-[11px]">
          <span className="font-semibold text-slate-900">
            {isUser ? "You" : "HealthNova AI Assistant"}
          </span>
          <div className="flex items-center gap-2">
            {message.modelName && !isUser && (
              <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                {message.modelName}
              </span>
            )}
            {message.groundingStatus && !isUser && (
              <AIConfidenceIndicator
                status={message.groundingStatus}
                confidence={message.groundingConfidence}
              />
            )}
          </div>
        </div>

        <div className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
          {message.content}
        </div>

        {/* Citations List */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <CitationList citations={message.citations} />
        )}

        {/* Tool Executions */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolExecutionCard executions={message.toolCalls} />
        )}

        {/* Human Approval Required Notice */}
        {!isUser && message.requiresApproval && (
          <div className="mt-3">
            <AIWarning
              isHighRisk
              message="This clinical recommendation requires attending clinician review before application."
            />
            {onApproveAction && (
              <button
                type="button"
                onClick={onApproveAction}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Review & Sign Action Gate →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
