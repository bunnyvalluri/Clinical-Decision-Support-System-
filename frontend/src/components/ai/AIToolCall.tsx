import * as React from "react";
import { ToolExecutionCard } from "./ToolExecutionCard";

export interface ToolExecutionItem {
  tool_name: string;
  success: boolean;
  latency_ms?: number;
}

export interface AIToolCallProps {
  execution?: ToolExecutionItem;
  executions?: ToolExecutionItem[];
}

export function AIToolCall({ execution, executions }: AIToolCallProps) {
  const items = executions || (execution ? [execution] : []);
  return <ToolExecutionCard executions={items} />;
}
