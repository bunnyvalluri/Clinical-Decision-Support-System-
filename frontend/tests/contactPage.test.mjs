import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_ROOT = path.resolve(process.cwd());

test("Contact & Doctor Page Route exists", () => {
  const contactPagePath = path.join(FRONTEND_ROOT, "src/app/contact/page.tsx");
  assert.ok(fs.existsSync(contactPagePath), "src/app/contact/page.tsx must exist");
  const content = fs.readFileSync(contactPagePath, "utf-8");
  assert.ok(content.includes("Dr. Vadla Abhinay"), "Page must feature Dr. Vadla Abhinay, MD");
  assert.ok(content.includes("doctor-hero.jpg"), "Page must reference /doctor-hero.jpg");
});

test("Contact link registered in centralized navigation", () => {
  const navPath = path.join(FRONTEND_ROOT, "src/config/navigation.ts");
  const navContent = fs.readFileSync(navPath, "utf-8");
  assert.ok(navContent.includes('href: "/contact"'), "Contact link in navigation.ts must route to /contact");
});

test("Clinical Safety Invariants enforced", () => {
  const contactPagePath = path.join(FRONTEND_ROOT, "src/app/contact/page.tsx");
  const content = fs.readFileSync(contactPagePath, "utf-8");
  assert.ok(
    content.includes("do not replace professional medical judgment") ||
      content.includes("sole final diagnostic"),
    "Mandatory clinical non-autonomous disclaimer must be present"
  );
});

test("Theme Policy: Zero dark-mode classes", () => {
  const contactPagePath = path.join(FRONTEND_ROOT, "src/app/contact/page.tsx");
  const content = fs.readFileSync(contactPagePath, "utf-8");
  const darkMatches = content.match(/\bdark:[a-zA-Z0-9_\-\/]+/g);
  assert.equal(darkMatches, null, "Found forbidden dark-mode class in contact page");
});
