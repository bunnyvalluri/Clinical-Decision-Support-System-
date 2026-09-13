"use client";

import Link from "next/link";
import { Activity, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Clinical Decision Support
              </span>
            </Link>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              Intelligent Patient Risk Level Prediction
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Neon & Upstash Live
            </Badge>
          </div>

          <button
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
              DR
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-bold text-slate-900">Dr. Priya Sharma</p>
              <p className="text-slate-500 font-medium">Cardiology</p>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
