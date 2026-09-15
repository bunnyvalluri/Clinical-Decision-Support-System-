"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, HeartPulse, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill out both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters in compliance with hospital security policy.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm p-0.5">
              <Image
                src="/logo.png"
                alt="HealthNova AI Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">HealthNova AI</span>
              <span className="text-[10px] uppercase font-mono font-semibold text-teal-600 tracking-wider">Clinical Decision Support</span>
            </div>
          </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Set New Password
        </h2>
        <p className="text-xs text-slate-500">
          Establish a new secure credential for your clinical workstation access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Reset Successfully</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your hospital credentials have been updated. Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="error" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                prefixIcon={<Lock className="h-4 w-4" />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefixIcon={<Lock className="h-4 w-4" />}
                required
              />

              <Button
                type="submit"
                variant="default"
                isLoading={isLoading}
                className="w-full gap-2 text-xs shadow-sm mt-2"
              >
                Update Password & Return to Login
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Cancel and Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
