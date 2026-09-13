import * as React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 text-center max-w-md mx-auto my-6 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm mb-4">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="default"
          size="sm"
          onClick={onAction}
          className="mt-5 text-xs shadow-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
