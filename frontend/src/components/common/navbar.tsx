"use client";

import Link from "next/link";
import { Activity, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 tracking-tight text-base sm:text-lg">
                Clinical Decision Support
              </span>
            </Link>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Intelligent Patient Risk Level Prediction
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Neon & Upstash Live
            </Badge>
          </div>

          <button
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
              DR
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-medium text-zinc-200">Dr. Priya Sharma</p>
              <p className="text-zinc-500">Cardiology</p>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
