"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  ShieldCheck, 
  Eye, 
  Zap, 
  Terminal, 
  Check, 
  ExternalLink 
} from "lucide-react";

interface BrowserAction {
  step_number: number;
  action_type: string;
  selector?: string;
  element_tag?: string;
  element_text?: string;
  input_value?: string;
  duration_ms?: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "VERIFIED" | "BLOCKED";
  verification_passed?: boolean;
  timestamp?: string;
  error_message?: string;
}

interface BrowserTaskTimelineProps {
  taskId: string;
  taskStatus: string;
  actions: BrowserAction[];
  verificationStatus?: string;
  verificationEvidence?: any;
  onRefresh?: () => void;
  isRunning?: boolean;
}

export function BrowserTaskTimeline({
  taskId,
  taskStatus,
  actions = [],
  verificationStatus = "UNVERIFIED",
  verificationEvidence,
  onRefresh,
  isRunning = false,
}: BrowserTaskTimelineProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SUCCEEDED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">Running</Badge>;
      case "VERIFYING":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Verifying</Badge>;
      case "BLOCKED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Policy Blocked</Badge>;
      case "FAILED":
      case "VERIFICATION_FAILED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Failed</Badge>;
      case "AWAITING_APPROVAL":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Awaiting Sign-off</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Execution Timeline & Verification Trace
            </CardTitle>
            <p className="text-xs text-slate-500 font-mono">Task ID: {taskId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(taskStatus)}
          {verificationStatus === "PASSED" && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Safe
            </Badge>
          )}
          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="text-xs h-7 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {actions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-600">No actions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Actions will appear in real-time as Jev Ultrafast executes the task.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {actions.map((act, idx) => {
              const isSuccess = act.status === "COMPLETED" || act.status === "VERIFIED";
              const isFailed = act.status === "FAILED" || act.status === "BLOCKED";
              const isCurrent = act.status === "RUNNING";

              return (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                      isSuccess
                        ? "border-emerald-500 text-emerald-600"
                        : isFailed
                        ? "border-rose-500 text-rose-600"
                        : isCurrent
                        ? "border-blue-500 text-blue-600 animate-spin"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {isSuccess ? (
                      <Check className="w-3 h-3" />
                    ) : isFailed ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100/60 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          Step {act.step_number || idx + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[11px] bg-white border-slate-200 font-semibold text-slate-800"
                        >
                          {act.action_type}
                        </Badge>
                        {act.duration_ms && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {act.duration_ms}ms
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-700">
                      {act.element_text && (
                        <p className="font-medium text-slate-800">
                          Target: <span className="text-indigo-600 font-mono">"{act.element_text}"</span>
                        </p>
                      )}
                      {act.selector && (
                        <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                          Selector: {act.selector}
                        </p>
                      )}
                      {act.input_value && (
                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Value: [REDACTED_SAFE_INPUT]
                        </p>
                      )}
                      {act.error_message && (
                        <p className="text-xs text-rose-600 font-medium mt-1">
                          Error: {act.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {verificationEvidence && (
          <div className="mt-6 p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Independent Verification Evidence (DONE != SUCCESS Invariant)</span>
            </div>
            <pre className="text-[11px] bg-white p-3 rounded border border-emerald-200 text-slate-800 font-mono overflow-x-auto">
              {typeof verificationEvidence === "string"
                ? verificationEvidence
                : JSON.stringify(verificationEvidence, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
