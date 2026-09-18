"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogArticle } from "../types/blogTypes";

interface FeaturedArticleProps {
  article: BlogArticle | null;
  loading?: boolean;
}

export function FeaturedArticle({ article, loading }: FeaturedArticleProps) {
  if (loading) {
    return (
      <section aria-label="Featured Story" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 aspect-[16/10] bg-slate-100 rounded-2xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
            <div className="h-8 w-3/4 bg-slate-100 rounded-lg" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
            <div className="h-10 w-36 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section aria-label="Featured Story" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Featured stories coming soon</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Our clinical and research teams are preparing in-depth analyses on explainable AI, cardiovascular telemetry, and digital health.
          </p>
        </div>
      </section>
    );
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Published";

  return (
    <section aria-label="Featured Story" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="group rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left Side: Large Article Image */}
        <div className="lg:col-span-6 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
          <Image
            src="/landing-hero.png"
            alt={article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover group-hover:scale-102 transition-transform duration-500"
            priority
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-[11px] font-bold text-teal-800 border border-slate-200/60 shadow-2xs">
            {article.category?.name || "Featured"}
          </div>
        </div>

        {/* Right Side: Article Metadata & Actions */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-mono font-bold tracking-wider text-teal-800 uppercase">
            FEATURED
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black text-slate-950 tracking-tight leading-snug group-hover:text-teal-700 transition-colors">
            <Link href={`/blog/${article.slug}`}>
              {article.title}
            </Link>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          {/* Author & Reading Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center font-bold text-xs text-slate-700">
                {article.author?.name ? article.author.name.slice(0, 2).toUpperCase() : "DR"}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {article.author?.name || "Clinical Intelligence Team"}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.reading_time_minutes || 5} min read
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/blog/${article.slug}`}>
              <Button className="bg-[#451219] hover:bg-[#5e1923] text-white font-bold text-xs gap-2 px-4 py-2 rounded-xl shadow-xs transition-colors">
                <span>Read Article</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
