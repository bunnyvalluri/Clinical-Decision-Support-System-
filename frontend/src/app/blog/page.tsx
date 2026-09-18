"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import {
  BlogBreadcrumb,
  BlogHero,
  BlogCategoryFilters,
  FeaturedArticle,
  RecentArticles,
  BlogPagination,
  PopularGuides,
  NewsletterSignup,
  BrowseByTopic,
  BlogSearchModal,
} from "@/features/blog/components";
import {
  fetchArticles,
  fetchFeaturedArticle,
  fetchPopularGuides,
  fetchCategories,
} from "@/features/blog/services/blogService";
import { BlogArticle, BlogCategory } from "@/features/blog/types/blogTypes";

function BlogPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get("category") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<BlogArticle | null>(null);
  const [recentArticles, setRecentArticles] = useState<BlogArticle[]>([]);
  const [popularGuides, setPopularGuides] = useState<BlogArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Initial load: Categories, Featured, Popular Guides
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const [cats, feat, guides] = await Promise.all([
          fetchCategories(),
          fetchFeaturedArticle(),
          fetchPopularGuides(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setFeaturedArticle(feat);
          setPopularGuides(guides);
        }
      } catch {
        // Handled with graceful empty states
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Category & Pagination dynamic fetcher
  const loadArticles = useCallback(async (cat: string, page: number) => {
    setLoadingArticles(true);
    try {
      const res = await fetchArticles({
        category: cat === "all" ? undefined : cat,
        page: page,
        pageSize: 6,
        sort: "newest",
      });
      setRecentArticles(res.results || []);
      setTotalCount(res.count || 0);
    } catch {
      setRecentArticles([]);
      setTotalCount(0);
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    loadArticles(currentCategory, currentPage);
  }, [currentCategory, currentPage, loadArticles]);

  const handleSelectCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/blog?${params.toString()}`);
    // Smooth scroll back to articles header
    window.scrollTo({ top: 600, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Header */}
      <PublicNavbar />

      {/* 2. Breadcrumb */}
      <BlogBreadcrumb />

      <main id="main-content" className="flex-1">
        {/* 3. Blog Hero */}
        <BlogHero />

        {/* 4. Category Filters Bar */}
        <BlogCategoryFilters
          categories={categories}
          activeCategory={currentCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* 5. Featured Article (displayed on all or when viewing all categories) */}
        {currentCategory === "all" && currentPage === 1 && (
          <FeaturedArticle
            article={featuredArticle}
            loading={loadingInitial}
          />
        )}

        {/* 6. Recent Articles Grid */}
        <RecentArticles
          articles={recentArticles}
          loading={loadingArticles}
        />

        {/* 7. Pagination */}
        <BlogPagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={6}
          onPageChange={handlePageChange}
        />

        {/* 8. 3-Column Bottom Editorial Hub */}
        <section aria-label="Explore and subscribe" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Left: Popular Guides */}
            <PopularGuides
              guides={popularGuides}
              loading={loadingInitial}
            />

            {/* Middle: Stay Ahead in Healthcare Newsletter */}
            <NewsletterSignup />

            {/* Right: Browse by Topic */}
            <BrowseByTopic
              categories={categories}
              activeCategory={currentCategory}
              onSelectCategory={handleSelectCategory}
              loading={loadingInitial}
            />
          </div>
        </section>
      </main>

      {/* 9. Public Footer */}
      <PublicFooter />

      {/* Search Modal */}
      <BlogSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-sm font-semibold text-teal-700">
          Loading HealthNova AI Blog...
        </div>
      </div>
    }>
      <BlogPageContent />
    </Suspense>
  );
}
