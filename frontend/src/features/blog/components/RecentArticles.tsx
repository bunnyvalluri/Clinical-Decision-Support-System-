"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { BlogArticle } from "../types/blogTypes";
import { ArticleCard } from "./ArticleCard";

interface RecentArticlesProps {
  articles: BlogArticle[];
  loading?: boolean;
}

export function RecentArticles({ articles, loading }: RecentArticlesProps) {
  return (
    <section aria-label="Recent Articles" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
          Recent Articles
        </h2>
        <Link
          href="/blog"
          className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors"
        >
          <span>View All Articles</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 animate-pulse">
              <div className="aspect-[16/10] bg-slate-100 rounded-xl" />
              <div className="space-y-2">
                <div className="h-5 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="h-6 w-24 bg-slate-100 rounded" />
                <div className="h-6 w-6 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No published articles yet</h3>
          <p className="text-xs text-slate-500">
            No articles match the selected category. Try selecting &quot;All&quot; or check back soon.
          </p>
        </div>
      )}

      {/* 3-Column Card Grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
