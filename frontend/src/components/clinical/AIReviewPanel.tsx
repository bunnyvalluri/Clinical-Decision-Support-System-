"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Bot, CheckCircle, FileEdit, ShieldAlert } from "lucide-react";

export interface AIReviewPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  recommendationId: string;
  generatedText: string;
  modelIdentifier: string;
  onApprove: (finalText: string) => Promise<void> | void;
  onReject: (reason: string) => Promise<void> | void;
  isProcessing?: boolean;
}

export function AIReviewPanel({
  recommendationId,
  generatedText,
  modelIdentifier,
  onApprove,
  onReject,
  isProcessing = false,
  className,
  ...props
}: AIReviewPanelProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState(generatedText);
  const [rejectReason, setRejectReason] = React.useState("");

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Clinician AI Verification Panel
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {modelIdentifier}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Review, modify, or reject AI-generated clinical narrative. Approved output is logged in the tamper-evident audit record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <div className="space-y-1.5">
            <label
              htmlFor="edit-ai-narrative"
              className="text-xs font-medium text-foreground block"
            >
              Modify Recommendation Text:
            </label>
            <Textarea
              id="edit-ai-narrative"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="text-xs min-h-[120px]"
              disabled={isProcessing}
            />
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
            {editedText}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isProcessing}
          className="text-xs"
        >
          <FileEdit className="h-3.5 w-3.5 mr-1" />
          {isEditing ? "Cancel Editing" : "Edit Text"}
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Rejection Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="text-xs text-destructive hover:bg-rose-50"
              >
                Reject AI Draft
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject AI Recommendation?</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason for rejecting this AI synthesis. This audit entry will be logged for continuous model evaluation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <Textarea
                  placeholder="Clinical reason for rejection (e.g. inappropriate dosage, outdated protocol)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onReject(rejectReason || "Clinical disagreement")}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Rejection
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Approval Action */}
          <Button
            variant="success"
            size="sm"
            isLoading={isProcessing}
            disabled={isProcessing}
            onClick={() => onApprove(editedText)}
            className="text-xs"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Approve Narrative
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
