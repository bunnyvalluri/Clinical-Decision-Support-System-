"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Calendar, Clock, ArrowRight } from "lucide-react";
import { BlogArticle } from "../types/blogTypes";
import { toggleBookmark } from "../services/blogService";

interface ArticleCardProps {
  article: BlogArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(article.is_bookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Published";

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarking(true);
    try {
      const res = await toggleBookmark(article.id);
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked((prev) => !prev);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400 hover:-translate-y-1.5 transition-all duration-300">
      {/* Card Image Container */}
      <Link href={`/blog/${article.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 block">
        <Image
          src={article.featured_image || "/landing-full.png"}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-104 transition-transform duration-500"
          loading="lazy"
        />
        {/* Category Badge Pill over Image */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md text-[10px] font-mono font-bold tracking-wider text-teal-300 border border-white/10 uppercase shadow-xs">
          {article.category?.name || "Healthcare AI"}
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5.5 text-left justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Tags preview */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 2).map((t) => (
                <span key={t} className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <h3 className="text-base font-bold text-slate-950 tracking-tight leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
            <Link href={`/blog/${article.slug}`}>
              {article.title}
            </Link>
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
            {article.excerpt}
          </p>
        </div>

        {/* Bottom Meta & Bookmark */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-teal-50 to-emerald-50 border border-teal-200 text-teal-700 shrink-0 flex items-center justify-center font-bold text-[11px] shadow-2xs">
              {article.author?.name ? article.author.name.slice(0, 2).toUpperCase() : "VA"}
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-900 truncate leading-tight">
                {article.author?.name || "Dr. Vadla Abhinay, MD"}
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {formattedDate} &bull; {article.reading_time_minutes || 5}m
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Read Arrow Button */}
            <Link
              href={`/blog/${article.slug}`}
              aria-label={`Read article: ${article.title}`}
              className="p-1.5 text-slate-400 group-hover:text-teal-600 transition-colors"
            >
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={handleBookmark}
              disabled={isBookmarking}
              aria-label={isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                isBookmarked
                  ? "bg-teal-50 border-teal-200 text-teal-700 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-teal-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
