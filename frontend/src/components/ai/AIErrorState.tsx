"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIErrorStateProps {
  errorCode?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export const AIErrorState: React.FC<AIErrorStateProps> = ({
  errorCode = "AI_SERVICE_UNAVAILABLE",
  errorMessage = "The AI service is temporarily unavailable. Deterministic clinical rules remain active.",
  onRetry,
}) => {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h4 className="mt-2 text-sm font-semibold text-rose-900">
        Service Notice [{errorCode}]
      </h4>
      <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
        {errorMessage}
      </p>
      {onRetry && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="text-xs border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry Query
          </Button>
        </div>
      )}
    </div>
  );
};
