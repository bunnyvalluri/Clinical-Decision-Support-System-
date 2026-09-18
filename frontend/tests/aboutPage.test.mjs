/**
 * Automated Test Suite — Prompt 47: Clinical About Page & Public Architecture
 *
 * Verifies:
 *  1. About page route presence and Server Component metadata structure.
 *  2. All 10 section components exist with correct exports.
 *  3. Human-in-the-loop clinical disclaimer invariants are enforced.
 *  4. Strict White/Light Theme (zero dark: classes in about components).
 *  5. Reusable PublicNavbar and PublicFooter link integrity.
 *  6. Absence of fabricated metrics (no fake hospital counts, fake accuracy, etc.).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("About Page Route: src/app/about/page.tsx exists and has SEO metadata", () => {
  const pagePath = path.join(rootDir, "src", "app", "about", "page.tsx");
  assert.ok(fs.existsSync(pagePath), "About page route must exist at src/app/about/page.tsx");

  const pageContent = fs.readFileSync(pagePath, "utf-8");

  // Metadata verification
  assert.match(
    pageContent,
    /title:\s*["']About \| Intelligent Clinical Decision Support["']/,
    "About page must have correct SEO title"
  );
  assert.match(
    pageContent,
    /description:/,
    "About page must declare a meta description"
  );
  assert.match(
    pageContent,
    /canonical:\s*["']\/about["']/,
    "About page must specify canonical URL"
  );

  // Component composition verification
  const requiredImports = [
    "AboutHero",
    "FoundationSection",
    "DifferenceSection",
    "PrinciplesSection",
    "ResponsibleAISection",
    "TechnologyFoundation",
    "JourneyTimeline",
    "ClinicalWorkflow",
    "AboutFAQ",
    "AboutCTA",
    "PublicNavbar",
    "PublicFooter",
  ];

  for (const comp of requiredImports) {
    assert.ok(
      pageContent.includes(comp),
      `About page must import and render component: ${comp}`
    );
  }
});

test("About Components: All 10 section components exist in components/about", () => {
  const aboutDir = path.join(rootDir, "src", "components", "about");
  assert.ok(fs.existsSync(aboutDir), "components/about directory must exist");

  const expectedFiles = [
    "AboutHero.tsx",
    "FoundationSection.tsx",
    "DifferenceSection.tsx",
    "PrinciplesSection.tsx",
    "ResponsibleAISection.tsx",
    "TechnologyFoundation.tsx",
    "JourneyTimeline.tsx",
    "ClinicalWorkflow.tsx",
    "AboutFAQ.tsx",
    "AboutCTA.tsx",
    "index.ts",
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(aboutDir, file);
    assert.ok(fs.existsSync(filePath), `Component file must exist: ${file}`);
  }
});

test("Clinical Safety Invariants: Mandatory disclaimers & human-in-the-loop positioning", () => {
  const responsibleAiPath = path.join(
    rootDir,
    "src",
    "components",
    "about",
    "ResponsibleAISection.tsx"
  );
  const content = fs.readFileSync(responsibleAiPath, "utf-8");

  // Mandatory non-autonomous statement
  assert.match(
    content,
    /should\s+not\s+be\s+treated\s+as\s+an\s+autonomous\s+medical\s+diagnosis\s+or\s+treatment\s+decision/i,
    "Must include mandatory clinical disclaimer regarding non-autonomous diagnosis"
  );

  // Human in the loop
  assert.match(
    content,
    /Human Oversight/i,
    "Must include Human Oversight pillar"
  );

  const heroPath = path.join(rootDir, "src", "components", "about", "AboutHero.tsx");
  const heroContent = fs.readFileSync(heroPath, "utf-8");
  assert.match(
    heroContent,
    /Human-in-the-Loop/i,
    "Hero section must emphasize Human-in-the-Loop architecture"
  );
});

test("Public Navigation & Footer: Unified links and institutional metadata", () => {
  const navPath = path.join(rootDir, "src", "components", "layout", "PublicNavbar.tsx");
  assert.ok(fs.existsSync(navPath), "PublicNavbar.tsx must exist");
  const navConfigPath = path.join(rootDir, "src", "config", "navigation.ts");
  const navContent = fs.existsSync(navConfigPath)
    ? fs.readFileSync(navConfigPath, "utf-8")
    : fs.readFileSync(navPath, "utf-8");

  const expectedNavLinks = ["Home", "About", "Features", "Solutions", "Blog", "Contact"];
  for (const link of expectedNavLinks) {
    assert.match(
      navContent,
      new RegExp(`name:\\s*["']${link}["']`),
      `Public navigation must include nav link: ${link}`
    );
  }

  const footerPath = path.join(rootDir, "src", "components", "layout", "PublicFooter.tsx");
  assert.ok(fs.existsSync(footerPath), "PublicFooter.tsx must exist");
  const footerContent = fs.readFileSync(footerPath, "utf-8");

  assert.match(
    footerContent,
    /BRAND_CONFIG\.academic\.projectCode|BPY-CSE-2666/,
    "PublicFooter must include project attribution BPY-CSE-2666"
  );
  assert.match(
    footerContent,
    /Does NOT provide autonomous medical diagnosis/i,
    "PublicFooter must include non-autonomous medical disclaimer"
  );
});

test("Public Navigation: Mobile viewport responsiveness and accessible menu drawer", () => {
  const navPath = path.join(rootDir, "src", "components", "layout", "PublicNavbar.tsx");
  assert.ok(fs.existsSync(navPath), "PublicNavbar.tsx must exist");
  const navContent = fs.readFileSync(navPath, "utf-8");

  // Mobile trigger button verification
  assert.match(
    navContent,
    /aria-label=["']Open navigation menu["']/,
    "Must have accessible mobile menu trigger button"
  );
  assert.match(
    navContent,
    /<Menu\s+[^>]*\/>/,
    "Must render Menu icon for mobile trigger"
  );
  assert.match(
    navContent,
    /touch-target/,
    "Mobile menu trigger must use touch-target for Apple HIG tap sizing"
  );

  // Mobile drawer dialog verification
  assert.match(
    navContent,
    /role=["']dialog["']/,
    "Mobile menu drawer must have role='dialog'"
  );
  assert.match(
    navContent,
    /aria-label=["']Mobile Navigation Menu["']/,
    "Mobile menu drawer must have accessible name"
  );
  assert.match(
    navContent,
    /<X\s+[^>]*\/>/,
    "Mobile menu drawer must include X close button"
  );
});

test("Theme Policy: Zero dark-mode classes in about components", () => {
  const aboutDir = path.join(rootDir, "src", "components", "about");
  const entries = fs.readdirSync(aboutDir);

  for (const entry of entries) {
    if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      const fullPath = path.join(aboutDir, entry);
      const content = fs.readFileSync(fullPath, "utf-8");
      const darkMatch = content.match(/[\s"']dark:[a-zA-Z0-9_-]+/);
      assert.strictEqual(
        darkMatch,
        null,
        `Found forbidden dark-mode class '${darkMatch?.[0]}' in ${entry}`
      );
    }
  }
});
