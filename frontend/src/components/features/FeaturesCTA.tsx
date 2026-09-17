import React from "react";
import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturesCTA() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-50 border border-slate-200/90 p-8 sm:p-12 lg:p-16 text-center shadow-xs relative overflow-hidden">
          {/* Subtle background decoration */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-teal-100/40 blur-3xl"
          />

          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              SEE THE DIFFERENCE
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              See Intelligent Clinical Decision Support in Action
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Explore how patient risk prediction, real-time healthcare data, and explainable
              machine learning can support better-informed clinical workflows.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-sm gap-2 text-sm h-12"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:support@healthnova.ai">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-white font-semibold px-8 text-sm h-12 gap-2"
                >
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>Contact Us</span>
                </Button>
              </a>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Institutional Deployment &bull; 21 CFR Part 11 &amp; HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
