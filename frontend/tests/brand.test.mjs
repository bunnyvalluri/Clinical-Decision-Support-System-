import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");

describe("HealthNova AI — Brand Configuration & Integrity", () => {
  it("verifies brand configuration constants", async () => {
    const brandPath = path.join(frontendRoot, "src", "config", "brand.ts");
    assert.ok(fs.existsSync(brandPath), "brand.ts must exist");

    const content = fs.readFileSync(brandPath, "utf-8");
    assert.match(content, /brandName:\s*"HealthNova AI"/);
    assert.match(content, /displayName:\s*"HealthNova AI"/);
    assert.match(content, /shortName:\s*"HN"/);
    assert.match(content, /AI-Powered Clinical Decision Support & Patient Risk Intelligence/);
    assert.match(content, /DOCTOR:\s*"Clinical Decision Support"/);
    assert.match(content, /NURSE:\s*"Triage & Patient Risk Monitoring"/);
    assert.match(content, /ANALYST:\s*"Clinical Data & Model Intelligence"/);
    assert.match(content, /ADMIN:\s*"Platform & Security Administration"/);
    assert.match(content, /PATIENT:\s*"Personal Health Intelligence"/);
  });

  it("verifies public PWA manifest branding", () => {
    const manifestPath = path.join(frontendRoot, "public", "manifest.json");
    assert.ok(fs.existsSync(manifestPath), "manifest.json must exist");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assert.equal(manifest.name, "HealthNova AI");
    assert.equal(manifest.short_name, "HealthNova AI");
    assert.equal(manifest.theme_color, "#ffffff");
    assert.equal(manifest.background_color, "#ffffff");
    assert.match(manifest.description, /Clinical Decision Support/);
  });

  it("verifies root layout metadata branding", () => {
    const layoutPath = path.join(frontendRoot, "src", "app", "layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");

    assert.match(content, /HealthNova AI/);
    assert.match(content, /BRAND_CONFIG/);
    assert.doesNotMatch(content, /PatientRisk \| AI Clinical Decision Support System/);
  });

  it("verifies role layouts contain HealthNova AI workspace branding", () => {
    const roleLayouts = [
      { file: "src/app/doctor/layout.tsx", subtitle: "Clinical Decision Support" },
      { file: "src/app/nurse/layout.tsx", subtitle: "Triage & Patient Risk Monitoring" },
      { file: "src/app/informaticist/layout.tsx", subtitle: "Clinical Data & Model Intelligence" },
      { file: "src/app/admin/layout.tsx", subtitle: "Platform & Security Administration" },
      { file: "src/app/user/layout.tsx", subtitle: "Personal Health Intelligence" },
    ];

    for (const { file, subtitle } of roleLayouts) {
      const filePath = path.join(frontendRoot, file);
      assert.ok(fs.existsSync(filePath), `${file} must exist`);
      const content = fs.readFileSync(filePath, "utf-8");
      assert.match(content, /workspaceName="HealthNova AI"/, `${file} must have workspaceName="HealthNova AI"`);
      assert.match(content, new RegExp(`workspaceSubtitle="${subtitle}"`), `${file} must have subtitle "${subtitle}"`);
    }
  });

  it("brand regression test: user-facing pages do not use deprecated PatientRisk CDSS string", () => {
    const testFiles = [
      "src/app/login/page.tsx",
      "src/app/register/page.tsx",
      "src/app/forgot-password/page.tsx",
      "src/app/reset-password/page.tsx",
      "src/app/error.tsx",
      "src/app/not-found.tsx",
      "src/components/layout/Shell.tsx",
    ];

    for (const relPath of testFiles) {
      const filePath = path.join(frontendRoot, relPath);
      assert.ok(fs.existsSync(filePath), `${relPath} must exist`);
      const content = fs.readFileSync(filePath, "utf-8");
      assert.doesNotMatch(
        content,
        /PatientRisk CDSS/,
        `File ${relPath} should not contain deprecated "PatientRisk CDSS"`
      );
      assert.match(
        content,
        /HealthNova AI/,
        `File ${relPath} must contain official brand "HealthNova AI"`
      );
    }
  });

  it("verifies clinical safety disclaimers are preserved", () => {
    const brandPath = path.join(frontendRoot, "src", "config", "brand.ts");
    const content = fs.readFileSync(brandPath, "utf-8");
    assert.match(content, /does not replace professional medical judgment/i);
    assert.match(content, /Enhancing Clinical Decision Support Systems/);
  });
});
