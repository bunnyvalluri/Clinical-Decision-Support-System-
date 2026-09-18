"use client";

import React, { useState } from "react";
import { Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "../services/blogService";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await subscribeNewsletter(email);
      if (res.status === "subscribed" || res.status === "resubscribed") {
        setStatus("success");
        setMessage(res.message || "You're subscribed to HealthNova AI updates.");
        setEmail("");
      } else if (res.status === "already_subscribed") {
        setStatus("already");
        setMessage("You're already on our research distribution list.");
      } else {
        setStatus("error");
        setMessage(res.message || "Unable to complete subscription.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-teal-200/90 bg-gradient-to-b from-teal-50/90 to-emerald-50/60 p-6 sm:p-7 text-center shadow-xs h-full">
      <div className="space-y-4">
        {/* Envelope Icon */}
        <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <Mail className="h-5 w-5" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-950 tracking-tight">
            Stay Ahead in Healthcare
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
            Get the latest articles, research and insights delivered directly to your inbox.
          </p>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5 pt-2">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            required
            aria-label="Email address for healthcare newsletter"
            className="h-10 text-xs bg-white border-slate-200 rounded-xl placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full h-10 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Subscribing...</span>
              </span>
            ) : (
              <span>Subscribe</span>
            )}
          </Button>
        </form>

        {/* Feedback Message States */}
        {status === "success" && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl animate-in fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === "already" && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-100/80 px-3 py-1.5 rounded-xl animate-in fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl animate-in fade-in">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center justify-center gap-1.5 pt-4 text-[11px] text-slate-500 font-medium">
        <Lock className="h-3 w-3 text-slate-400 shrink-0" />
        <span>We respect your privacy. No spam.</span>
      </div>
    </div>
  );
}
