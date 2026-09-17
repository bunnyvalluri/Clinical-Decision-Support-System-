"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown, AlertOctagon, StopCircle, RefreshCw, Cpu, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agentService } from "@/services/ai/agentService";

interface AgentExecutionControlsProps {
  executionId?: string;
  sessionId?: string;
  status?: string;
  latencyMs?: number;
  iterationCount?: number;
  provider?: string;
  model?: string;
  onCancelled?: () => void;
  onFeedbackSubmitted?: () => void;
}

export const AgentExecutionControls: React.FC<AgentExecutionControlsProps> = ({
  executionId,
  status,
  latencyMs,
  iterationCount,
  provider,
  model,
  onCancelled,
  onFeedbackSubmitted,
}) => {
  const [feedbackRating, setFeedbackRating] = React.useState<string | null>(null);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const handleCancel = async () => {
    if (!executionId) return;
    setIsCancelling(true);
    try {
      await agentService.cancelExecution(executionId);
      if (onCancelled) onCancelled();
    } catch (err) {
      console.error("Failed to cancel execution:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleFeedback = async (rating: "HELPFUL" | "INCORRECT" | "UNSAFE") => {
    if (!executionId) return;
    try {
      await agentService.submitFeedback(executionId, rating);
      setFeedbackRating(rating);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const isRunning = status === "STARTED" || status === "PLANNING" || status === "ACTING";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-white text-xs">
      <div className="flex items-center gap-2 flex-wrap text-slate-500">
        {provider && (
          <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-700">
            <Cpu className="h-3 w-3 text-blue-600" />
            {provider}/{model || "default"}
          </span>
        )}

        {iterationCount !== undefined && (
          <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px] text-slate-700">
            <Layers className="h-3 w-3 text-slate-500" />
            {iterationCount} iteration{iterationCount === 1 ? "" : "s"}
          </span>
        )}

        {latencyMs !== undefined && latencyMs > 0 && (
          <span className="text-[11px] text-slate-400 font-mono">
            {latencyMs.toFixed(0)}ms
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isRunning && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCancelling}
            onClick={handleCancel}
            className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <StopCircle className="h-3.5 w-3.5 mr-1" />
            Cancel Run
          </Button>
        )}

        {executionId && !isRunning && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 mr-1">Feedback:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={Boolean(feedbackRating)}
              onClick={() => handleFeedback("HELPFUL")}
              className={`h-7 px-2 text-xs ${
                feedbackRating === "HELPFUL"
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
              title="Helpful & Clinically Sound"
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              Helpful
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={Boolean(feedbackRating)}
              onClick={() => handleFeedback("INCORRECT")}
              className={`h-7 px-2 text-xs ${
                feedbackRating === "INCORRECT"
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-slate-600 hover:text-amber-700 hover:bg-amber-50"
              }`}
              title="Incorrect Clinical Reasoning"
            >
              <ThumbsDown className="h-3.5 w-3.5 mr-1" />
              Incorrect
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={Boolean(feedbackRating)}
              onClick={() => handleFeedback("UNSAFE")}
              className={`h-7 px-2 text-xs ${
                feedbackRating === "UNSAFE"
                  ? "bg-rose-50 text-rose-700 font-medium"
                  : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
              }`}
              title="Unsafe Clinical Recommendation"
            >
              <AlertOctagon className="h-3.5 w-3.5 mr-1" />
              Unsafe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentExecutionControls;
