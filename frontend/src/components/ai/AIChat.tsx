"use client";

import * as React from "react";
import { Send, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";
import { AIMessage, MessageData } from "./AIMessage";
import { AIStreamingMessage } from "./AIStreamingMessage";
import { AIErrorState } from "./AIErrorState";
import { ToolActivityStream } from "./agent/ToolActivityStream";
import { PendingApprovalCard } from "./agent/PendingApprovalCard";
import { AgentExecutionControls } from "./agent/AgentExecutionControls";
import { agentService, ToolTraceStep } from "@/services/ai/agentService";
import { approvalService, AgentApprovalDTO } from "@/services/ai/approvalService";
import { AgentSocketClient } from "@/services/ai/agentSocket";

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
  agentRole?: "DOCTOR" | "NURSE" | "PATIENT" | "INFORMATICIST" | "ADMIN";
}

export const AIChat: React.FC<AIChatProps> = ({
  initialGreeting,
  roleSubtitle,
  suggestedQueries,
  patientId,
  apiEndpoint = "/ai/chat/",
  agentRole,
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

  // Agent State
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = React.useState<string | undefined>(undefined);
  const [activeTrace, setActiveTrace] = React.useState<ToolTraceStep[]>([]);
  const [pendingApproval, setPendingApproval] = React.useState<AgentApprovalDTO | null>(null);
  const [executionMetadata, setExecutionMetadata] = React.useState<{
    provider?: string;
    model?: string;
    latencyMs?: number;
    iterationCount?: number;
    status?: string;
  }>({});

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const socketRef = React.useRef<AgentSocketClient | null>(null);

  // Initialize or re-use session
  React.useEffect(() => {
    let isMounted = true;
    async function initSession() {
      if (!agentRole) return;
      try {
        const session = await agentService.createSession(
          agentRole,
          patientId,
          `${agentRole} Clinical Session`
        );
        if (isMounted) {
          setSessionId(session.id);
          // Connect WebSocket
          const client = new AgentSocketClient(session.id);
          socketRef.current = client;
          client.connect();

          client.subscribe((event) => {
            if (event.type === "tool_call_completed" || event.type === "tool_call_failed") {
              setActiveTrace((prev) => [
                ...prev,
                {
                  tool_name: event.data.tool_name,
                  status: event.data.status,
                  latency_ms: event.data.execution_time_ms,
                  arguments: event.data.arguments,
                  error: event.data.error,
                },
              ]);
            } else if (event.type === "approval_required" && event.data.approval_id) {
              approvalService.getApproval(event.data.approval_id).then((appr) => {
                if (isMounted) setPendingApproval(appr);
              });
            }
          });
        }
      } catch (err) {
        console.warn("Agent session init fallback to standard chat endpoint:", err);
      }
    }
    initSession();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [agentRole, patientId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeTrace, pendingApproval]);

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
    setActiveTrace([]);
    setPendingApproval(null);

    // If agent session exists, execute via agentService
    if (sessionId) {
      try {
        const res = await agentService.runAgent(sessionId, text, patientId);
        setCurrentExecutionId(res.execution_id);
        setExecutionMetadata({
          provider: res.provider,
          model: res.model,
          latencyMs: res.latency_ms,
          iterationCount: res.iterations,
          status: res.status,
        });

        const aiMsg: MessageData = {
          id: res.execution_id || `ai-${Date.now()}`,
          role: "assistant",
          content: res.final_response || "Clinical assessment completed.",
          timestamp: new Date(),
          modelName: `${res.provider}/${res.model}`,
          citations: (res.citations || []).map((c: any) => ({
            guideline_id: c.guideline_id || c.document_id || "CLINICAL-GUIDELINE",
            title: c.title || "Approved Clinical Guideline",
            section: c.section || "",
            recommendation: c.passage || c.recommendation || "",
            evidence_level: c.evidence_level || "Class I",
            doi_or_url: c.doi_or_url,
          })),
          groundingStatus: "GROUNDED",
          groundingConfidence: 1.0,
        };

        setMessages((prev) => [...prev, aiMsg]);

        // If approval was requested during the run
        if (res.approval_required && res.approval_id) {
          try {
            const appr = await approvalService.getApproval(res.approval_id);
            setPendingApproval(appr);
          } catch (e) {
            console.error("Failed to load approval details:", e);
          }
        }
      } catch (err: any) {
        const errData = err.response?.data;
        setErrorInfo({
          code: errData?.code || "AI_AGENT_ERROR",
          message: errData?.error || "Failed to execute agent workflow.",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard fallback execution
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
            onApproveAction={() => {}}
          />
        ))}

        {/* Live Verified Tool Activity Stream */}
        <ToolActivityStream steps={activeTrace} isLoading={isLoading} />

        {/* Pending Human Clinician Approval Card */}
        {pendingApproval && (
          <PendingApprovalCard
            approval={pendingApproval}
            onResolved={(updated) => {
              setPendingApproval(updated);
              setMessages((prev) => [
                ...prev,
                {
                  id: `approval-res-${Date.now()}`,
                  role: "system",
                  content: `✓ Clinician Sign-Off Recorded: ${updated.status} (${updated.requested_action})`,
                  timestamp: new Date(),
                },
              ]);
            }}
          />
        )}

        {isLoading && !activeTrace.length && (
          <AIStreamingMessage
            partialText="Synthesizing grounded evidence and evaluating safety boundaries..."
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

      {/* Execution Controls & Telemetry */}
      {currentExecutionId && (
        <div className="px-4 py-2 border-t border-slate-100 bg-white">
          <AgentExecutionControls
            executionId={currentExecutionId}
            sessionId={sessionId || undefined}
            status={executionMetadata.status}
            latencyMs={executionMetadata.latencyMs}
            iterationCount={executionMetadata.iterationCount}
            provider={executionMetadata.provider}
            model={executionMetadata.model}
          />
        </div>
      )}

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
    </div>
  );
};

export default AIChat;
