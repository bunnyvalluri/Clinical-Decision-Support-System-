import * as React from "react";
import { AIReviewPanel, type AIReviewPanelProps } from "@/components/clinical/AIReviewPanel";

export function AIReview(props: AIReviewPanelProps) {
  return <AIReviewPanel {...props} />;
}
