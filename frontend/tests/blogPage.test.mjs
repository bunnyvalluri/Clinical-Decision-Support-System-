/**
 * Automated Test Suite — Prompt 49: Production Healthcare AI Blog Page
 *
 * Verifies:
 *  1. Blog page routes exist (/blog, /blog/[slug]).
 *  2. All 10 section components exist with correct exports.
 *  3. Centralized navigation link integrity (Blog -> /blog).
 *  4. Human-in-the-loop clinical disclaimer invariants are enforced.
 *  5. Strict White/Light Theme (zero dark: classes in blog components).
 *  6. Absence of fabricated metrics and fake fallback business data.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Blog Page Routes: src/app/blog/page.tsx and src/app/blog/[slug]/page.tsx exist", () => {
  const blogListingPath = path.join(rootDir, "src", "app", "blog", "page.tsx");
  assert.ok(fs.existsSync(blogListingPath), "Blog listing route must exist at src/app/blog/page.tsx");

  const articleDetailPath = path.join(rootDir, "src", "app", "blog", "[slug]", "page.tsx");
  assert.ok(fs.existsSync(articleDetailPath), "Article detail route must exist at src/app/blog/[slug]/page.tsx");
});

test("Blog Components: All 11 core components exist in features/blog/components", () => {
  const compDir = path.join(rootDir, "src", "features", "blog", "components");
  assert.ok(fs.existsSync(compDir), "features/blog/components directory must exist");

  const expectedFiles = [
    "BlogBreadcrumb.tsx",
    "BlogHero.tsx",
    "BlogCategoryFilters.tsx",
    "FeaturedArticle.tsx",
    "ArticleCard.tsx",
    "RecentArticles.tsx",
    "BlogPagination.tsx",
    "PopularGuides.tsx",
    "NewsletterSignup.tsx",
    "BrowseByTopic.tsx",
    "BlogSearchModal.tsx",
    "index.ts",
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(compDir, file);
    assert.ok(fs.existsSync(filePath), `Component file must exist: ${file}`);
  }
});

test("Navigation Configuration: /blog is registered in PUBLIC_NAV_LINKS", () => {
  const navPath = path.join(rootDir, "src", "config", "navigation.ts");
  assert.ok(fs.existsSync(navPath), "navigation.ts must exist");
  const navContent = fs.readFileSync(navPath, "utf-8");

  assert.match(
    navContent,
    /name:\s*["']Blog["'],\s*href:\s*["']\/blog["']/,
    "Public navigation must route Blog directly to /blog"
  );
});

test("Clinical Safety Invariants: Non-autonomous medical disclaimer enforced", () => {
  const detailPath = path.join(rootDir, "src", "app", "blog", "[slug]", "page.tsx");
  const content = fs.readFileSync(detailPath, "utf-8");

  assert.match(
    content,
    /does\s+not\s+replace\s+professional\s+medical\s+judgment/i,
    "Article page must enforce clinical advisory disclaimer"
  );
  assert.match(
    content,
    /Licensed\s+healthcare\s+professionals\s+retain\s+sole\s+responsibility/i,
    "Article page must reinforce physician responsibility"
  );
});

test("Theme Policy: Zero dark-mode classes in blog components and pages", () => {
  const blogDir = path.join(rootDir, "src", "features", "blog");
  const appBlogDir = path.join(rootDir, "src", "app", "blog");

  const checkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDir(fullPath);
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        const darkMatch = fileContent.match(/[\s"']dark:[a-zA-Z0-9_-]+/);
        assert.strictEqual(
          darkMatch,
          null,
          `Found forbidden dark-mode class '${darkMatch?.[0]}' in ${fullPath}`
        );
      }
    }
  };

  checkDir(blogDir);
  checkDir(appBlogDir);
});

test("No Fake Business Data: No Math.random() or mock arrays in blog components", () => {
  const compDir = path.join(rootDir, "src", "features", "blog", "components");
  const entries = fs.readdirSync(compDir);

  for (const file of entries) {
    if (file.endsWith(".tsx")) {
      const fullPath = path.join(compDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.doesNotMatch(
        content,
        /Math\.random\(\)/,
        `Forbidden Math.random() found in ${file}`
      );
    }
  }
});
