/**
 * Frontend Service Layer for HealthNova AI Blog Platform.
 * Communicates with authoritative Django REST Framework endpoints.
 */
import {
  BlogArticle,
  BlogCategory,
  BlogPaginationResponse,
  BlogSearchResult,
  NewsletterResponse,
} from "../types/blogTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/blog`
  : "/api/v1/blog";

export interface ArticleQueryParams {
  category?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: "newest" | "oldest" | "popular";
}

export async function fetchArticles(
  params: ArticleQueryParams = {}
): Promise<BlogPaginationResponse> {
  const query = new URLSearchParams();
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  if (params.search) query.set("q", params.search);
  if (params.sort) query.set("sort", params.sort);

  const res = await fetch(`${API_BASE}/articles/?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch articles: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const res = await fetch(`${API_BASE}/articles/${encodeURIComponent(slug)}/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch article: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchFeaturedArticle(): Promise<BlogArticle | null> {
  const res = await fetch(`${API_BASE}/featured/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.featured || null;
}

export async function fetchPopularGuides(): Promise<BlogArticle[]> {
  const res = await fetch(`${API_BASE}/guides/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function fetchCategories(): Promise<BlogCategory[]> {
  const res = await fetch(`${API_BASE}/categories/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function searchArticles(query: string): Promise<BlogSearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search/?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function subscribeNewsletter(email: string): Promise<NewsletterResponse> {
  const res = await fetch(`${API_BASE}/newsletter/subscribe/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.errors?.email?.[0] || data.message || "Subscription failed";
    return { success: false, status: "error", message: errorMsg };
  }
  return data;
}

export async function toggleBookmark(articleId: string): Promise<{ bookmarked: boolean }> {
  const res = await fetch(`${API_BASE}/articles/${articleId}/bookmark/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Unable to update bookmark");
  }
  return res.json();
}
