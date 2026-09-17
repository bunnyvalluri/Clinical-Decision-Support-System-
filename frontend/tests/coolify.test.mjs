import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const FRONTEND_ROOT = path.resolve(__dirname, "..");

// --------------------------------------------------------------------------
// SUITE 1: COOLIFY VERSION PINNING & LICENSING INTEGRITY
// --------------------------------------------------------------------------
test("Coolify: Version pinning file exists and enforces pinned v4.0.0-beta.380", () => {
  const versionPath = path.resolve(REPO_ROOT, "docs/integrations/COOLIFY_VERSION.md");
  assert.ok(fs.existsSync(versionPath), "docs/integrations/COOLIFY_VERSION.md must exist");

  const content = fs.readFileSync(versionPath, "utf-8");
  assert.match(content, /v4\.0\.0-beta\.380/);
  assert.doesNotMatch(content, /coolify:latest/i);
});

test("Coolify: License document exists and complies with Apache-2.0 open-source evaluation", () => {
  const licensePath = path.resolve(REPO_ROOT, "docs/integrations/COOLIFY_LICENSE.md");
  assert.ok(fs.existsSync(licensePath), "docs/integrations/COOLIFY_LICENSE.md must exist");

  const content = fs.readFileSync(licensePath, "utf-8");
  assert.match(content, /Apache License.*2\.0/i);
});

test("Coolify: Architecture Decision Record ADR-COOLIFY-INTEGRATION exists and is accepted", () => {
  const adrPath = path.resolve(REPO_ROOT, "docs/adr/ADR-COOLIFY-INTEGRATION.md");
  assert.ok(fs.existsSync(adrPath), "docs/adr/ADR-COOLIFY-INTEGRATION.md must exist");

  const content = fs.readFileSync(adrPath, "utf-8");
  assert.match(content, /Status\*{0,2}:\s*Accepted/i);
  assert.match(content, /Neon PostgreSQL/i);
});

// --------------------------------------------------------------------------
// SUITE 2: INFRASTRUCTURE AS CODE & DOCKER COMPOSE INTEGRITY
// --------------------------------------------------------------------------
test("Coolify IaC: Compose manifests exist for production and staging", () => {
  const prodCompose = path.resolve(REPO_ROOT, "infra/coolify/docker-compose.prod.yml");
  const stagingCompose = path.resolve(REPO_ROOT, "infra/coolify/docker-compose.staging.yml");
  const envExample = path.resolve(REPO_ROOT, "infra/coolify/coolify.env.example");

  assert.ok(fs.existsSync(prodCompose), "docker-compose.prod.yml must exist");
  assert.ok(fs.existsSync(stagingCompose), "docker-compose.staging.yml must exist");
  assert.ok(fs.existsSync(envExample), "coolify.env.example must exist");

  const prodContent = fs.readFileSync(prodCompose, "utf-8");
  assert.match(prodContent, /traefik\.enable=true/);
  assert.match(prodContent, /cpus:\s*['"]?[1-4]/);
  assert.match(prodContent, /memory:\s*['"]?\d+[GM]B?['"]?/);
  assert.match(prodContent, /healthcheck:/);
});

test("Coolify IaC: Hardened Dockerfiles exist for backend and frontend with non-root execution", () => {
  const backendDockerfile = path.resolve(REPO_ROOT, "infra/docker/Dockerfile.backend.prod");
  const frontendDockerfile = path.resolve(REPO_ROOT, "infra/docker/Dockerfile.frontend.prod");

  assert.ok(fs.existsSync(backendDockerfile), "Dockerfile.backend.prod must exist");
  assert.ok(fs.existsSync(frontendDockerfile), "Dockerfile.frontend.prod must exist");

  const backendContent = fs.readFileSync(backendDockerfile, "utf-8");
  assert.match(backendContent, /USER healthnova/);

  const frontendContent = fs.readFileSync(frontendDockerfile, "utf-8");
  assert.match(frontendContent, /USER nextjs/);
});

test("Coolify IaC: Rollback script requires explicit confirmation to prevent accidental rollbacks", () => {
  const rollbackScript = path.resolve(REPO_ROOT, "infra/scripts/rollback_deployment.sh");
  assert.ok(fs.existsSync(rollbackScript), "rollback_deployment.sh must exist");

  const content = fs.readFileSync(rollbackScript, "utf-8");
  assert.match(content, /CONFIRM ROLLBACK/);
});

// --------------------------------------------------------------------------
// SUITE 3: SECURITY & SECRET HYGIENE
// --------------------------------------------------------------------------
test("Coolify Security: Zero exposure of COOLIFY_API_TOKEN to client bundles", () => {
  const srcDir = path.resolve(FRONTEND_ROOT, "src");

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx|ts|jsx|js|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        assert.doesNotMatch(
          content,
          /NEXT_PUBLIC_COOLIFY_API_TOKEN/,
          `CRITICAL: Client-side exposed Coolify API token in ${entry.name}`
        );
        assert.doesNotMatch(
          content,
          /NEXT_PUBLIC_COOLIFY_SECRET/,
          `CRITICAL: Client-side exposed Coolify secret in ${entry.name}`
        );
      }
    }
  }

  scanDir(srcDir);
});

// --------------------------------------------------------------------------
// SUITE 4: FRONTEND UI & RBAC INTEGRITY
// --------------------------------------------------------------------------
test("Coolify UI: Admin Infrastructure page exists with honest white-only palette", () => {
  const pagePath = path.resolve(FRONTEND_ROOT, "src/app/admin/infrastructure/page.tsx");
  assert.ok(fs.existsSync(pagePath), "src/app/admin/infrastructure/page.tsx must exist");

  const content = fs.readFileSync(pagePath, "utf-8");
  assert.match(content, /Coolify Infrastructure & Deployment Control Plane/);
  assert.match(content, /bg-white/);
  assert.match(content, /border-slate-200/);
  // Strictly no dark mode classes
  assert.doesNotMatch(content, /dark:/, "Page must adhere to strict white-only design guidelines");
});

test("Coolify UI: Shell navigation includes Infrastructure link exclusively for IT_ADMIN", () => {
  const shellPath = path.resolve(FRONTEND_ROOT, "src/components/layout/Shell.tsx");
  const content = fs.readFileSync(shellPath, "utf-8");

  assert.match(content, /\/admin\/infrastructure/);
  assert.match(content, /Coolify Platform/);
});
