"use client";

import * as React from "react";
import { Send, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";
import { AIMessage, MessageData } from "./AIMessage";
import { AIStreamingMessage } from "./AIStreamingMessage";
import { HumanApprovalDialog } from "./HumanApprovalDialog";
import { AIErrorState } from "./AIErrorState";

interface SuggestedQuery {
  label: string;
  text: string;
}

interface AIChatProps {
  initialGreeting: string;
  roleSubtitle: string;
  suggestedQueries: SuggestedQuery[];
  patientId?: string;
  apiEndpoint?: string;
}

export const AIChat: React.FC<AIChatProps> = ({
  initialGreeting,
  roleSubtitle,
  suggestedQueries,
  patientId,
  apiEndpoint = "/ai/chat/",
}) => {
  const [messages, setMessages] = React.useState<MessageData[]>([
    {
      id: "welcome",
      role: "assistant",
      content: initialGreeting,
      timestamp: new Date(),
      groundingStatus: "GROUNDED",
      groundingConfidence: 1.0,
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorInfo, setErrorInfo] = React.useState<{ code?: string; message?: string } | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<any>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (contentToSend: string) => {
    const text = contentToSend.trim();
    if (!text || isLoading) return;

    setErrorInfo(null);
    const userMsg: MessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiClient.post<{
        conversation_id: string;
        message: any;
        citations: any[];
        grounding_status: string;
        grounding_confidence: number;
        requires_human_approval: boolean;
        approval_details?: any;
        safety_flags?: string[];
      }>(apiEndpoint, {
        query: text,
        patient_id: patientId || null,
      });

      const data = res.data;
      const aiMsg: MessageData = {
        id: data.message?.id || `ai-${Date.now()}`,
        role: "assistant",
        content: data.message?.content || "Information retrieved successfully.",
        timestamp: new Date(),
        modelName: data.message?.model_name,
        citations: data.citations || [],
        groundingStatus: data.grounding_status || "GROUNDED",
        groundingConfidence: data.grounding_confidence ?? 1.0,
        toolCalls: data.message?.tool_calls || [],
        requiresApproval: data.requires_human_approval,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.requires_human_approval && data.approval_details) {
        setPendingAction(data.approval_details);
      }
    } catch (err: any) {
      const errData = err.response?.data;
      setErrorInfo({
        code: errData?.code || "AI_REQUEST_FAILED",
        message: errData?.error || "Failed to communicate with AI service.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-5 py-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            HealthNova AI Assistant
          </h2>
          <p className="text-xs text-slate-500">{roleSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
        {messages.map((msg) => (
          <AIMessage
            key={msg.id}
            message={msg}
            onApproveAction={() => setApprovalModalOpen(true)}
          />
        ))}

        {isLoading && (
          <AIStreamingMessage
            partialText="Synthesizing grounded evidence and clinical guidelines..."
            isStreaming={true}
          />
        )}

        {errorInfo && (
          <AIErrorState
            errorCode={errorInfo.code}
            errorMessage={errorInfo.message}
            onRetry={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === "user");
              if (lastUser) handleSend(lastUser.content);
            }}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Queries */}
      {suggestedQueries.length > 0 && messages.length <= 3 && (
        <div className="border-t border-slate-100 bg-white px-5 py-2.5">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
            Suggested Consultations:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sq.text)}
                disabled={isLoading}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors disabled:opacity-50"
              >
                {sq.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a clinical question, search guidelines, or request risk explanation..."
            className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 bg-white"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-4"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send
          </Button>
        </form>
      </div>

      {/* Human Approval Gate Dialog */}
      <HumanApprovalDialog
        isOpen={approvalModalOpen}
        actionTitle={pendingAction?.action || "Clinical Recommendation Sign-Off"}
        actionDetails="Review and authenticate the proposed clinical decision-support plan in compliance with institutional safety governance."
        onClose={() => setApprovalModalOpen(false)}
        onApprove={(rationale) => {
          setApprovalModalOpen(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `gate-${Date.now()}`,
              role: "system",
              content: `✓ Clinician Signed & Approved: ${rationale || "Plan accepted"}`,
              timestamp: new Date(),
            },
          ]);
        }}
        onReject={(rationale) => {
          setApprovalModalOpen(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `gate-${Date.now()}`,
              role: "system",
              content: `✗ Clinician Rejected Action: ${rationale || "Plan rejected"}`,
              timestamp: new Date(),
            },
          ]);
        }}
      />
    </div>
  );
};
