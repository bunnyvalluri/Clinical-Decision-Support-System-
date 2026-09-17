import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, CheckCircle2, Clock, Cpu, FileWarning, Loader2 } from "lucide-react";

export type AIInferenceState =
  | "GENERATING"
  | "COMPLETED"
  | "REVIEW_REQUIRED"
  | "UNAVAILABLE";

export interface AIExplanationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  modelTag: string;
  explanation: string;
  state?: AIInferenceState;
  timestamp?: string;
  requiresReview?: boolean;
}

export function AIExplanationCard({
  modelTag,
  explanation,
  state = "COMPLETED",
  timestamp,
  requiresReview = true,
  className,
  ...props
}: AIExplanationCardProps) {
  const stateConfig: Record<
    AIInferenceState,
    {
      variant: "default" | "secondary" | "warning" | "destructive";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    GENERATING: {
      variant: "secondary",
      label: "AI Generating...",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    COMPLETED: {
      variant: "default",
      label: "AI Generated",
      icon: <Bot className="h-3 w-3" />,
    },
    REVIEW_REQUIRED: {
      variant: "warning",
      label: "Clinician Review Required",
      icon: <FileWarning className="h-3 w-3" />,
    },
    UNAVAILABLE: {
      variant: "destructive",
      label: "AI Unavailable",
      icon: <FileWarning className="h-3 w-3" />,
    },
  };

  const current = stateConfig[state] || stateConfig.COMPLETED;

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              <Cpu className="h-3 w-3 mr-1 text-primary" />
              {modelTag}
            </Badge>
            <Badge variant={current.variant} className="text-[10px]">
              <span className="mr-1">{current.icon}</span>
              {current.label}
            </Badge>
          </div>
          <CardTitle className="text-sm font-semibold text-foreground pt-1">
            Clinical AI Synthesis & Rationale
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {state === "GENERATING" ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Streaming clinical explanation from verified local LLM...</span>
          </div>
        ) : state === "UNAVAILABLE" ? (
          <div className="rounded-md border border-destructive/20 bg-rose-50/50 p-3 text-rose-800">
            AI inference service is currently offline or unreachable. Core clinical functions and classical ML risk models remain operational.
          </div>
        ) : (
          <div className="rounded-md border border-border/80 bg-muted/30 p-3.5 leading-relaxed text-foreground whitespace-pre-wrap font-sans">
            {explanation}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          {timestamp && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="tabular-nums">{timestamp}</span>
            </div>
          )}
          {requiresReview && (
            <div className="flex items-center gap-1 text-amber-700 font-medium ml-auto">
              <FileWarning className="h-3.5 w-3.5" />
              <span>Non-autonomous: Requires physician validation</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
