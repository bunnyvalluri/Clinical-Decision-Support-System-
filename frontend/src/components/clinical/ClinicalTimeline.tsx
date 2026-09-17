import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, AlertCircle, CheckCircle2, Clock, FileText, Stethoscope } from "lucide-react";

export interface ClinicalTimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  eventType: "ADMISSION" | "VITAL_CHECK" | "PREDICTION" | "REVIEW" | "ALERT" | "DISCHARGE" | string;
  actor?: string;
  severity?: "normal" | "warning" | "critical";
}

export interface ClinicalTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  events: ClinicalTimelineEvent[];
  emptyMessage?: string;
}

export function ClinicalTimeline({
  events,
  emptyMessage = "No clinical events recorded for this encounter.",
  className,
  ...props
}: ClinicalTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={cn("p-6 text-center text-xs text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "ADMISSION":
        return <Stethoscope className="h-3.5 w-3.5 text-primary" />;
      case "PREDICTION":
        return <Activity className="h-3.5 w-3.5 text-emerald-600" />;
      case "ALERT":
        return <AlertCircle className="h-3.5 w-3.5 text-rose-600" />;
      case "REVIEW":
        return <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border", className)} {...props}>
      {events.map((event) => (
        <div key={event.id} className="relative flex flex-col gap-1 text-xs">
          <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background shadow-xs">
            {getEventIcon(event.eventType)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground text-sm">
              {event.title}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <Clock className="h-3 w-3" />
              <span>{event.timestamp}</span>
            </div>
          </div>
          {event.description && (
            <p className="text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          )}
          {event.actor && (
            <div className="text-[11px] text-muted-foreground/80 mt-0.5">
              Recorded by: <span className="font-medium text-foreground">{event.actor}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
