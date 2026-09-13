"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, HeartPulse, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm p-0.5">
            <Image
              src="/logo.png"
              alt="PatientRisk Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain rounded-lg"
              priority
            />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">PatientRisk</span>
            <span className="text-[10px] uppercase font-mono font-semibold text-sky-600 tracking-wider">Predict • Prevent • Support</span>
          </div>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Clinician Password
        </h2>
        <p className="text-xs text-slate-500">
          Enter your registered hospital email address to receive secure reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reset Link Dispatched</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If an authorized staff profile exists for <span className="text-emerald-700 font-mono font-semibold">{email}</span>,
                a single-use cryptographic reset link has been dispatched via hospital secure mail.
              </p>
              <div className="pt-3 space-y-2">
                <Link href="/reset-password?token=demo-token" className="block">
                  <Button variant="default" size="sm" className="w-full text-xs">
                    Proceed with Demo Reset Token
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-slate-200">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Return to Clinician Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Hospital Staff Email"
                type="email"
                placeholder="e.g. dr.vance@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="h-4 w-4" />}
                required
              />

              <Button
                type="submit"
                variant="default"
                isLoading={isLoading}
                className="w-full gap-2 text-xs shadow-sm mt-2"
              >
                Send Password Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
