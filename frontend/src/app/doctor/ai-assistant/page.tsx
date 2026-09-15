"use client";

import * as React from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Layers,
  Send,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsivePageContainer } from "@/components/responsive";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  guideline?: string;
  citations?: string[];
}

const SUGGESTED_QUERIES = [
  { label: "Summarize high-risk patients", text: "Summarize today's high-risk patients and their key clinical findings." },
  { label: "ACS differential diagnosis", text: "Evaluate differential diagnosis for acute chest pain with ST depression and elevated troponin." },
  { label: "Sepsis resuscitation protocol", text: "What is the SSC-2021 protocol for lactic acid 3.4 mmol/L with MAP < 65?" },
  { label: "KDIGO AKI criteria", text: "Check KDIGO stage 2 AKI criteria for creatinine 2.3 mg/dL rising from baseline 1.0 mg/dL." },
  { label: "Heart failure management", text: "Summarize ACC/AHA guideline-directed medical therapy for HFrEF with EF 35%." },
  { label: "Anticoagulation guidance", text: "When is anticoagulation indicated in atrial fibrillation? Assess CHA₂DS₂-VASc criteria." },
];

const DEMO_RESPONSES: Record<string, { content: string; guideline: string; citations: string[] }> = {
  default: {
    content:
      "Based on authorized clinical data and the HealthNova AI clinical knowledge base, I have cross-referenced the relevant clinical parameters.\n\nThis response synthesizes evidence from peer-reviewed guidelines. Please review all AI-generated content before clinical action — I operate strictly as a decision-support tool, not an autonomous diagnostic system.",
    guideline: "Hospital Standard Clinical Pathway — Critical Care Decision Support Protocol v2.1",
    citations: ["UpToDate Hospital Practice 2026", "AHA NSTE-ACS Standards 2022"],
  },
  sepsis: {
    content:
      "Per Surviving Sepsis Campaign SSC-2021:\n\n• Serum lactate >2.0 mmol/L with hypotension: immediate crystalloid fluid resuscitation at 30 mL/kg within 3 hours.\n• Re-assess hemodynamics and perfusion after resuscitation.\n• Target MAP ≥ 65 mmHg; urine output ≥ 0.5 mL/kg/h.\n• If refractory to fluids: vasopressors (norepinephrine first-line, MAP 65-70 mmHg target).\n• Obtain blood cultures before antibiotics; administer within 1 hour of sepsis recognition.",
    guideline: "Surviving Sepsis Campaign: International Guidelines 2021 (Grade 1B)",
    citations: ["Crit Care Med 2021;49(11):e1063-e1143", "KDIGO AKI Bundle 2012", "SSC Hour-1 Bundle 2018"],
  },
  chest: {
    content:
      "Per AHA/ACC 2022 Chest Pain Evaluation Guidelines:\n\n• Serial high-sensitivity cardiac troponin (hs-cTn) at 0h and 1h/2h for all patients with retrosternal chest pain.\n• ST depression > 1.0 mm in ≥2 contiguous leads: high-risk NSTE-ACS classification.\n• Immediate cardiology consult for refractory ischemia or hemodynamic instability.\n• Antiplatelet therapy (aspirin 325mg + P2Y12 inhibitor) if NSTE-ACS confirmed.\n• Risk stratify using GRACE 2.0 score to guide invasive vs. conservative strategy.",
    guideline: "AHA/ACC 2022 Guidelines for the Evaluation and Diagnosis of Chest Pain (Class I, Level A)",
    citations: ["Circulation 2022;144:e368-e454", "ESC NSTE-ACS Guidelines 2020", "JACC 2021 hs-cTn Algorithms"],
  },
  aki: {
    content:
      "Per KDIGO AKI Clinical Practice Guidelines 2012:\n\n• Stage 2 AKI: serum creatinine ≥2.0x baseline (or 1.5-1.9x within 7 days) OR urine output < 0.5 mL/kg/h for 12-23 hours.\n• Creatinine 2.3 mg/dL from baseline 1.0 mg/dL = 2.3x elevation → KDIGO Stage 2 AKI.\n• Management: identify and correct reversible causes (hypovolemia, nephrotoxins, obstruction).\n• Avoid nephrotoxic agents; optimize hemodynamics.\n• Consider renal replacement therapy if Stage 3 AKI with uremic complications.",
    guideline: "KDIGO AKI Clinical Practice Guidelines 2012 (Grade 1B)",
    citations: ["Kidney Int Suppl 2012;2:1–138", "JASN 2014 AKI Staging Validation", "AKIN Criteria 2007"],
  },
};

function getResponseForQuery(query: string) {
  const lower = query.toLowerCase();
  if (lower.includes("sepsis") || lower.includes("lactic") || lower.includes("map")) return DEMO_RESPONSES.sepsis;
  if (lower.includes("chest") || lower.includes("troponin") || lower.includes("st ") || lower.includes("acs")) return DEMO_RESPONSES.chest;
  if (lower.includes("aki") || lower.includes("creatinine") || lower.includes("kdigo") || lower.includes("kidney")) return DEMO_RESPONSES.aki;
  return DEMO_RESPONSES.default;
}

export default function DoctorAIAssistantPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello, Doctor. I'm your HealthNova AI Clinical Assistant.\n\nI can help you:\n• Summarize authorized patient risk data\n• Explain ML prediction results & SHAP drivers\n• Retrieve evidence-based clinical guidelines (SSC-2021, KDIGO, AHA/ACC)\n• Support differential diagnosis reasoning\n\nAll responses are advisory only — physician review is required before clinical action.",
      timestamp: new Date(),
      guideline: "HealthNova AI Clinical Boundary: Human-in-the-Loop Advisory Only. Not an Autonomous Diagnostic Instrument.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [expandedCitations, setExpandedCitations] = React.useState<Set<string>>(new Set());
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const sendMessage = React.useCallback((content: string) => {
    if (!content.trim()) return;
    const now = new Date();
    const userMsg: Message = { id: `user-${now.getTime()}`, role: "user", content, timestamp: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const resp = getResponseForQuery(content);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: resp.content,
        timestamp: new Date(),
        guideline: resp.guideline,
        citations: resp.citations,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 600);
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const toggleCitations = (id: string) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 flex items-center gap-2">
              HealthNova AI Clinical Assistant
              <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5">
                <Sparkles className="h-2.5 w-2.5" />
                RAG Verified
              </span>
            </h1>
            <p className="text-xs text-slate-500">Decision support only — not autonomous diagnosis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Disclaimer bar */}
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2 shrink-0">
        <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Clinical Governance Notice:</strong> AI responses must be reviewed by the treating physician before clinical action. This system is a SaMD Class II advisory tool.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "assistant" ? "bg-purple-100 border border-purple-200" : "bg-slate-200"
            }`}>
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-purple-700" />
              ) : (
                <User className="h-4 w-4 text-slate-600" />
              )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] space-y-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm"
                  : "bg-emerald-600 text-white rounded-tr-sm shadow-sm"
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">AI Response</span>
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.content}</p>
                <p className={`text-[11px] mt-2 ${msg.role === "assistant" ? "text-slate-400" : "text-emerald-200"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Guideline + citations */}
              {msg.role === "assistant" && msg.guideline && (
                <div className="pl-1">
                  <div className="rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-[11px] text-purple-700 flex items-start gap-1.5">
                    <Layers className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-500" />
                    <div className="flex-1">
                      <span>{msg.guideline}</span>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-1.5">
                          <button
                            onClick={() => toggleCitations(msg.id)}
                            className="flex items-center gap-0.5 text-[10px] text-purple-500 hover:text-purple-700 font-medium"
                          >
                            {expandedCitations.has(msg.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {msg.citations.length} references
                          </button>
                          {expandedCitations.has(msg.id) && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {msg.citations.map((c, i) => (
                                <span key={i} className="inline-block rounded-full bg-white border border-purple-200 px-2 py-0.5 text-[9px] font-medium text-purple-700">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-purple-700" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested queries */}
      {messages.length <= 1 && (
        <div className="border-t border-slate-100 bg-white px-5 py-3 shrink-0">
          <p className="text-[11px] text-slate-400 font-medium mb-2">Suggested clinical queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.text)}
                className="text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-all"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-5 py-4 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2.5"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about patients, predictions, clinical guidelines…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shrink-0 shadow-sm rounded-xl"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Consult</span>
          </Button>
        </form>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          AI advisory only · 21 CFR Part 11 audit trail enabled · Not for autonomous clinical decisions
        </p>
      </div>
    </div>
  );
}
