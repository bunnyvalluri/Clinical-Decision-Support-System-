"use client";

import * as React from "react";
import { AIChat } from "@/components/ai/AIChat";
import { Server, ShieldAlert, Cpu } from "lucide-react";

const ADMIN_QUERIES = [
  { label: "AI Gateway Status", text: "Summarize AI Gateway throughput, rate limit hit rates, and provider latencies." },
  { label: "Prompt Injection Audit", text: "Report all blocked prompt injection attempts and safety policy flags in the last 24 hours." },
  { label: "MCP Server Health", text: "Check connectivity and response times across approved Model Context Protocol servers." },
  { label: "Model Registry Quota", text: "Audit token usage and estimated provider costs across OpenAI, Anthropic, and Gemini." },
];

export default function AdminAIAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 p-4 md:p-6 bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-slate-700" />
            System Administration &amp; AI Diagnostic Assistant
          </h1>
          <p className="text-xs text-slate-500">
            System health monitoring, AI gateway diagnostics, MCP connectivity audits, and token cost tracking.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Cpu className="h-4 w-4 text-blue-600" />
          <span>Infrastructure Diagnostics · Sandboxed Admin Operations</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AIChat
          roleSubtitle="Gateway Diagnostics · Security Audit · MCP Status · Infrastructure Logs"
          initialGreeting="Hello, System Administrator. I am your HealthNova System Diagnostic Assistant. I can help you monitor AI Gateway status, audit rate limits, inspect MCP connectivity, and track token costs. No arbitrary shell execution is permitted."
          suggestedQueries={ADMIN_QUERIES}
        />
      </div>
    </div>
  );
}
