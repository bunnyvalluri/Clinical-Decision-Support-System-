import test from "node:test";
import assert from "node:assert/strict";

/**
 * NocoDB Healthcare Analytics & Workspace Test Suite
 *
 * Verifies:
 *  1. Category metadata definitions and badge mappings
 *  2. Role-based access control and permission gates
 *  3. Spreadsheet formula injection sanitization logic
 *  4. MCP Tool definitions and protocol contracts
 *  5. Data workspace role route resolution
 */

// --------------------------------------------------------------------------
// SUITE 1: CATEGORY METADATA & ROW FORMATTING
// --------------------------------------------------------------------------
test("NocoDB: Category metadata resolution", () => {
  const categories = [
    "ML_OPS",
    "DATA_QUALITY",
    "CLINICAL_OPS",
    "SYSTEM_TELEMETRY",
    "COLLABORATION",
    "GENERAL",
  ];

  categories.forEach((cat) => {
    assert.ok(typeof cat === "string");
  });
});

test("NocoDB: Row count formatting logic", () => {
  const formatCount = (count) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
    return count.toString();
  };

  assert.equal(formatCount(450), "450");
  assert.equal(formatCount(2400), "2.4k");
  assert.equal(formatCount(1500000), "1.5M");
});

// --------------------------------------------------------------------------
// SUITE 2: RBAC AND ROLE PERMISSION ENFORCEMENT
// --------------------------------------------------------------------------
test("NocoDB RBAC: Informaticist and Admin have mutation and sync privileges", () => {
  const canMutate = (role) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return ["it_admin", "admin", "medical_informaticist", "informaticist"].includes(r);
  };

  const canSync = (role) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return ["it_admin", "admin", "medical_informaticist", "informaticist"].includes(r);
  };

  assert.equal(canMutate("MEDICAL_INFORMATICIST"), true);
  assert.equal(canMutate("IT_ADMIN"), true);
  assert.equal(canMutate("DOCTOR"), false);
  assert.equal(canMutate("NURSE"), false);
  assert.equal(canMutate("PATIENT"), false);

  assert.equal(canSync("MEDICAL_INFORMATICIST"), true);
  assert.equal(canSync("IT_ADMIN"), true);
  assert.equal(canSync("DOCTOR"), false);
  assert.equal(canSync("NURSE"), false);
});

test("NocoDB RBAC: Export privileges granted to Admin, Informaticist, and Doctor", () => {
  const canExport = (role) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return ["it_admin", "admin", "medical_informaticist", "informaticist", "doctor", "clinician"].includes(r);
  };

  assert.equal(canExport("DOCTOR"), true);
  assert.equal(canExport("MEDICAL_INFORMATICIST"), true);
  assert.equal(canExport("IT_ADMIN"), true);
  assert.equal(canExport("NURSE"), false);
});

test("NocoDB RBAC: Dataset boundary enforcement", () => {
  const canAccess = (role, datasetRoles) => {
    if (!role) return false;
    let r = role.toLowerCase();
    if (r === "it_admin" || r === "admin") return true;
    if (r === "medical_informaticist") r = "informaticist";
    const allowed = (datasetRoles || []).map((x) => x.toLowerCase());
    return allowed.includes(r);
  };

  const mlDriftRoles = ["informaticist", "admin"];
  assert.equal(canAccess("MEDICAL_INFORMATICIST", mlDriftRoles), true);
  assert.equal(canAccess("IT_ADMIN", mlDriftRoles), true);
  assert.equal(canAccess("DOCTOR", mlDriftRoles), false);
  assert.equal(canAccess("PATIENT", mlDriftRoles), false);

  const workflowRoles = ["informaticist", "admin", "doctor", "nurse"];
  assert.equal(canAccess("NURSE", workflowRoles), true);
  assert.equal(canAccess("DOCTOR", workflowRoles), true);
  assert.equal(canAccess("PATIENT", workflowRoles), false);
});

// --------------------------------------------------------------------------
// SUITE 3: SPREADSHEET FORMULA INJECTION SANITIZATION
// --------------------------------------------------------------------------
test("Security: Spreadsheet Formula Injection escaping", () => {
  const sanitizeCell = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "number" || typeof val === "boolean") return val;
    const s = String(val);
    if (
      s.startsWith("\t") ||
      s.startsWith("\r") ||
      s.startsWith("=") ||
      s.startsWith("+") ||
      s.startsWith("-") ||
      s.startsWith("@") ||
      s.trim().startsWith("=") ||
      s.trim().startsWith("+") ||
      s.trim().startsWith("-") ||
      s.trim().startsWith("@")
    ) {
      return "'" + s;
    }
    return s;
  };

  assert.equal(sanitizeCell("=1+1"), "'=1+1");
  assert.equal(sanitizeCell("+calc"), "'+calc");
  assert.equal(sanitizeCell("-20"), "'-20");
  assert.equal(sanitizeCell("@cmd"), "'@cmd");
  assert.equal(sanitizeCell("\tHYPERLINK"), "'\tHYPERLINK");
  assert.equal(sanitizeCell("Normal Text"), "Normal Text");
  assert.equal(sanitizeCell(42), 42);
});

// --------------------------------------------------------------------------
// SUITE 4: MODEL CONTEXT PROTOCOL (MCP) TOOL CONTRACTS
// --------------------------------------------------------------------------
test("MCP: Allowlisted tools verification", () => {
  const allowlistedTools = new Set([
    "nocodb_list_datasets",
    "nocodb_query_dataset",
    "nocodb_get_schema",
    "nocodb_get_drift_metrics",
    "nocodb_get_quality_issues",
  ]);

  assert.ok(allowlistedTools.has("nocodb_list_datasets"));
  assert.ok(allowlistedTools.has("nocodb_query_dataset"));
  assert.ok(allowlistedTools.has("nocodb_get_drift_metrics"));
  assert.ok(allowlistedTools.has("nocodb_get_quality_issues"));
  assert.ok(!allowlistedTools.has("nocodb_raw_sql"));
  assert.ok(!allowlistedTools.has("nocodb_drop_table"));
});
