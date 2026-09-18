"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ShieldCheck,
  Share2,
  Bookmark,
  ArrowLeft,
  Check,
  AlertTriangle,
} from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { BlogBreadcrumb } from "@/features/blog/components/BlogBreadcrumb";
import { ArticleCard } from "@/features/blog/components/ArticleCard";
import { fetchArticleBySlug, toggleBookmark } from "@/features/blog/services/blogService";
import { BlogArticle } from "@/features/blog/types/blogTypes";
import { Button } from "@/components/ui/button";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchArticleBySlug(slug);
        if (isMounted) {
          setArticle(data);
          setIsBookmarked(data?.is_bookmarked || false);
        }
      } catch {
        if (isMounted) setArticle(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookmark = async () => {
    if (!article) return;
    try {
      const res = await toggleBookmark(article.id);
      setIsBookmarked(res.bookmarked);
    } catch {
      // Handled silently
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <PublicNavbar />
        <div className="flex-1 container mx-auto max-w-4xl px-4 py-16 space-y-6 animate-pulse">
          <div className="h-6 w-32 bg-slate-100 rounded-full" />
          <div className="h-10 w-4/5 bg-slate-100 rounded-xl" />
          <div className="h-5 w-1/2 bg-slate-100 rounded" />
          <div className="aspect-[16/9] bg-slate-100 rounded-3xl" />
          <div className="space-y-3 pt-6">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <PublicNavbar />
        <div className="flex-1 container mx-auto max-w-xl px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">Article Not Found</h1>
          <p className="text-sm text-slate-500">
            The requested article could not be located or has been archived.
          </p>
          <div className="pt-2">
            <Link href="/blog">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-bold text-xs">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Blog</span>
              </Button>
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Published";

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased">
      <PublicNavbar />
      <BlogBreadcrumb articleTitle={article.title} />

      <article className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Article Header Meta */}
        <div className="space-y-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {article.category?.name || "Healthcare"}
            </span>
            {article.medical_review_status === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Clinically Verified</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {article.excerpt}
          </p>

          {/* Author & Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                {article.author?.name ? article.author.name.slice(0, 2).toUpperCase() : "DR"}
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 leading-tight">
                  {article.author?.name}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {article.author?.role_title}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.reading_time_minutes} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Share & Bookmark buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBookmark}
                aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
                className={`touch-target inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  isBookmarked
                    ? "bg-teal-50 border-teal-200 text-teal-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-teal-600" : ""}`} />
                <span>{isBookmarked ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share article link"
                className="touch-target inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-slate-500" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Cover Image */}
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
          <Image
            src="/landing-hero.png"
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
        </div>

        {/* Mandatory Clinical Disclaimer Banner */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Important Clinical &amp; Educational Notice</span>
            <p className="leading-relaxed">
              Health information provided on this platform is for educational and clinical decision-support research. It does not replace professional medical judgment, diagnosis, or treatment. Licensed healthcare professionals retain sole responsibility for all patient evaluations.
            </p>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="prose prose-slate max-w-none text-left leading-relaxed space-y-5 text-slate-800">
          <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
            {article.content}
          </div>
        </div>

        {/* Article Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-slate-200 text-left">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-bold">
              Related Topics
            </span>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div className="pt-10 border-t border-slate-200 text-left space-y-6">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {article.related_articles.map((rel) => (
                <ArticleCard key={rel.id} article={rel} />
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog Button */}
        <div className="pt-8 text-center">
          <Link href="/blog">
            <Button variant="outline" className="gap-2 text-xs font-semibold border-slate-300">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Articles</span>
            </Button>
          </Link>
        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
