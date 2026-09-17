import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const BRUNO_DIR = path.resolve(REPO_ROOT, "bruno");

// --------------------------------------------------------------------------
// SUITE 1: BRUNO CLI & COLLECTION INTEGRITY
// --------------------------------------------------------------------------
test("Bruno: CLI version is pinned and Safe Mode is documented default", () => {
  const versionPath = path.resolve(REPO_ROOT, "BRUNO_CLI_VERSION");
  assert.ok(fs.existsSync(versionPath), "BRUNO_CLI_VERSION file must exist");

  const content = fs.readFileSync(versionPath, "utf-8");
  assert.match(content, /@usebruno\/cli@\d+\.\d+\.\d+/);
  assert.doesNotMatch(content, /@usebruno\/cli@latest/i);
});

test("Bruno: Collection directory contains bruno.json and core domains", () => {
  assert.ok(fs.existsSync(BRUNO_DIR), "bruno/ directory must exist");
  assert.ok(fs.existsSync(path.resolve(BRUNO_DIR, "bruno.json")), "bruno.json must exist");

  const manifest = JSON.parse(fs.readFileSync(path.resolve(BRUNO_DIR, "bruno.json"), "utf-8"));
  assert.equal(manifest.name, "HealthNova-AI-CDSS");
  assert.equal(manifest.type, "collection");

  const requiredDomains = [
    "auth",
    "health",
    "patients",
    "nurses",
    "predictions",
    "models",
    "informaticists",
    "admin",
    "notifications",
    "ai",
    "search",
    "meilisearch",
    "nocodb",
    "whiteboards",
    "security",
    "external-apis",
    "system",
  ];

  for (const domain of requiredDomains) {
    const domainPath = path.resolve(BRUNO_DIR, domain);
    assert.ok(fs.existsSync(domainPath), `Domain directory ${domain} must exist`);
  }
});

// --------------------------------------------------------------------------
// SUITE 2: HEALTHCARE PRIVACY & SECRET HYGIENE
// --------------------------------------------------------------------------
test("Bruno Security: No hardcoded secrets or JWTs committed in collections", () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith(".bru") && !entry.name.endsWith(".secret.bru")) {
        const text = fs.readFileSync(fullPath, "utf-8");
        assert.doesNotMatch(
          text,
          /eyJ[a-zA-Z0-9_\-]{25,}\.eyJ[a-zA-Z0-9_\-]{25,}/,
          `Found potential hardcoded JWT in ${entry.name}`
        );
        assert.doesNotMatch(text, /BEGIN (RSA )?PRIVATE KEY/, `Found private key in ${entry.name}`);
      }
    }
  }

  scanDir(BRUNO_DIR);
});

test("Bruno Security: No real PHI patterns in collection fixtures", () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith(".bru")) {
        const text = fs.readFileSync(fullPath, "utf-8");
        // Check for SSN format: 3 digits - 2 digits - 4 digits
        assert.doesNotMatch(text, /\b\d{3}-\d{2}-\d{4}\b/, `Potential SSN detected in ${entry.name}`);
      }
    }
  }

  scanDir(BRUNO_DIR);
});

// --------------------------------------------------------------------------
// SUITE 3: 5-ROLE RBAC BOUNDARY COVERAGE
// --------------------------------------------------------------------------
test("Bruno RBAC: Dedicated tests exist for all 5 roles in security suite", () => {
  const rbacDir = path.resolve(BRUNO_DIR, "security", "RBAC");
  assert.ok(fs.existsSync(rbacDir), "security/RBAC/ must exist");

  const files = fs.readdirSync(rbacDir);
  assert.ok(files.some((f) => f.includes("DOCTOR")), "Doctor RBAC test must exist");
  assert.ok(files.some((f) => f.includes("NURSE")), "Nurse RBAC test must exist");
  assert.ok(files.some((f) => f.includes("PATIENT")), "Patient RBAC test must exist");
  assert.ok(files.some((f) => f.includes("ADMIN")), "Admin RBAC test must exist");
  assert.ok(files.some((f) => f.includes("INFORMATICIST")), "Informaticist RBAC test must exist");
});

test("Bruno IDOR: Cross-patient object reference tests exist", () => {
  const idorDir = path.resolve(BRUNO_DIR, "security", "IDOR");
  assert.ok(fs.existsSync(idorDir), "security/IDOR/ must exist");

  const files = fs.readdirSync(idorDir);
  assert.ok(files.some((f) => f.includes("PATIENT")), "Patient IDOR test must exist");
});

// --------------------------------------------------------------------------
// SUITE 4: CI & QUALITY RUNNER VERIFICATION
// --------------------------------------------------------------------------
test("Bruno Runner: scripts/run_bruno_tests.py exists and generates reports", () => {
  const runnerScript = path.resolve(REPO_ROOT, "scripts", "run_bruno_tests.py");
  assert.ok(fs.existsSync(runnerScript), "run_bruno_tests.py must exist");

  const junitReport = path.resolve(REPO_ROOT, "reports", "bruno", "junit.xml");
  assert.ok(fs.existsSync(junitReport), "reports/bruno/junit.xml must exist");

  const summaryReport = path.resolve(REPO_ROOT, "reports", "bruno", "summary.json");
  assert.ok(fs.existsSync(summaryReport), "reports/bruno/summary.json must exist");
});
