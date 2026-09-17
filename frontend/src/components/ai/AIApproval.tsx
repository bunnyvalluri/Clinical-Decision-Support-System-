import * as React from "react";
import { HumanApprovalDialog } from "./HumanApprovalDialog";

export interface AIApprovalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDetails: string;
  onApprove: (rationale: string) => void;
  onReject: (rationale: string) => void;
  onClose: () => void;
}

export function AIApproval(props: AIApprovalProps) {
  return <HumanApprovalDialog {...props} />;
}
