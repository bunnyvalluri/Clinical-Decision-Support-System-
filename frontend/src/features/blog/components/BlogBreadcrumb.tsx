"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BlogBreadcrumbProps {
  articleTitle?: string;
}

export function BlogBreadcrumb({ articleTitle }: BlogBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <ol className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-slate-500 font-medium">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-teal-700 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
        </li>
        <li className="flex items-center text-slate-400">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        {articleTitle ? (
          <>
            <li>
              <Link
                href="/blog"
                className="hover:text-teal-700 transition-colors"
              >
                Blog
              </Link>
            </li>
            <li className="flex items-center text-slate-400">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li aria-current="page" className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
              {articleTitle}
            </li>
          </>
        ) : (
          <li aria-current="page" className="font-semibold text-teal-800">
            Blog
          </li>
        )}
      </ol>
    </nav>
  );
}
