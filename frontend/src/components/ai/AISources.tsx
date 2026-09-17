import * as React from "react";
import { CitationList } from "./CitationList";
import { SourceCard, type CitationItem } from "./SourceCard";
import { cn } from "@/lib/utils";

export interface AISourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  citations?: CitationItem[];
}

export function AISources({
  citations,
  className,
  ...props
}: AISourcesProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <CitationList citations={citations} />
    </div>
  );
}
