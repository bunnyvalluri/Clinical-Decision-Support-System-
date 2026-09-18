"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart2,
  ArrowRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SolutionsCTA() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Banner with soft teal waves background matching reference image */}
        <div className="relative rounded-3xl overflow-hidden border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-cyan-50/70 to-emerald-50/90 p-8 sm:p-12 lg:p-14 shadow-sm">
          {/* Subtle Decorative Curved Wave SVG */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 300"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,150 C300,50 600,250 1200,100 L1200,300 L0,300 Z"
                fill="url(#tealGradient)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Side: Icon & Copy */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              {/* Circular Bar Chart Icon Badge */}
              <div className="h-16 w-16 rounded-2xl bg-white border border-teal-200 shadow-md flex items-center justify-center text-teal-600 shrink-0">
                <BarChart2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 block">
                  READY TO GET STARTED?
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
                  Let&apos;s Build a Healthier Future Together
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl">
                  Discover how HealthNova AI can create value for your organization, support your clinical teams, and enhance patient outcomes.
                </p>
              </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link href="/about#faq" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-bold px-7 h-12 rounded-xl shadow-xs gap-2 text-sm"
                >
                  <span>Get in Touch</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/90 border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-white font-semibold px-6 h-12 rounded-xl gap-2 text-sm shadow-2xs"
                >
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <span>Request a Demo</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
