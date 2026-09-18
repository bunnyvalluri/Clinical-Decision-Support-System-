"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { BlogArticle } from "../types/blogTypes";

interface PopularGuidesProps {
  guides: BlogArticle[];
  loading?: boolean;
}

export function PopularGuides({ guides, loading }: PopularGuidesProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs h-full justify-between space-y-5">
      <div>
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <BookOpen className="h-4 w-4 text-teal-600" />
          <h3 className="text-base font-bold text-slate-950 tracking-tight">
            Popular Guides
          </h3>
        </div>

        {loading && (
          <div className="space-y-4 pt-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && guides.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center">
            Guides will appear here when published.
          </p>
        )}

        {!loading && guides.length > 0 && (
          <div className="space-y-3.5 pt-4">
            {guides.map((guide) => {
              const formattedDate = guide.published_at
                ? new Date(guide.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Published";

              return (
                <Link
                  key={guide.id}
                  href={`/blog/${guide.slug}`}
                  className="group flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                >
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <Image
                      src={guide.featured_image || "/landing-full.png"}
                      alt={guide.title}
                      fill
                      sizes="48px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                      {guide.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
                      <span>{formattedDate}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {guide.reading_time_minutes || 5} min
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 text-right">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors"
        >
          <span>View All Guides</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
