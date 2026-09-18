"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Calendar, Clock } from "lucide-react";
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
      // Optimistic revert or handled silently
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Card Image Container */}
      <Link href={`/blog/${article.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 block">
        <Image
          src="/landing-full.png"
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />
        {/* Category Badge Pill over Image */}
        <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold tracking-wider text-white uppercase shadow-xs">
          {article.category?.name || "Healthcare"}
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5 text-left justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-950 tracking-tight leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
            <Link href={`/blog/${article.slug}`}>
              {article.title}
            </Link>
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        {/* Bottom Meta & Bookmark */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-300 shrink-0 flex items-center justify-center font-bold text-[10px] text-slate-700">
              {article.author?.name ? article.author.name.slice(0, 2).toUpperCase() : "MD"}
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-900 truncate leading-tight">
                {article.author?.name || "Author"}
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {formattedDate} &bull; {article.reading_time_minutes || 5} min read
              </span>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            disabled={isBookmarking}
            aria-label={isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
            className={`touch-target p-1.5 rounded-lg border transition-colors shrink-0 ${
              isBookmarked
                ? "bg-teal-50 border-teal-200 text-teal-700"
                : "bg-white border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-teal-600" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
