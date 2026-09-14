"use client";

import * as React from "react";
import { Bot, Info, Send, Sparkles, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED = [
  "Summarize today's high-risk patients",
  "Explain the latest risk prediction for Patient #MRN-3847",
  "What are the key risk factors driving this prediction?",
  "Retrieve clinical guidelines for acute coronary syndrome",
];

const DEMO_RESPONSE =
  "Based on the authorized patient data, I can provide a summary. This assessment is generated from the approved ML model outputs and clinical knowledge base. All AI-generated content must be reviewed by the treating physician before clinical action.\n\nPlease note: I cannot provide autonomous medical diagnosis. My role is to synthesize available information to support your clinical decision-making.";

export default function DoctorAIAssistantPage() {
  const [messages, setMessages] = React.useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello, Doctor. I'm your clinical AI assistant. I can help you summarize authorized patient information, explain prediction results, retrieve clinical knowledge, and support your decision-making.\n\nI cannot provide autonomous medical diagnoses. All responses are for clinical decision support only.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const sendMessage = React.useCallback((content: string) => {
    if (!content.trim()) return;
    const now = new Date();
    const userMsg: Message = { id: `msg-user-${now.getTime()}`, role: "user", content, timestamp: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responseTime = new Date();
      const aiMsg: Message = {
        id: `msg-ai-${responseTime.getTime()}`,
        role: "assistant",
        content: DEMO_RESPONSE,
        timestamp: responseTime,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Clinical AI Assistant</h1>
            <p className="text-xs text-slate-500">Decision support — not autonomous diagnosis</p>
          </div>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Sparkles className="h-3 w-3 mr-1" />
          Authorized Access
        </Badge>
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2 shrink-0">
        <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700">
          AI responses are for clinical decision support only. All outputs require physician review before clinical action.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant" ? "bg-emerald-100" : "bg-slate-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-emerald-700" />
              ) : (
                <User className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                  : "bg-emerald-600 text-white rounded-tr-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">AI Response</span>
                </div>
              )}
              <p className="whitespace-pre-line">{msg.content}</p>
              <p className={`text-xs mt-2 ${msg.role === "assistant" ? "text-slate-400" : "text-emerald-200"}`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 shrink-0">
          <p className="text-xs text-slate-400 mb-2 font-medium">Suggested queries:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-3 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about patients, predictions, clinical guidelines…"
            className="flex-1 bg-slate-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
