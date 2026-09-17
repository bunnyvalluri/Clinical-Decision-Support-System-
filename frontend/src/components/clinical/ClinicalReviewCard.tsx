"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldAlert, UserCheck, XCircle } from "lucide-react";

export interface ClinicalReviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  itemTitle: string;
  itemIdentifier: string;
  onApprove: (notes: string) => Promise<void> | void;
  onReject: (notes: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ClinicalReviewCard({
  itemTitle,
  itemIdentifier,
  onApprove,
  onReject,
  isSubmitting = false,
  className,
  ...props
}: ClinicalReviewCardProps) {
  const [notes, setNotes] = React.useState("");

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Clinician Sign-Off & Verification
            </CardTitle>
          </div>
          <Badge variant="warning" className="text-xs">
            Review Required
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Mandatory Human-in-the-Loop policy: AI and ML systems only generate recommendations. A licensed clinician must verify and approve before action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
          <span className="font-semibold text-foreground block">Subject:</span>
          <span className="text-muted-foreground">{itemTitle} ({itemIdentifier})</span>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="clinical-review-notes"
            className="block text-xs font-medium text-foreground"
          >
            Clinician Assessment & Rationale *
          </label>
          <Textarea
            id="clinical-review-notes"
            placeholder="Enter clinical rationale, contraindications, or observation notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            className="text-xs"
          />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-2 pt-0">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isSubmitting || !notes.trim()}
          isLoading={isSubmitting}
          onClick={() => onReject(notes)}
          className="text-xs"
        >
          <XCircle className="h-3.5 w-3.5 mr-1" /> Overrule / Reject
        </Button>
        <Button
          type="button"
          variant="success"
          size="sm"
          disabled={isSubmitting || !notes.trim()}
          isLoading={isSubmitting}
          onClick={() => onApprove(notes)}
          className="text-xs"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Sign-Off
        </Button>
      </CardFooter>
    </Card>
  );
}
