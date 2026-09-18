/**
 * TypeScript definitions for HealthNova AI Blog & Educational Platform.
 * Aligned strictly with Django REST Framework backend models.
 */

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  order: number;
  article_count: number;
}

export interface BlogAuthor {
  id: string;
  name: string;
  role_title: string;
  avatar_url: string;
  bio: string;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  featured_image: string;
  category: BlogCategory;
  author: BlogAuthor;
  tags: string[];
  is_featured: boolean;
  is_guide: boolean;
  reading_time_minutes: number;
  medical_review_status?: "PENDING" | "VERIFIED" | "NOT_APPLICABLE";
  reviewed_at?: string | null;
  views_count: number;
  published_at: string | null;
  updated_at?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  is_bookmarked?: boolean;
  related_articles?: BlogArticle[];
}

export interface BlogPaginationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogArticle[];
}

export interface BlogSearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category_name: string;
  category_slug: string;
  author_name: string;
  reading_time_minutes: number;
  published_at: string | null;
}

export interface NewsletterResponse {
  success: boolean;
  status: "subscribed" | "already_subscribed" | "resubscribed" | "error";
  message: string;
}
