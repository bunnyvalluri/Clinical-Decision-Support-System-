"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, User, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_MESSAGES = [
  {
    id: "m-1",
    sender: "Dr. Elena Vance, MD",
    is_patient: false,
    timestamp: "Yesterday, 02:15 PM",
    text: "Eleanor, your 30-day vitals trend looks consistent. Keep up with the daily sodium restriction and let us know if any dizziness occurs.",
  },
  {
    id: "m-2",
    sender: "Eleanor Ward",
    is_patient: true,
    timestamp: "Yesterday, 03:20 PM",
    text: "Thank you Dr. Vance! I recorded 134/86 this morning and have been walking 25 minutes every morning without chest tightness.",
  },
  {
    id: "m-3",
    sender: "Dr. Elena Vance, MD",
    is_patient: false,
    timestamp: "Yesterday, 04:00 PM",
    text: "Excellent progress. We'll do a routine check of your resting ECG during Wednesday's clinic visit.",
  },
];

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.conversationId as string;
  const [messages, setMessages] = React.useState(INITIAL_MESSAGES);
  const [newText, setNewText] = React.useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const msg = {
      id: `m-${Date.now()}`,
      sender: "Eleanor Ward",
      is_patient: true,
      timestamp: "Just now",
      text: newText.trim(),
    };
    setMessages([...messages, msg]);
    setNewText("");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/user/messages")} className="text-xs gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Messages
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm flex flex-col h-[650px]">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Dr. Elena Vance, MD</h2>
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px]">
                Attending Cardiologist
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Subject: 30-Day Ambulatory Blood Pressure Review</p>
          </div>
          <div className="text-xs text-emerald-700 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> HIPAA Audited
          </div>
        </CardHeader>

        {/* Message Thread */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.is_patient ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-slate-700">{m.sender}</span>
                <span className="text-[10px] text-slate-400">{m.timestamp}</span>
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                  m.is_patient
                    ? "bg-teal-600 text-white rounded-tr-none"
                    : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </CardContent>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Type your message to Dr. Elena Vance..."
              className="text-xs bg-white"
            />
            <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5">
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
