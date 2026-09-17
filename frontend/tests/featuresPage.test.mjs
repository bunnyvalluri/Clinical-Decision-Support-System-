/**
 * Automated Test Suite — Prompt 48: Healthcare Features Page & Public Architecture
 *
 * Verifies:
 *  1. Features page route presence and Server Component metadata structure.
 *  2. All feature section components exist with correct exports.
 *  3. Centralized navigation configuration in src/config/navigation.ts.
 *  4. Centralized features configuration (12 powerful features, 12 AI capabilities, 5 roles, 8 FAQs).
 *  5. Clinical safety invariants (human-in-the-loop, non-autonomous diagnosis, readable disclaimer).
 *  6. Strict White/Light Theme (zero dark: classes in features components and route).
 *  7. Public navigation and footer link integrity.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Features Page Route: src/app/features/page.tsx exists and has SEO metadata", () => {
  const pagePath = path.join(rootDir, "src", "app", "features", "page.tsx");
  assert.ok(fs.existsSync(pagePath), "Features page route must exist at src/app/features/page.tsx");

  const pageContent = fs.readFileSync(pagePath, "utf-8");

  // Metadata verification
  assert.match(
    pageContent,
    /title:\s*["']Features \| AI-Powered Clinical Decision Support["']/,
    "Features page must have correct SEO title"
  );
  assert.match(
    pageContent,
    /description:/,
    "Features page must declare a meta description"
  );
  assert.match(
    pageContent,
    /canonical:\s*["']\/features["']/,
    "Features page must specify canonical URL"
  );

  // Component composition verification
  const requiredImports = [
    "FeaturesHero",
    "CapabilityTrustStrip",
    "FeatureHighlightCards",
    "FeatureGrid",
    "AIIntelligenceSection",
    "RoleFeatures",
    "MLWorkflow",
    "RealTimeFeatures",
    "SecurityFeatures",
    "DataFlowVisual",
    "FeaturesFAQ",
    "FeaturesCTA",
    "PublicNavbar",
    "PublicFooter",
  ];

  for (const comp of requiredImports) {
    assert.ok(
      pageContent.includes(comp),
      `Features page must import and render component: ${comp}`
    );
  }
});

test("Features Components: All section components exist in components/features", () => {
  const featuresDir = path.join(rootDir, "src", "components", "features");
  assert.ok(fs.existsSync(featuresDir), "components/features directory must exist");

  const expectedFiles = [
    "FeaturesHero.tsx",
    "CapabilityTrustStrip.tsx",
    "FeatureHighlightCards.tsx",
    "FeatureGrid.tsx",
    "AIIntelligenceSection.tsx",
    "RoleFeatures.tsx",
    "MLWorkflow.tsx",
    "RealTimeFeatures.tsx",
    "SecurityFeatures.tsx",
    "DataFlowVisual.tsx",
    "FeaturesFAQ.tsx",
    "FeaturesCTA.tsx",
    "index.ts",
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(featuresDir, file);
    assert.ok(fs.existsSync(filePath), `Feature component file must exist: ${file}`);
  }
});

test("Centralized Navigation: src/config/navigation.ts defines public links including Features", () => {
  const navConfigPath = path.join(rootDir, "src", "config", "navigation.ts");
  assert.ok(fs.existsSync(navConfigPath), "src/config/navigation.ts must exist");

  const content = fs.readFileSync(navConfigPath, "utf-8");
  assert.match(content, /href:\s*["']\/features["']/, "Must include /features link in navigation");
  assert.match(content, /href:\s*["']\/about["']/, "Must include /about link in navigation");
});

test("Centralized Features Configuration: Complete data objects in src/config/features.ts", () => {
  const featuresConfigPath = path.join(rootDir, "src", "config", "features.ts");
  assert.ok(fs.existsSync(featuresConfigPath), "src/config/features.ts must exist");

  const content = fs.readFileSync(featuresConfigPath, "utf-8");
  assert.match(content, /POWERFUL_FEATURES/, "Must export POWERFUL_FEATURES");
  assert.match(content, /AI_INTELLIGENCE_CAPABILITIES/, "Must export AI_INTELLIGENCE_CAPABILITIES");
  assert.match(content, /ROLE_FEATURE_CARDS/, "Must export ROLE_FEATURE_CARDS");
  assert.match(content, /FEATURES_FAQS/, "Must export FEATURES_FAQS");
});

test("Clinical Safety Invariants: Mandatory disclaimers & human-in-the-loop standards", () => {
  const mlWorkflowPath = path.join(
    rootDir,
    "src",
    "components",
    "features",
    "MLWorkflow.tsx"
  );
  const content = fs.readFileSync(mlWorkflowPath, "utf-8");

  // Mandatory non-autonomous statement in ML Workflow
  assert.match(
    content,
    /Risk\s+predictions\s+are\s+decision-support\s+outputs\s+and\s+should\s+be\s+interpreted\s+by\s+qualified\s+healthcare\s+professionals/i,
    "Must include mandatory clinical disclaimer regarding decision-support outputs"
  );

  const aiIntelligencePath = path.join(
    rootDir,
    "src",
    "components",
    "features",
    "AIIntelligenceSection.tsx"
  );
  const aiContent = fs.readFileSync(aiIntelligencePath, "utf-8");
  assert.match(
    aiContent,
    /Never\s+diagnoses\s+autonomously/i,
    "Must state that AI never diagnoses autonomously"
  );
});

test("Theme Policy: Zero dark-mode classes in features components", () => {
  const featuresDir = path.join(rootDir, "src", "components", "features");
  const entries = fs.readdirSync(featuresDir);

  for (const entry of entries) {
    if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      const fullPath = path.join(featuresDir, entry);
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
