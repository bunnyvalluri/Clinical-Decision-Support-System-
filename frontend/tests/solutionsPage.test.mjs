/**
 * Automated Test Suite — Production-Grade Healthcare Solutions Page
 *
 * Verifies:
 *  1. Solutions page route presence and SEO metadata structure.
 *  2. All 18 solutions section components exist with correct exports.
 *  3. Centralized navigation configuration in src/config/navigation.ts (/solutions active link).
 *  4. Strict White/Light Theme (zero dark: classes in solutions components and route).
 *  5. Clinical safety invariants (human-in-the-loop, non-autonomous diagnosis, readable disclaimers).
 *  6. Real results & impact strip (Dr. Michael Chen CMO quote, 3 metrics, institutional partners).
 *  7. Accessibility attributes (ARIA tabs, accordion aria-expanded, semantic main landmark).
 *  8. Comprehensive FAQ coverage (all 10 questions answered).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Solutions Page Route: src/app/solutions/page.tsx exists and has SEO metadata", () => {
  const pagePath = path.join(rootDir, "src", "app", "solutions", "page.tsx");
  assert.ok(fs.existsSync(pagePath), "Solutions page route must exist at src/app/solutions/page.tsx");

  const pageContent = fs.readFileSync(pagePath, "utf-8");

  // Metadata verification
  assert.match(
    pageContent,
    /title:\s*["']Healthcare AI Solutions \| HealthNova AI["']/,
    "Solutions page must have correct SEO title"
  );
  assert.match(
    pageContent,
    /description:/,
    "Solutions page must declare a meta description"
  );
  assert.match(
    pageContent,
    /canonical:\s*["']\/solutions["']/,
    "Solutions page must specify canonical URL"
  );
  assert.match(
    pageContent,
    /application\/ld\+json/,
    "Solutions page must embed Schema.org JSON-LD structured data"
  );

  // Reuses PublicNavbar and PublicFooter
  assert.match(pageContent, /<PublicNavbar\s*\/>/, "Solutions page must reuse PublicNavbar");
  assert.match(pageContent, /<PublicFooter\s*\/>/, "Solutions page must reuse PublicFooter");
  assert.match(pageContent, /id=["']main-content["']/, "Solutions page must have main landmark with id='main-content'");
});

test("Solutions Feature Components: All 18 modular section components exist and export correctly", () => {
  const componentsDir = path.join(rootDir, "src", "features", "solutions", "components");
  assert.ok(fs.existsSync(componentsDir), "Solutions components directory must exist");

  const requiredComponents = [
    "SolutionsHero",
    "SolutionsAudienceStrip",
    "CoreSolutions",
    "IndustrySolutions",
    "RoleSolutionsTabs",
    "HealthcareIntelligenceFlow",
    "SolutionsRealResults",
    "TrustedPartners",
    "AIIntelligenceSection",
    "ResponsibleSafetySection",
    "SecurityPrivacySection",
    "RealtimeIntelligenceSection",
    "SolutionComparison",
    "HealthcareWorkflowJourney",
    "SolutionBenefits",
    "ExampleWorkflows",
    "SolutionsCTA",
    "SolutionsFAQ",
  ];

  for (const componentName of requiredComponents) {
    const filePath = path.join(componentsDir, `${componentName}.tsx`);
    assert.ok(fs.existsSync(filePath), `Component file ${componentName}.tsx must exist`);
  }

  // Check barrel index
  const indexPath = path.join(componentsDir, "index.ts");
  assert.ok(fs.existsSync(indexPath), "Barrel index.ts must exist");
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  for (const componentName of requiredComponents) {
    assert.match(
      indexContent,
      new RegExp(`export \\{ ${componentName} \\}`),
      `Barrel index.ts must export ${componentName}`
    );
  }

  // Check components/solutions/index.ts re-export
  const reexportPath = path.join(rootDir, "src", "components", "solutions", "index.ts");
  assert.ok(fs.existsSync(reexportPath), "components/solutions/index.ts re-export must exist");
});

test("Navigation Configuration: /solutions is registered in PUBLIC_NAV_LINKS", () => {
  const navConfigPath = path.join(rootDir, "src", "config", "navigation.ts");
  assert.ok(fs.existsSync(navConfigPath), "navigation.ts must exist");

  const navContent = fs.readFileSync(navConfigPath, "utf-8");
  assert.match(
    navContent,
    /name:\s*["']Solutions["'],\s*href:\s*["']\/solutions["']/,
    "Solutions link in PUBLIC_NAV_LINKS must route to /solutions"
  );
});

test("Strict White/Light Theme: Zero dark: classes across all Solutions files", () => {
  const componentsDir = path.join(rootDir, "src", "features", "solutions", "components");
  const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

  files.push(path.join("..", "..", "..", "app", "solutions", "page.tsx"));

  for (const file of files) {
    const filePath = file.includes("app") ? path.join(rootDir, "src", "app", "solutions", "page.tsx") : path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const darkMatches = content.match(/\bdark:[a-zA-Z0-9_\-\/]+/g);
    assert.strictEqual(
      darkMatches,
      null,
      `File ${file} contains forbidden dark: classes: ${darkMatches ? darkMatches.join(", ") : ""}`
    );
  }
});

test("Clinical Governance & Non-Autonomous Invariant: Disclaimers present in key components", () => {
  const heroPath = path.join(rootDir, "src", "features", "solutions", "components", "SolutionsHero.tsx");
  const heroContent = fs.readFileSync(heroPath, "utf-8");
  assert.match(
    heroContent,
    /Clinical Decision Support Invariant|Licensed healthcare professionals retain/i,
    "SolutionsHero must contain clinical decision support disclaimer"
  );

  const flowPath = path.join(rootDir, "src", "features", "solutions", "components", "HealthcareIntelligenceFlow.tsx");
  const flowContent = fs.readFileSync(flowPath, "utf-8");
  assert.match(
    flowContent,
    /AI supports healthcare professionals\. It does not replace them/i,
    "HealthcareIntelligenceFlow must state that AI supports and does not replace clinicians"
  );

  const safetyPath = path.join(rootDir, "src", "features", "solutions", "components", "ResponsibleSafetySection.tsx");
  const safetyContent = fs.readFileSync(safetyPath, "utf-8");
  assert.match(
    safetyContent,
    /Clinical Responsibility Standard|adjunct clinical intelligence tool/i,
    "ResponsibleSafetySection must emphasize human clinician authority"
  );
});

test("Solutions Real Results & Impact: Clinician quote, metrics and partner verification", () => {
  const resultsPath = path.join(rootDir, "src", "features", "solutions", "components", "SolutionsRealResults.tsx");
  const resultsContent = fs.readFileSync(resultsPath, "utf-8");

  assert.match(resultsContent, /Dr\. Michael Chen/, "SolutionsRealResults must feature Dr. Michael Chen");
  assert.match(resultsContent, /32%/, "SolutionsRealResults must feature 32% reduction");
  assert.match(resultsContent, /2,500\+/, "SolutionsRealResults must feature 2,500+ patients");
  assert.match(resultsContent, /6 months/, "SolutionsRealResults must feature 6 months time metric");

  const partnersPath = path.join(rootDir, "src", "features", "solutions", "components", "TrustedPartners.tsx");
  const partnersContent = fs.readFileSync(partnersPath, "utf-8");

  assert.match(partnersContent, /Mayo Clinic/, "TrustedPartners must include Mayo Clinic");
  assert.match(partnersContent, /Cleveland Clinic/, "TrustedPartners must include Cleveland Clinic");
  assert.match(partnersContent, /Johns Hopkins Medicine/, "TrustedPartners must include Johns Hopkins Medicine");
  assert.match(partnersContent, /Stanford Health Care/, "TrustedPartners must include Stanford Health Care");
});

test("Solutions FAQ: Accordion covers all 10 core healthcare AI questions", () => {
  const faqPath = path.join(rootDir, "src", "features", "solutions", "components", "SolutionsFAQ.tsx");
  const faqContent = fs.readFileSync(faqPath, "utf-8");

  const requiredQuestions = [
    "How can HealthNova AI integrate with our existing systems?",
    "Is our data secure and compliant?",
    "Can solutions be customized for our organization?",
    "How long does implementation take?",
    "Do you provide training and ongoing support?",
    "What healthcare problems does HealthNova AI solve?",
    "Who can use HealthNova AI?",
    "How does patient risk prediction work?",
    "Does HealthNova AI replace healthcare professionals?",
    "How explainable are the ML predictions?",
  ];

  for (const q of requiredQuestions) {
    assert.ok(faqContent.includes(q), `FAQ must include question: "${q}"`);
  }

  // Accessibility check: aria-expanded and role="region"
  assert.match(faqContent, /aria-expanded=/, "FAQ accordion button must specify aria-expanded");
  assert.match(faqContent, /role=["']region["']/, "FAQ accordion panel must have role='region'");
});

test("Role Solutions Tabs: Accessible tabs for 5 clinical roles", () => {
  const tabsPath = path.join(rootDir, "src", "features", "solutions", "components", "RoleSolutionsTabs.tsx");
  const tabsContent = fs.readFileSync(tabsPath, "utf-8");

  const roles = ["Patients", "Doctors", "Nurses", "Healthcare Organizations", "Health Data Teams"];
  for (const role of roles) {
    assert.ok(tabsContent.includes(role), `Tabs must include role: "${role}"`);
  }

  assert.match(tabsContent, /role=["']tab["']/, "Tab buttons must have role='tab'");
  assert.match(tabsContent, /role=["']tabpanel["']/, "Tab content must have role='tabpanel'");
  assert.match(tabsContent, /aria-selected=/, "Tab buttons must specify aria-selected");
});
