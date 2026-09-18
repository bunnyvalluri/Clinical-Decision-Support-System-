/**
 * Automated Test Suite — Google Jules API Integration for Engineering Automation
 *
 * Verifies:
 *  1. Jules App Router routes presence across all sub-paths.
 *  2. All 11 Jules UI components and index exports exist.
 *  3. Jules TypeScript types and API service module integrity.
 *  4. Strict White/Light Theme (zero dark: Tailwind classes).
 *  5. Secret Security Boundary (zero NEXT_PUBLIC_JULES_API_KEY occurrences).
 *  6. Clinical Safety & Dual-Custody Approval gates (human sign-off, non-autonomous clinical changes).
 *  7. Admin Layout navigation integration (/admin/automation/jules).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// --------------------------------------------------------------------------
// SUITE 1: APP ROUTER ROUTES
// --------------------------------------------------------------------------
test("Jules Routes: All admin automation routes exist", () => {
  const routes = [
    "src/app/admin/automation/page.tsx",
    "src/app/admin/automation/jules/page.tsx",
    "src/app/admin/automation/jules/sessions/page.tsx",
    "src/app/admin/automation/jules/sessions/[sessionId]/page.tsx",
    "src/app/admin/automation/jules/remediations/page.tsx",
    "src/app/admin/automation/jules/remediations/[jobId]/page.tsx",
    "src/app/admin/automation/jules/sources/page.tsx",
    "src/app/admin/automation/jules/activity/page.tsx",
    "src/app/admin/automation/jules/settings/page.tsx",
  ];

  for (const relPath of routes) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `Route file must exist: ${relPath}`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.ok(content.length > 50, `Route file must have substantial content: ${relPath}`);
  }
});

test("Jules Routes: Root automation route redirects or links to jules", () => {
  const rootAutomation = path.join(rootDir, "src/app/admin/automation/page.tsx");
  const content = fs.readFileSync(rootAutomation, "utf-8");
  assert.match(content, /jules/i, "Root automation route must reference Jules subsystem");
});

// --------------------------------------------------------------------------
// SUITE 2: FEATURE COMPONENTS
// --------------------------------------------------------------------------
test("Jules Components: All 11 feature components exist with exports", () => {
  const components = [
    "JulesStatusBadge.tsx",
    "JulesHealthCard.tsx",
    "JulesSessionProgress.tsx",
    "JulesActivityTimeline.tsx",
    "JulesRemediationCard.tsx",
    "JulesApprovalDialog.tsx",
    "JulesValidationPanel.tsx",
    "JulesSourceSelector.tsx",
    "JulesArtifactList.tsx",
    "JulesErrorState.tsx",
    "FixWithJulesButton.tsx",
  ];

  const compDir = path.join(rootDir, "src/features/automation/jules/components");

  for (const comp of components) {
    const fullPath = path.join(compDir, comp);
    assert.ok(fs.existsSync(fullPath), `Component must exist: ${comp}`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.match(content, /export\s+(function|const|default)/, `Component must have valid export: ${comp}`);
  }

  // Index barrel export check
  const indexPath = path.join(compDir, "index.ts");
  assert.ok(fs.existsSync(indexPath), "Components index.ts must exist");
  const indexContent = fs.readFileSync(indexPath, "utf-8");
  for (const comp of components) {
    const baseName = comp.replace(/\.tsx$/, "");
    assert.ok(indexContent.includes(baseName), `index.ts must export ${baseName}`);
  }
});

// --------------------------------------------------------------------------
// SUITE 3: TYPES AND SERVICES
// --------------------------------------------------------------------------
test("Jules Types: Type definitions file exists and defines core interfaces", () => {
  const typesPath = path.join(rootDir, "src/types/jules.ts");
  assert.ok(fs.existsSync(typesPath), "src/types/jules.ts must exist");
  const content = fs.readFileSync(typesPath, "utf-8");

  const requiredTypes = [
    "JulesSource",
    "JulesSession",
    "JulesActivity",
    "JulesRemediationJob",
    "JulesArtifact",
    "JulesApproval",
    "JulesHealthStatus",
  ];

  for (const typeName of requiredTypes) {
    assert.ok(
      content.includes(`interface ${typeName}`) || content.includes(`type ${typeName}`),
      `Jules types must define ${typeName}`
    );
  }
});

test("Jules API Service: Exists and implements REST and WebSocket endpoints", () => {
  const apiPath = path.join(rootDir, "src/services/jules/julesApi.ts");
  assert.ok(fs.existsSync(apiPath), "src/services/jules/julesApi.ts must exist");
  const content = fs.readFileSync(apiPath, "utf-8");

  assert.match(content, /getHealth/, "Service must implement getHealth");
  assert.match(content, /listSources/, "Service must implement listSources");
  assert.match(content, /listSessions/, "Service must implement listSessions");
  assert.match(content, /createSession/, "Service must implement createSession");
  assert.match(content, /listRemediations/, "Service must implement listRemediations");
  assert.match(content, /createRemediation/, "Service must implement createRemediation");
  assert.match(content, /decideApproval/, "Service must implement decideApproval");
  assert.match(content, /createJulesWebSocket/, "Service must implement WebSocket connector");
});

// --------------------------------------------------------------------------
// SUITE 4: THEME CONSISTENCY (ZERO DARK: TAILWIND CLASSES)
// --------------------------------------------------------------------------
test("Jules Theme: Zero dark: Tailwind classes across all Jules components and routes", () => {
  const checkDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        checkDir(fullPath);
      } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const darkMatches = content.match(/\bdark:[a-zA-Z0-9_\-\/]+/g);
        assert.equal(
          darkMatches,
          null,
          `Found dark: class in ${fullPath}: ${darkMatches ? darkMatches.join(", ") : ""}`
        );
      }
    }
  };

  checkDir(path.join(rootDir, "src/features/automation/jules"));
  checkDir(path.join(rootDir, "src/app/admin/automation"));
});

// --------------------------------------------------------------------------
// SUITE 5: SECRET SECURITY BOUNDARY
// --------------------------------------------------------------------------
test("Jules Security: Zero NEXT_PUBLIC_JULES_API_KEY leaks in frontend codebase", () => {
  const scanForLeakedKey = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanForLeakedKey(fullPath);
      } else if (/\.(tsx|ts|jsx|js|json|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        assert.ok(
          !content.includes("NEXT_PUBLIC_JULES_API_KEY"),
          `Forbidden client-side secret exposure: NEXT_PUBLIC_JULES_API_KEY in ${fullPath}`
        );
      }
    }
  };

  scanForLeakedKey(path.join(rootDir, "src"));
});

// --------------------------------------------------------------------------
// SUITE 6: DUAL-CUSTODY & CLINICAL SAFETY GATES
// --------------------------------------------------------------------------
test("Jules Governance: Approval dialog enforces human approval with notes", () => {
  const dialogPath = path.join(
    rootDir,
    "src/features/automation/jules/components/JulesApprovalDialog.tsx"
  );
  const content = fs.readFileSync(dialogPath, "utf-8");
  assert.match(content, /approve|authorize/i, "Approval dialog must allow authorizing plan");
  assert.match(content, /cancel|close/i, "Approval dialog must allow cancelling dialog");
  assert.match(content, /reason|rationale|notes/i, "Approval dialog must accept audit notes or rationale");
  assert.match(content, /clinical safety/i, "Approval dialog must highlight clinical safety invariant");
});

test("Jules Governance: Remediation card displays severity, status, and approval triggers", () => {
  const cardPath = path.join(
    rootDir,
    "src/features/automation/jules/components/JulesRemediationCard.tsx"
  );
  const content = fs.readFileSync(cardPath, "utf-8");
  assert.match(content, /severity/i, "Remediation card must display job severity");
  assert.match(content, /status/i, "Remediation card must display job status badge");
  assert.match(content, /approve/i, "Remediation card must provide approval action for pending plans");
});

// --------------------------------------------------------------------------
// SUITE 7: ADMIN NAVIGATION INTEGRATION
// --------------------------------------------------------------------------
test("Admin Layout: Navigation includes Jules Automation link", () => {
  const layoutPath = path.join(rootDir, "src/app/admin/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");
  assert.match(
    content,
    /\/admin\/automation\/jules/,
    "Admin layout must link to /admin/automation/jules"
  );
  assert.match(
    content,
    /Jules Automation/,
    "Admin layout must have 'Jules Automation' navigation label"
  );
});
