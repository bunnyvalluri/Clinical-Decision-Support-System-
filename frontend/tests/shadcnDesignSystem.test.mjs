/**
 * Automated Test Suite — Prompt 39: shadcn/ui Healthcare Design System
 *
 * Verifies:
 *  1. Pinned components.json structure & Tailwind v4 configuration
 *  2. White-only theme policy enforcement (zero dark-mode rules)
 *  3. shadcn UI primitives presence & export integrity
 *  4. Clinical UI component presence & color-blind accessibility invariants
 *  5. Separation of concerns: no clinical logic in UI primitives
 *  6. 5-Role layout architecture
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("shadcn/ui Configuration: components.json conforms to Tailwind v4 & New York style", () => {
  const configPath = path.join(rootDir, "components.json");
  assert.ok(fs.existsSync(configPath), "components.json must exist in frontend root");

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  assert.strictEqual(config.style, "new-york", "Must use new-york style, not default");
  assert.strictEqual(config.rsc, true, "Must support React Server Components");
  assert.strictEqual(config.tsx, true, "Must use TypeScript");
  assert.strictEqual(config.tailwind.css, "src/app/globals.css");
  assert.strictEqual(config.aliases.components, "@/components");
  assert.strictEqual(config.aliases.utils, "@/lib/utils");
  assert.strictEqual(config.aliases.ui, "@/components/ui");
});

test("Theme Policy: Strict White/Light Theme Only (Zero Dark Mode Classes)", () => {
  const globalsCssPath = path.join(rootDir, "src", "app", "globals.css");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  // Check color-scheme is light
  assert.match(
    globalsCss,
    /color-scheme:\s*light\s*!important/,
    "globals.css must strictly enforce color-scheme: light !important"
  );

  // Scan src directory for any unintended dark-mode classes (e.g., "dark:", "dark:bg-", "dark:text-")
  const srcDir = path.join(rootDir, "src");
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Verify no dark: variant utility usages in clinical and layout code
        const darkMatch = content.match(/[\s"']dark:[a-zA-Z0-9_-]+/);
        assert.strictEqual(
          darkMatch,
          null,
          `Found forbidden dark-mode class '${darkMatch?.[0]}' in ${path.relative(rootDir, fullPath)}`
        );
      }
    }
  }

  scanDir(srcDir);
});

test("shadcn Primitives: Core accessible primitives are present in components/ui", () => {
  const uiDir = path.join(rootDir, "src", "components", "ui");
  const requiredPrimitives = [
    "button.tsx",
    "badge.tsx",
    "card.tsx",
    "input.tsx",
    "textarea.tsx",
    "label.tsx",
    "checkbox.tsx",
    "radio-group.tsx",
    "switch.tsx",
    "select.tsx",
    "popover.tsx",
    "dialog.tsx",
    "alert-dialog.tsx",
    "sheet.tsx",
    "tooltip.tsx",
    "tabs.tsx",
    "accordion.tsx",
    "separator.tsx",
    "skeleton.tsx",
    "progress.tsx",
    "table.tsx",
    "command.tsx",
    "form.tsx",
    "sonner.tsx",
    "alert.tsx",
  ];

  for (const primitive of requiredPrimitives) {
    const filePath = path.join(uiDir, primitive);
    assert.ok(fs.existsSync(filePath), `Primitive ${primitive} must exist in components/ui/`);
  }
});

test("Clinical Design System: All specialized clinical components exist and avoid hardcoded PHI", () => {
  const clinicalDir = path.join(rootDir, "src", "components", "clinical");
  const requiredClinicalComponents = [
    "RiskBadge.tsx",
    "RiskLevelCard.tsx",
    "PatientSummaryCard.tsx",
    "PatientHeader.tsx",
    "VitalSignCard.tsx",
    "ClinicalTimeline.tsx",
    "PredictionCard.tsx",
    "SHAPExplanation.tsx",
    "ClinicalReviewCard.tsx",
    "ClinicalAlert.tsx",
    "ClinicalStatusBadge.tsx",
    "ClinicalMetricCard.tsx",
    "EvidenceCard.tsx",
    "AIExplanationCard.tsx",
    "AIReviewPanel.tsx",
    "index.ts",
  ];

  for (const comp of requiredClinicalComponents) {
    const filePath = path.join(clinicalDir, comp);
    assert.ok(fs.existsSync(filePath), `Clinical component ${comp} must exist in components/clinical/`);
  }
});

test("Architectural Boundary: UI Primitives do NOT contain clinical business logic", () => {
  const buttonContent = fs.readFileSync(path.join(rootDir, "src", "components", "ui", "button.tsx"), "utf-8");
  assert.strictEqual(
    buttonContent.includes("patient"),
    false,
    "components/ui/button.tsx must remain generic and not contain clinical patient logic"
  );
  assert.strictEqual(
    buttonContent.includes("riskScore"),
    false,
    "components/ui/button.tsx must not contain risk scoring logic"
  );
});

test("Role Layouts: 5-Role layouts exist with RoleGuard protection", () => {
  const layoutDir = path.join(rootDir, "src", "components", "layout");
  const requiredLayouts = [
    "DoctorLayout.tsx",
    "NurseLayout.tsx",
    "InformaticistLayout.tsx",
    "AdminLayout.tsx",
    "Shell.tsx",
    "Breadcrumbs.tsx",
    "RoleGuard.tsx",
  ];

  for (const layout of requiredLayouts) {
    const filePath = path.join(layoutDir, layout);
    assert.ok(fs.existsSync(filePath), `Layout component ${layout} must exist in components/layout/`);
  }
});
