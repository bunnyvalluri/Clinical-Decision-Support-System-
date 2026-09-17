import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

export type RealtimeConnectionState = "connected" | "reconnecting" | "disconnected";

export interface RealtimeStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: RealtimeConnectionState;
  showIcon?: boolean;
}

export function RealtimeStatusBadge({
  status,
  showIcon = true,
  className,
  ...props
}: RealtimeStatusBadgeProps) {
  const config: Record<
    RealtimeConnectionState,
    {
      label: string;
      variant: "success" | "warning" | "destructive";
      dotClass: string;
      ariaLabel: string;
    }
  > = {
    connected: {
      label: "Live Telemetry",
      variant: "success",
      dotClass: "bg-emerald-500 animate-ping",
      ariaLabel: "WebSocket status: Live telemetry connected",
    },
    reconnecting: {
      label: "Reconnecting...",
      variant: "warning",
      dotClass: "bg-amber-500 animate-pulse",
      ariaLabel: "WebSocket status: Reconnecting to Django Channels",
    },
    disconnected: {
      label: "Disconnected",
      variant: "destructive",
      dotClass: "bg-rose-500",
      ariaLabel: "WebSocket status: Realtime stream disconnected",
    },
  };

  const current = config[status] || config.disconnected;

  return (
    <Badge
      variant={current.variant}
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}
      role="status"
      aria-label={current.ariaLabel}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            current.dotClass
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            status === "connected"
              ? "bg-emerald-600"
              : status === "reconnecting"
              ? "bg-amber-600"
              : "bg-rose-600"
          )}
        />
      </span>
      <span>{current.label}</span>
    </Badge>
  );
}
