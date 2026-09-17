import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export interface EvidenceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  source: string;
  doiOrUrl?: string;
  evidenceLevel?: "A" | "B" | "C" | string;
  summary: string;
  publishedYear?: number | string;
}

export function EvidenceCard({
  title,
  source,
  doiOrUrl,
  evidenceLevel,
  summary,
  publishedYear,
  className,
  ...props
}: EvidenceCardProps) {
  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {source} {publishedYear ? `(${publishedYear})` : ""}
            </span>
          </div>
          {evidenceLevel && (
            <Badge variant="outline" className="text-[10px]">
              Evidence Level {evidenceLevel}
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm font-bold text-foreground pt-1">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="text-muted-foreground leading-relaxed">{summary}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> Peer-Reviewed Guideline
          </span>
          {doiOrUrl && (
            <a
              href={doiOrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <span>View Reference</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
